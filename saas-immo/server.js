// Fichier : server.js (Version FINALE - CORS Fix Manuel)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const { Resend } = require('resend');
const axios = require('axios');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; 
const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- 1. MIDDLEWARES (CORS + JSON) - EN PREMIER ---
// Middleware CORS manuel pour gérer OPTIONS en premier
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24h cache

  // Si c'est une requête OPTIONS (preflight), on répond immédiatement 200 OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());


// --- FONCTION LOG ---
async function logActivity(agentId, action, description) {
  try {
    if (!agentId) return; 
    await prisma.activityLog.create({ data: { agentId, action, description } });
    console.log(`📝 Activité : ${action}`);
  } catch (e) { console.error("Log erreur:", e); }
}

// --- 3. ROUTES PUBLIQUES (Sans mot de passe) ---

app.get('/', (req, res) => res.json({ message: "Serveur en ligne !" }));

// INSCRIPTION AGENT
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error("Erreur Register:", error);
    res.status(500).json({ error: 'Erreur serveur inscription.' });
  }
});

// CONNEXION
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token });
  } catch (e) { res.status(500).json({ error: "Erreur connexion" }); }
});

// CAPTURE DE LEADS
app.post('/api/public/leads', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message, propertyId } = req.body;
    const property = await prisma.property.findUnique({ where: { id: parseInt(propertyId) } });
    if (!property) return res.status(404).json({ error: "Bien introuvable" });

    // 1. Créer ou récupérer le contact
    let contact = await prisma.contact.findFirst({ where: { email, agentId: property.agentId } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: { firstName, lastName, email, phoneNumber: phone, type: 'BUYER', agentId: property.agentId }
        });
    }

    // 2. Marquer le contact comme INTERESTED pour ce bien (s'il ne l'est pas déjà)
    const existingInterest = await prisma.propertyOwner.findFirst({
        where: { propertyId: property.id, contactId: contact.id, type: 'INTERESTED' }
    });

    if (!existingInterest) {
        await prisma.propertyOwner.create({
            data: { propertyId: property.id, contactId: contact.id, type: 'INTERESTED' }
        });
    }

    // 3. Créer une tâche pour l'agent
    await prisma.task.create({
        data: {
            title: `📢 LEAD : ${firstName} ${lastName} sur ${property.address}`,
            status: 'PENDING', agentId: property.agentId, contactId: contact.id, propertyId: property.id, dueDate: new Date()
        }
    });

    logActivity(property.agentId, "NOUVEAU_LEAD", `Lead pour ${property.address}`);

    // 4. Envoyer un email de notification
    try {
        // Remplace par ton email si besoin
        await resend.emails.send({
          from: 'onboarding@resend.dev', to: 'amirelattaoui49@gmail.com',
          subject: `🔥 Lead: ${property.address}`,
          html: `<p>Nouveau client : ${firstName} ${lastName} (${phone})</p>`
        });
    } catch (e) {}

    res.json({ message: "OK" });
  } catch (e) {
    console.error("Erreur capture lead:", e);
    res.status(500).json({error: "Erreur"});
  }
});

// VOIR UN BIEN PUBLIC
app.get('/api/public/properties/:id', async (req, res) => {
  const p = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true }});
  p ? res.json(p) : res.status(404).json({error: "Introuvable"});
});


// --- 4. MIDDLEWARE D'AUTHENTIFICATION ---
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (e) { res.sendStatus(403); }
};

app.get('/api/me', authenticateToken, (req, res) => res.json(req.user));


// --- 5. ROUTES PROTÉGÉES (Biens, Contacts, Tâches, Factures) ---

// BIENS
app.get('/api/properties', authenticateToken, async (req, res) => {
    const { minPrice, maxPrice, minRooms, city } = req.query;
    const filters = {};
    if (minPrice) filters.price = { gte: parseInt(minPrice) };
    if (maxPrice) filters.price = { ...filters.price, lte: parseInt(maxPrice) };
    if (minRooms) filters.rooms = { gte: parseInt(minRooms) };
    if (city) filters.city = { contains: city, mode: 'insensitive' };

    const properties = await prisma.property.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        include: {
            agent: true,
            owners: {
                include: { contact: true }
            }
        }
    });
    res.json(properties);
});

app.post('/api/properties', authenticateToken, async (req, res) => {
    try {
        let lat = null, lon = null;
        try {
            const query = `${req.body.address} ${req.body.postalCode} ${req.body.city}`;
            const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, { params: { q: query, format: 'json', limit: 1 } });
            if (geoRes.data.length > 0) {
                lat = parseFloat(geoRes.data[0].lat);
                lon = parseFloat(geoRes.data[0].lon);
            }
        } catch(e) {}

        const newProperty = await prisma.property.create({ 
            data: { ...req.body, 
                price: parseInt(req.body.price), 
                area: parseInt(req.body.area),
                rooms: parseInt(req.body.rooms),
                bedrooms: parseInt(req.body.bedrooms),
                latitude: lat, longitude: lon,
                agentId: req.user.id 
            } 
        });
        logActivity(req.user.id, "CRÉATION_BIEN", `Ajout du bien : ${req.body.address}`);
        res.status(201).json(newProperty);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.put('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await prisma.property.update({ 
            where: { id: parseInt(req.params.id) }, 
            data: { ...req.body, 
                price: parseInt(req.body.price), 
                area: parseInt(req.body.area),
                rooms: parseInt(req.body.rooms),
                bedrooms: parseInt(req.body.bedrooms)
            } 
        });
        logActivity(req.user.id, "MODIF_BIEN", `Modification : ${updated.address}`);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.property.delete({ where: { id: parseInt(req.params.id) } });
        logActivity(req.user.id, "SUPPRESSION_BIEN", `Suppression bien`);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.get('/api/properties/:id', authenticateToken, async (req, res) => {
    const p = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true } });
    p ? res.json(p) : res.status(404).json({ error: "Non trouvé" });
});

// CONTACTS
app.get('/api/contacts', authenticateToken, async (req, res) => {
    const c = await prisma.contact.findMany({ orderBy: { lastName: 'asc' }, include: { agent: true } });
    res.json(c);
});

app.post('/api/contacts', authenticateToken, async (req, res) => {
    try {
        const newContact = await prisma.contact.create({ data: { ...req.body, agentId: req.user.id } });
        logActivity(req.user.id, "CRÉATION_CONTACT", `Nouveau contact : ${req.body.firstName}`);
        res.json(newContact);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.get('/api/contacts/:id', authenticateToken, async (req, res) => {
    const c = await prisma.contact.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true } });
    c ? res.json(c) : res.status(404).json({ error: "Non trouvé" });
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updated = await prisma.contact.update({ 
            where: { id: id }, 
            data: { 
                firstName: req.body.firstName, 
                lastName: req.body.lastName, 
                email: req.body.email, 
                phoneNumber: req.body.phoneNumber, 
                type: req.body.type 
            } 
        });
        logActivity(req.user.id, "MODIF_CONTACT", `Modification contact : ${updated.lastName}`);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

// 5. Supprimer un contact (Version "Nettoyeur")
app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

      // ÉTAPE 1 : On supprime d'abord les factures de ce client
      // (Comme ça, plus rien ne retient le contact)
      await prisma.invoice.deleteMany({
        where: { contactId: id }
      });

      // ÉTAPE 2 : On supprime le contact (maintenant qu'il est libre)
      await prisma.contact.delete({ 
        where: { id: id } 
      });

      // Log
      try {
        await logActivity(req.user.id, "SUPPRESSION_CONTACT", `Suppression contact (et ses factures)`);
      } catch(e) {}

      res.status(204).send();

    } catch (error) {
      console.error("Erreur DELETE Contact:", error);
      // On renvoie le vrai message d'erreur pour comprendre si ça plante encore
      res.status(500).json({ error: "Erreur : " + error.message });
    }
});

// TÂCHES
app.get('/api/tasks', authenticateToken, async (req, res) => {
    const t = await prisma.task.findMany({ 
        where: { agentId: req.user.id }, 
        include: { contact: true, property: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(t);
});

// 1. Créer une tâche (Version Sécurisée)
app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, dueDate, contactId, propertyId } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: "Le titre est requis." });
        }

        // 1. On crée la tâche
        const newTask = await prisma.task.create({
            data: {
                title: title,
                dueDate: dueDate ? new Date(dueDate) : null,
                agentId: req.user.id,
                // On s'assure que les IDs sont bien des nombres ou null
                contactId: contactId ? parseInt(contactId) : null,
                propertyId: propertyId ? parseInt(propertyId) : null
            }
        });
        
        // 2. On essaie d'enregistrer l'activité (mais on ne plante pas si ça rate)
        try {
            // Vérifie que la fonction existe avant de l'appeler
            if (typeof logActivity === 'function') {
                await logActivity(req.user.id, "CRÉATION_TÂCHE", `Tâche : ${title}`);
            }
        } catch (logError) {
            console.error("Erreur optionnelle (Log):", logError);
        }
        
        res.status(201).json(newTask);

    } catch (error) {
        console.error("Erreur POST /api/tasks:", error); // Regarde les logs Render si ça plante ici
        res.status(500).json({ error: "Erreur création tâche : " + error.message });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const t = await prisma.task.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        if (req.body.status === 'DONE') logActivity(req.user.id, "TÂCHE_TERMINÉE", `Tâche finie : ${t.title}`);
        res.json(t);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
});

// FACTURES
app.get('/api/invoices', authenticateToken, async (req, res) => {
    const i = await prisma.invoice.findMany({ include: { contact: true }, orderBy: { createdAt: 'desc' } });
    res.json(i);
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
    try {
        const ref = `FAC-${Date.now().toString().slice(-6)}`; 
        const newInvoice = await prisma.invoice.create({
            data: {
                ref,
                amount: parseInt(req.body.amount),
                description: req.body.description || "Honoraires",
                status: req.body.status || "PENDING",
                agentId: req.user.id,
                contactId: parseInt(req.body.contactId)
            }
        });
        logActivity(req.user.id, "CRÉATION_FACTURE", `Facture : ${ref}`);
        res.status(201).json(newInvoice);
    } catch(e) { res.status(500).json({ error: "Erreur facture" }); }
});

// ACTIVITÉS & STATS
app.get('/api/activities', authenticateToken, async (req, res) => {
    const logs = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' }, take: 50,
        include: { agent: { select: { firstName: true, lastName: true } } }
    });
    res.json(logs);
});

app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const [p, c, b, s, t] = await Promise.all([
            prisma.property.count(),
            prisma.contact.count(),
            prisma.contact.count({ where: { type: 'BUYER' } }),
            prisma.contact.count({ where: { type: 'SELLER' } }),
            prisma.task.count({ where: { agentId: req.user.id, status: 'PENDING' } })
        ]);
        res.json({ properties: {total: p}, contacts: {total: c, buyers: b, sellers: s}, tasks: {pending: t, done: 0} });
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

// ÉQUIPE
app.get('/api/agents', authenticateToken, async (req, res) => {
    const agents = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true }
    });
    res.json(agents);
});

// --- ROUTES RELATION BIEN-CONTACT (Propriétaires) ---

// Ajouter un propriétaire/intéressé à un bien
app.post('/api/properties/:propertyId/owners', authenticateToken, async (req, res) => {
    try {
        const { contactId, type } = req.body; // type = "OWNER" ou "INTERESTED"
        const propertyId = parseInt(req.params.propertyId);
        const relationType = type || "OWNER"; // Par défaut OWNER

        // Vérifier si la relation existe déjà
        const existing = await prisma.propertyOwner.findFirst({
            where: { propertyId, contactId: parseInt(contactId), type: relationType }
        });

        if (existing) {
            return res.status(400).json({ error: `Ce contact est déjà ${relationType === 'OWNER' ? 'propriétaire' : 'intéressé'} pour ce bien` });
        }

        const newOwner = await prisma.propertyOwner.create({
            data: { propertyId, contactId: parseInt(contactId), type: relationType }
        });

        const actionLabel = relationType === 'OWNER' ? "AJOUT_PROPRIÉTAIRE" : "AJOUT_INTÉRESSÉ";
        const descLabel = relationType === 'OWNER' ? "Propriétaire ajouté" : "Contact intéressé ajouté";
        logActivity(req.user.id, actionLabel, `${descLabel} au bien ID ${propertyId}`);
        res.status(201).json(newOwner);
    } catch (e) {
        console.error("Erreur ajout propriétaire:", e);
        res.status(500).json({ error: "Erreur lors de l'ajout du propriétaire" });
    }
});

// Retirer un propriétaire/intéressé d'un bien
app.delete('/api/properties/:propertyId/owners/:contactId', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId);
        const contactId = parseInt(req.params.contactId);
        const { type } = req.query; // type optionnel dans les query params

        const where = { propertyId, contactId };
        if (type) where.type = type; // Si type fourni, on supprime uniquement cette relation

        await prisma.propertyOwner.deleteMany({ where });

        logActivity(req.user.id, "RETRAIT_PROPRIÉTAIRE", `Relation retirée du bien ID ${propertyId}`);
        res.status(204).send();
    } catch (e) {
        console.error("Erreur retrait propriétaire:", e);
        res.status(500).json({ error: "Erreur lors du retrait du propriétaire" });
    }
});

// Obtenir tous les propriétaires/intéressés d'un bien
app.get('/api/properties/:propertyId/owners', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId);
        const owners = await prisma.propertyOwner.findMany({
            where: { propertyId },
            include: { contact: true }
        });
        // On retourne maintenant la relation complète avec le type
        res.json(owners.map(o => ({ ...o.contact, relationType: o.type })));
    } catch (e) {
        res.status(500).json({ error: "Erreur" });
    }
});

// Obtenir tous les biens d'un contact
app.get('/api/contacts/:contactId/properties', authenticateToken, async (req, res) => {
    try {
        const contactId = parseInt(req.params.contactId);
        const properties = await prisma.propertyOwner.findMany({
            where: { contactId },
            include: { property: true }
        });
        res.json(properties.map(p => p.property));
    } catch (e) {
        res.status(500).json({ error: "Erreur" });
    }
});

// --- ROUTE PAIEMENT (STRIPE) ---
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // C'est un abonnement récurrent
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abonnement ImmoPro Premium',
            },
            unit_amount: 2900, // 29.00€ (en centimes)
            recurring: {
              interval: 'month', // Facturé tous les mois
            },
          },
          quantity: 1,
        },
      ],
      // Redirection après paiement (Change l'URL par la tienne plus tard)
      success_url: 'https://saas-immo-final.vercel.app/?success=true',
      cancel_url: 'https://saas-immo-final.vercel.app/?canceled=true',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    res.status(500).json({ error: "Erreur création paiement" });
  }
});

// DÉMARRAGE
app.listen(PORT, () => {
  console.log(`✅ Serveur OK sur port ${PORT}`);
  console.log(`✅ CORS Manuel activé - Version Dec 8 2025`);
  console.log(`✅ Middleware OPTIONS configuré`);
});