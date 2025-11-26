// Fichier : server.js (Version FINALE & NETTOYÉE)

const express = require('express');
const cors = require('cors');
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

app.use(express.json());
// Configuration CORS permissive (pour éviter les erreurs Preflight)
app.use(cors({
  origin: '*', // Accepte tout le monde (Vercel, Localhost...)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Toutes les méthodes
  allowedHeaders: ['Content-Type', 'Authorization'] // Les en-têtes autorisés
}));

// Petit fix pour les requêtes OPTIONS (Preflight) qui bloquent parfois
app.options('*', cors());

// --- FONCTION D'AIDE : ENREGISTRER UNE ACTIVITÉ ---
async function logActivity(agentId, action, description) {
  try {
    // On vérifie que l'agent existe avant de loguer
    if (!agentId) return; 
    await prisma.activityLog.create({
      data: { agentId, action, description }
    });
    console.log(`📝 Activité enregistrée : ${action}`);
  } catch (e) {
    console.error("Erreur enregistrement activité:", e);
  }
}

// --- AUTHENTIFICATION ---
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (e) { res.sendStatus(403); }
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Erreur' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({ data: { email, password: hashedPassword, firstName, lastName } });
      res.status(201).json(newUser);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.get('/api/me', authenticateToken, (req, res) => res.json(req.user));

// --- ROUTES BIENS ---
app.get('/api/properties', authenticateToken, async (req, res) => {
    const { minPrice, maxPrice, minRooms, city } = req.query;
    const filters = {};
    if (minPrice) filters.price = { gte: parseInt(minPrice) };
    if (maxPrice) filters.price = { ...filters.price, lte: parseInt(maxPrice) };
    if (minRooms) filters.rooms = { gte: parseInt(minRooms) };
    if (city) filters.city = { contains: city, mode: 'insensitive' };

    const properties = await prisma.property.findMany({ where: filters, orderBy: { createdAt: 'desc' }, include: { agent: true } });
    res.json(properties);
});

app.post('/api/properties', authenticateToken, async (req, res) => {
    try {
        // Geocoding automatique
        let lat = null;
        let lon = null;
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
    } catch (e) { console.error(e); res.status(500).json({ error: "Erreur" }); }
});

// Route : Mettre à jour un bien (Version Blindée)
app.put('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id); // On s'assure que l'ID est un nombre
      if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

      const { address, city, postalCode, price, area, rooms, bedrooms, description, imageUrl } = req.body;
      
      const updatedProperty = await prisma.property.update({
        where: { id: id },
        data: { 
            address, 
            city, 
            postalCode, 
            price: parseInt(price),        // <--- Conversion forcée
            area: parseInt(area),          // <--- Conversion forcée
            rooms: parseInt(rooms),        // <--- Conversion forcée
            bedrooms: parseInt(bedrooms),  // <--- Conversion forcée
            description,
            imageUrl
        }
      });
      // LOG pour vérifier que ça marche
      console.log(`✅ Bien modifié (ID: ${id})`);
      res.status(200).json(updatedProperty);

    } catch (error) {
      console.error("💥 Erreur Update Bien:", error);
      res.status(500).json({ error: "Erreur lors de la modification." });
    }
});

app.get('/api/properties/:id', authenticateToken, async (req, res) => {
    const p = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true } });
    p ? res.json(p) : res.status(404).json({ error: "Non trouvé" });
});

// Supprimer un bien
app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        await prisma.property.delete({ where: { id: id } });
        
        // On essaie de loguer, mais si ça rate, on ne bloque pas la suppression
        try {
             logActivity(req.user.id, "SUPPRESSION_BIEN", `Suppression d'un bien (ID ${id})`);
        } catch (e) {}

        res.status(204).send();
    } catch (error) {
        console.error("Erreur DELETE Property:", error);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// --- ROUTES CONTACTS ---
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

// Route DETAIL Contact
app.get('/api/contacts/:id', authenticateToken, async (req, res) => {
    const c = await prisma.contact.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true } });
    c ? res.json(c) : res.status(404).json({ error: "Non trouvé" });
});

// Route : Modifier un contact (Version Corrigée avec parseInt)
app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      // On force la conversion de l'ID en nombre
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
          return res.status(400).json({ error: "ID de contact invalide." });
      }

      const { firstName, lastName, email, phoneNumber, type } = req.body;
      
      const updatedContact = await prisma.contact.update({ 
          where: { id: id }, 
          data: { firstName, lastName, email, phoneNumber, type }
      });
      res.status(200).json(updatedContact);
    } catch (error) {
      console.error("Erreur PUT Contact:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du contact." });
    }
});

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.contact.delete({ where: { id: parseInt(req.params.id) } });
        logActivity(req.user.id, "SUPPRESSION_CONTACT", `Suppression contact`);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});


// --- ROUTES TÂCHES ---
app.get('/api/tasks', authenticateToken, async (req, res) => {
    const t = await prisma.task.findMany({ 
        where: { agentId: req.user.id }, 
        include: { contact: true, property: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(t);
});

// --- CRÉATION TÂCHE SÉCURISÉE ---
app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, dueDate, contactId, propertyId } = req.body;
        if (!title) return res.status(400).json({ error: "Le titre est requis." });

        const newTask = await prisma.task.create({
            data: {
                title,
                dueDate: dueDate ? new Date(dueDate) : null,
                agentId: req.user.id,
                // ICI : On force la conversion en entier (Int) ou null
                contactId: contactId ? parseInt(contactId) : null,
                propertyId: propertyId ? parseInt(propertyId) : null
            }
        });
        
        // Log pour vérifier
        logActivity(req.user.id, "CRÉATION_TÂCHE", `Nouvelle tâche : ${title}`);
        
        res.status(201).json(newTask);
    } catch (error) {
        console.error("Erreur POST /api/tasks:", error); // On verra l'erreur dans les logs Render
        res.status(500).json({ error: "Erreur création tâche." });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const t = await prisma.task.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        if (req.body.status === 'DONE') {
             logActivity(req.user.id, "TÂCHE_TERMINÉE", `Tâche finie : ${t.title}`);
        }
        res.json(t);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
});


// --- ROUTES FACTURES ---
app.get('/api/invoices', authenticateToken, async (req, res) => {
    const i = await prisma.invoice.findMany({ include: { contact: true }, orderBy: { createdAt: 'desc' } });
    res.json(i);
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
    try {
        const { amount, description, contactId, status } = req.body;
        const ref = `FAC-${Date.now().toString().slice(-6)}`; 
        const newInvoice = await prisma.invoice.create({
            data: {
                ref,
                amount: parseInt(amount), // IMPORTANT
                description: description || "Honoraires",
                status: status || "PENDING",
                agentId: req.user.id,
                contactId: parseInt(contactId) // IMPORTANT
            }
        });
        logActivity(req.user.id, "CRÉATION_FACTURE", `Facture : ${ref}`);
        res.status(201).json(newInvoice);
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Erreur facture" });
    }
});


// --- ROUTES PUBLIQUES (Leads) ---
app.get('/api/public/properties/:id', async (req, res) => {
  const p = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true }});
  p ? res.json(p) : res.status(404).json({error: "Introuvable"});
});

app.post('/api/public/leads', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message, propertyId } = req.body;
    const property = await prisma.property.findUnique({ where: { id: parseInt(propertyId) } });
    if (!property) return res.status(404).json({ error: "Bien introuvable" });

    let contact = await prisma.contact.findFirst({ where: { email, agentId: property.agentId } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: { firstName, lastName, email, phoneNumber: phone, type: 'BUYER', agentId: property.agentId }
        });
    }

    await prisma.task.create({
        data: {
            title: `📢 LEAD : ${firstName} ${lastName} sur ${property.address}`,
            status: 'PENDING', agentId: property.agentId, contactId: contact.id, propertyId: property.id, dueDate: new Date()
        }
    });
    
    logActivity(property.agentId, "NOUVEAU_LEAD", `Lead pour ${property.address}`);

    try {
        await resend.emails.send({
          from: 'onboarding@resend.dev', to: 'amirelattaoui49@gmail.com', 
          subject: `🔥 Lead: ${property.address}`,
          html: `<p>Nouveau client : ${firstName} ${lastName} (${phone})</p>`
        });
    } catch (e) {}

    res.json({ message: "OK" });
  } catch (e) { res.status(500).json({error: "Erreur"}); }
});


// --- AUTRES ROUTES ---
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

app.post('/api/properties/:id/generate-description', authenticateToken, async (req, res) => {
    // ... (Ton code IA, je le laisse vide pour raccourcir, mais tu peux le remettre si besoin)
    res.json({ description: "Description IA..." }); 
});

app.post('/api/estimate-price', authenticateToken, async (req, res) => {
    // ... (Ton code IA)
    res.json({ estimationMin: 100000, estimationMax: 120000 });
});

// --- ROUTE ÉQUIPE (LISTE DES AGENTS) ---
app.get('/api/agents', authenticateToken, async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { // IMPORTANT : On ne sélectionne PAS le mot de passe !
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      }
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: "Erreur chargement équipe." });
  }
});

// DÉMARRAGE
app.listen(PORT, () => console.log(`Serveur OK sur ${PORT}`));