// Fichier : server.js (Version FINALE - CORS Fix Manuel + RDV + PDF + AI Photos)
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const { Resend } = require('resend');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const https = require('https');
const http = require('http');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Trust proxy (nécessaire pour Render/Heroku/Vercel pour que rate-limit fonctionne correctement)
app.set('trust proxy', true);

// Force JWT_SECRET (ne pas utiliser de valeur par défaut en production)
if (!process.env.JWT_SECRET) {
  console.error('❌ ERREUR : JWT_SECRET manquant dans .env');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Vérification de la clé OpenAI (optionnel mais recommandé si vous utilisez l'IA)
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  ATTENTION : OPENAI_API_KEY manquant - La génération IA sera désactivée');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// --- 1. MIDDLEWARES (CORS + JSON) - EN PREMIER ---
// Liste des origines autorisées (frontend Vercel + localhost dev)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

// Middleware CORS sécurisé avec vérification de l'origine
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Vérifier si l'origine est dans la liste autorisée
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24h cache
  res.header('Access-Control-Allow-Credentials', 'true');

  // Si c'est une requête OPTIONS (preflight), on répond immédiatement 200 OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// --- 2. RATE LIMITING (Protection contre brute-force) ---
// Limiter les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 tentatives
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter les inscriptions
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Max 3 inscriptions par heure par IP
  message: { error: "Trop d'inscriptions. Réessayez dans 1 heure." }
});

// Limiter les requêtes générales
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requêtes par minute
  message: { error: "Trop de requêtes. Ralentissez." }
});

app.use('/api/', generalLimiter);

// --- FONCTION DE VALIDATION EMAIL ---
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

// INSCRIPTION AGENT (avec rate limiting)
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    // Validation de l'email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide.' });
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

// CONNEXION (avec rate limiting contre brute-force)
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation de l'email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    // Générer un token JWT avec expiration de 24h
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (e) { res.status(500).json({ error: "Erreur connexion" }); }
});

// CAPTURE DE LEADS
app.post('/api/public/leads', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message, propertyId } = req.body;

    // Validation de l'email
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide.' });
    }

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
    // 🔒 ISOLATION : Filtrer uniquement les biens de cet agent
    const filters = { agentId: req.user.id };
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
        // 🔒 ISOLATION : Vérifier que le bien appartient à l'agent
        const property = await prisma.property.findFirst({
            where: { id: parseInt(req.params.id), agentId: req.user.id }
        });
        if (!property) return res.status(404).json({ error: "Bien non trouvé ou non autorisé" });

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
        // 🔒 ISOLATION : Vérifier que le bien appartient à l'agent avant de le supprimer
        const property = await prisma.property.findFirst({
            where: { id: parseInt(req.params.id), agentId: req.user.id }
        });
        if (!property) return res.status(404).json({ error: "Bien non trouvé ou non autorisé" });

        await prisma.property.delete({ where: { id: parseInt(req.params.id) } });
        logActivity(req.user.id, "SUPPRESSION_BIEN", `Suppression bien`);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.get('/api/properties/:id', authenticateToken, async (req, res) => {
    // 🔒 ISOLATION : Récupérer uniquement si le bien appartient à l'agent
    const p = await prisma.property.findFirst({
        where: { id: parseInt(req.params.id), agentId: req.user.id },
        include: { agent: true }
    });
    p ? res.json(p) : res.status(404).json({ error: "Non trouvé ou non autorisé" });
});

// CONTACTS
app.get('/api/contacts', authenticateToken, async (req, res) => {
    // 🔒 ISOLATION : Récupérer uniquement les contacts de l'agent
    const c = await prisma.contact.findMany({
        where: { agentId: req.user.id },
        orderBy: { lastName: 'asc' },
        include: { agent: true }
    });
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
    // 🔒 ISOLATION : Récupérer uniquement si le contact appartient à l'agent
    const c = await prisma.contact.findFirst({
        where: { id: parseInt(req.params.id), agentId: req.user.id },
        include: { agent: true }
    });
    c ? res.json(c) : res.status(404).json({ error: "Non trouvé ou non autorisé" });
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // 🔒 ISOLATION : Vérifier que le contact appartient à l'agent
        const contact = await prisma.contact.findFirst({
            where: { id: id, agentId: req.user.id }
        });
        if (!contact) return res.status(404).json({ error: "Contact non trouvé ou non autorisé" });

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

      // 🔒 ISOLATION : Vérifier que le contact appartient à l'agent
      const contact = await prisma.contact.findFirst({
          where: { id: id, agentId: req.user.id }
      });
      if (!contact) return res.status(404).json({ error: "Contact non trouvé ou non autorisé" });

      // ÉTAPE 1 : On supprime d'abord les factures de ce client (avec isolation)
      await prisma.invoice.deleteMany({
        where: { contactId: id, agentId: req.user.id }
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
        // 🔒 ISOLATION : Vérifier que la tâche appartient à l'agent
        const task = await prisma.task.findFirst({
            where: { id: parseInt(req.params.id), agentId: req.user.id }
        });
        if (!task) return res.status(404).json({ error: "Tâche non trouvée ou non autorisée" });

        const t = await prisma.task.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        if (req.body.status === 'DONE') logActivity(req.user.id, "TÂCHE_TERMINÉE", `Tâche finie : ${t.title}`);
        res.json(t);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        // 🔒 ISOLATION : Vérifier que la tâche appartient à l'agent
        const task = await prisma.task.findFirst({
            where: { id: parseInt(req.params.id), agentId: req.user.id }
        });
        if (!task) return res.status(404).json({ error: "Tâche non trouvée ou non autorisée" });

        await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

// FACTURES
app.get('/api/invoices', authenticateToken, async (req, res) => {
    // 🔒 ISOLATION : Récupérer uniquement les factures de l'agent
    const i = await prisma.invoice.findMany({
        where: { agentId: req.user.id },
        include: { contact: true },
        orderBy: { createdAt: 'desc' }
    });
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
    // 🔒 ISOLATION : Récupérer uniquement les activités de l'agent
    const logs = await prisma.activityLog.findMany({
        where: { agentId: req.user.id },
        orderBy: { createdAt: 'desc' }, take: 50,
        include: { agent: { select: { firstName: true, lastName: true } } }
    });
    res.json(logs);
});

app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        // 🔒 ISOLATION : Compter uniquement les données de l'agent
        const [p, c, b, s, t] = await Promise.all([
            prisma.property.count({ where: { agentId: req.user.id } }),
            prisma.contact.count({ where: { agentId: req.user.id } }),
            prisma.contact.count({ where: { agentId: req.user.id, type: 'BUYER' } }),
            prisma.contact.count({ where: { agentId: req.user.id, type: 'SELLER' } }),
            prisma.task.count({ where: { agentId: req.user.id, status: 'PENDING' } })
        ]);
        res.json({ properties: {total: p}, contacts: {total: c, buyers: b, sellers: s}, tasks: {pending: t, done: 0} });
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

// IA - GÉNÉRATION DE DESCRIPTION
app.post('/api/generate-description', authenticateToken, async (req, res) => {
    try {
        // Vérifier si OpenAI est configuré
        if (!openai) {
            return res.status(503).json({
                error: "La clé API OpenAI n'est pas configurée sur le serveur. Contactez l'administrateur."
            });
        }

        const { address, city, price, area, rooms, bedrooms } = req.body;

        // Construire le prompt pour GPT
        const prompt = `Tu es un expert en rédaction d'annonces immobilières. Rédige une description vendeuse et attractive pour ce bien immobilier en français :

Adresse : ${address || 'Non spécifiée'}
Ville : ${city || 'Non spécifiée'}
Prix : ${price ? `${parseInt(price).toLocaleString()} €` : 'Non spécifié'}
Surface : ${area ? `${area} m²` : 'Non spécifiée'}
Nombre de pièces : ${rooms || 'Non spécifié'}
Nombre de chambres : ${bedrooms || 'Non spécifié'}

Consignes :
- Ton professionnel et vendeur
- 3-4 paragraphes maximum
- Mets en avant les atouts du bien
- Utilise un vocabulaire immobilier approprié
- Sois concis et impactant
- Ne mentionne pas d'informations que tu n'as pas

Description :`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Tu es un rédacteur d'annonces immobilières expert." },
                { role: "user", content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        const description = completion.choices[0].message.content.trim();

        logActivity(req.user.id, "GÉNÉRATION_IA", `Description générée pour ${address || 'bien'}`);

        res.json({ description });
    } catch (error) {
        console.error("Erreur génération IA:", error);
        console.error("Détails:", error.message);
        res.status(500).json({ error: "Impossible de générer la description. Vérifiez les logs serveur." });
    }
});

// 🎯 MATCHING AUTOMATIQUE - Trouver les acheteurs correspondants à un bien
app.get('/api/properties/:id/matches', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);

        // Récupérer le bien
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { agent: true }
        });

        if (!property || property.agentId !== req.user.id) {
            return res.status(404).json({ error: "Bien non trouvé" });
        }

        // Fonction pour normaliser les noms de villes (enlever accents, espaces, etc.)
        const normalizeCity = (city) => {
            if (!city) return '';
            return city
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
                .replace(/[^a-z0-9]/g, ''); // Enlever caractères spéciaux
        };

        // Récupérer TOUS les contacts de type BUYER (on va scorer ensuite)
        const allBuyers = await prisma.contact.findMany({
            where: {
                agentId: req.user.id,
                type: "BUYER"
            }
        });

        // Système de scoring pour chaque contact
        const scoredMatches = allBuyers.map(contact => {
            let score = 0;
            let matchDetails = {
                budgetMatch: false,
                cityMatch: false,
                bedroomsMatch: false,
                areaMatch: false,
                reasons: []
            };

            // 1. BUDGET (40 points max)
            if (contact.budgetMin !== null || contact.budgetMax !== null) {
                const budgetMinOk = contact.budgetMin === null || contact.budgetMin <= property.price;
                const budgetMaxOk = contact.budgetMax === null || contact.budgetMax >= property.price;

                if (budgetMinOk && budgetMaxOk) {
                    score += 40;
                    matchDetails.budgetMatch = true;
                    matchDetails.reasons.push("✅ Budget compatible");
                } else {
                    // Matching partiel : si le prix est proche de la fourchette (marge de 10%)
                    if (contact.budgetMax && property.price <= contact.budgetMax * 1.1) {
                        score += 20;
                        matchDetails.reasons.push("⚠️ Prix légèrement au-dessus du budget");
                    } else if (contact.budgetMin && property.price >= contact.budgetMin * 0.9) {
                        score += 20;
                        matchDetails.reasons.push("⚠️ Prix légèrement en-dessous du budget");
                    } else {
                        matchDetails.reasons.push("❌ Budget incompatible");
                    }
                }
            } else {
                // Pas de critère budget = match par défaut
                score += 40;
                matchDetails.budgetMatch = true;
            }

            // 2. VILLE (30 points)
            if (contact.cityPreferences && contact.cityPreferences.trim() !== '') {
                const normalizedPropertyCity = normalizeCity(property.city);
                const cities = contact.cityPreferences
                    .split(',')
                    .map(c => normalizeCity(c))
                    .filter(c => c.length > 0);

                if (cities.includes(normalizedPropertyCity)) {
                    score += 30;
                    matchDetails.cityMatch = true;
                    matchDetails.reasons.push("✅ Ville recherchée");
                } else {
                    matchDetails.reasons.push(`❌ Ville non recherchée (cherche: ${contact.cityPreferences})`);
                }
            } else {
                // Pas de préférence de ville = match par défaut
                score += 30;
                matchDetails.cityMatch = true;
            }

            // 3. CHAMBRES (15 points)
            if (contact.minBedrooms !== null) {
                if (property.bedrooms >= contact.minBedrooms) {
                    score += 15;
                    matchDetails.bedroomsMatch = true;
                    matchDetails.reasons.push(`✅ Assez de chambres (${property.bedrooms}/${contact.minBedrooms})`);
                } else {
                    // Matching partiel : s'il manque juste 1 chambre
                    if (property.bedrooms === contact.minBedrooms - 1) {
                        score += 8;
                        matchDetails.reasons.push(`⚠️ Presque assez de chambres (${property.bedrooms}/${contact.minBedrooms})`);
                    } else {
                        matchDetails.reasons.push(`❌ Pas assez de chambres (${property.bedrooms}/${contact.minBedrooms})`);
                    }
                }
            } else {
                score += 15;
                matchDetails.bedroomsMatch = true;
            }

            // 4. SURFACE (15 points)
            if (contact.minArea !== null) {
                if (property.area >= contact.minArea) {
                    score += 15;
                    matchDetails.areaMatch = true;
                    matchDetails.reasons.push(`✅ Surface suffisante (${property.area}m²/${contact.minArea}m²)`);
                } else {
                    // Matching partiel : si la surface est à moins de 10% de la surface demandée
                    const areaDiff = (contact.minArea - property.area) / contact.minArea;
                    if (areaDiff <= 0.1) {
                        score += 8;
                        matchDetails.reasons.push(`⚠️ Surface légèrement insuffisante (${property.area}m²/${contact.minArea}m²)`);
                    } else {
                        matchDetails.reasons.push(`❌ Surface insuffisante (${property.area}m²/${contact.minArea}m²)`);
                    }
                }
            } else {
                score += 15;
                matchDetails.areaMatch = true;
            }

            return {
                ...contact,
                matchScore: score,
                matchDetails
            };
        });

        // Filtrer pour ne garder que les matches avec un score >= 50/100 (au moins 50% de compatibilité)
        // Et trier par score décroissant
        const finalMatches = scoredMatches
            .filter(contact => contact.matchScore >= 50)
            .sort((a, b) => b.matchScore - a.matchScore);

        res.json({
            property,
            matches: finalMatches,
            count: finalMatches.length,
            averageScore: finalMatches.length > 0
                ? Math.round(finalMatches.reduce((acc, m) => acc + m.matchScore, 0) / finalMatches.length)
                : 0
        });

    } catch (error) {
        console.error("Erreur matching:", error);
        res.status(500).json({ error: "Erreur lors du matching" });
    }
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

// ================================
// 📅 ENDPOINTS RENDEZ-VOUS (PUBLICS)
// ================================

// Obtenir les créneaux disponibles pour un agent (PUBLIC - pas besoin d'auth)
app.get('/api/public/agents/:agentId/availability', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const { date } = req.query; // Format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ error: "Date requise (format: YYYY-MM-DD)" });
    }

    // Créneaux par défaut (9h-18h, créneaux de 1h)
    const defaultSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Récupérer les rendez-vous existants pour cette date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        agentId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'CANCELLED' }
      }
    });

    // Récupérer les tâches existantes pour cette date
    const existingTasks = await prisma.task.findMany({
      where: {
        agentId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'DONE' }
      }
    });

    // Marquer les créneaux occupés
    const availableSlots = defaultSlots.map(time => {
      const [hours, minutes] = time.split(':');
      const slotDate = new Date(date);
      slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Vérifier si ce créneau est occupé par un RDV
      const hasAppointment = existingAppointments.some(apt => {
        const aptTime = new Date(apt.appointmentDate);
        const diff = Math.abs(aptTime.getTime() - slotDate.getTime());
        return diff < 60 * 60 * 1000; // Moins d'1h de différence
      });

      // Vérifier si ce créneau est occupé par une tâche
      const hasTask = existingTasks.some(task => {
        const taskTime = new Date(task.dueDate);
        const diff = Math.abs(taskTime.getTime() - slotDate.getTime());
        return diff < 60 * 60 * 1000; // Moins d'1h de différence
      });

      return {
        time,
        available: !hasAppointment && !hasTask,
        reason: hasAppointment ? 'Rendez-vous déjà réservé' : hasTask ? 'Tâche planifiée' : null
      };
    });

    res.json({
      date,
      slots: availableSlots
    });

  } catch (error) {
    console.error("Erreur récupération disponibilités:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des disponibilités" });
  }
});

// Créer un rendez-vous (PUBLIC - pas besoin d'auth)
app.post('/api/public/agents/:agentId/appointments', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const { clientName, clientEmail, clientPhone, date, time, notes } = req.body;

    // Validation
    if (!clientName || !clientEmail || !date || !time) {
      return res.status(400).json({ error: "Nom, email, date et heure requis" });
    }

    // Construire la date complète
    const [hours, minutes] = time.split(':');
    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Vérifier que le créneau est toujours disponible
    const startOfHour = new Date(appointmentDate);
    const endOfHour = new Date(appointmentDate);
    endOfHour.setHours(endOfHour.getHours() + 1);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        agentId,
        appointmentDate: {
          gte: startOfHour,
          lt: endOfHour
        },
        status: { not: 'CANCELLED' }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ error: "Ce créneau n'est plus disponible" });
    }

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: {
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        appointmentDate,
        notes: notes || null,
        agentId
      }
    });

    // Log d'activité
    logActivity(agentId, "RDV_PUBLIC", `Nouveau RDV depuis la page publique: ${clientName} le ${appointmentDate.toLocaleString('fr-FR')}`);

    res.status(201).json(appointment);

  } catch (error) {
    console.error("Erreur création rendez-vous:", error);
    res.status(500).json({ error: "Erreur lors de la création du rendez-vous" });
  }
});

// Obtenir les rendez-vous de l'agent connecté (PRIVÉ)
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { agentId: req.user.id },
      orderBy: { appointmentDate: 'asc' }
    });
    res.json(appointments);
  } catch (error) {
    console.error("Erreur récupération rendez-vous:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous" });
  }
});

// Mettre à jour le statut d'un rendez-vous (PRIVÉ)
app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    logActivity(req.user.id, "MAJ_RDV", `Rendez-vous #${id} mis à jour: ${status}`);
    res.json(appointment);

  } catch (error) {
    console.error("Erreur mise à jour rendez-vous:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du rendez-vous" });
  }
});

// ================================
// 📄 GÉNÉRATION DE DOCUMENTS PDF
// ================================

// Fonction helper pour formater la date en français
const formatDateFR = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// 📄 Générer un Bon de Visite
app.get('/api/properties/:id/documents/bon-de-visite', authenticateToken, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { clientName, visitDate } = req.query;

    // Récupérer le bien et l'agent
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: true }
    });

    if (!property || property.agentId !== req.user.id) {
      return res.status(404).json({ error: "Bien non trouvé" });
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });

    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bon-de-visite-${propertyId}.pdf`);

    // Pipe le PDF directement dans la réponse
    doc.pipe(res);

    // === EN-TÊTE ===
    doc.fontSize(24).font('Helvetica-Bold').text('BON DE VISITE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`Document généré le ${formatDateFR(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    // === INFORMATIONS DU BIEN ===
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Informations du bien');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    doc.text(`Adresse : ${property.address}`);
    doc.text(`Code postal : ${property.postalCode || 'N/A'}`);
    doc.text(`Ville : ${property.city || 'N/A'}`);
    doc.moveDown(0.3);
    doc.text(`Type : ${property.type || 'N/A'}`);
    doc.text(`Surface : ${property.area} m²`);
    doc.text(`Nombre de chambres : ${property.bedrooms}`);
    doc.text(`Nombre de pièces : ${property.rooms}`);
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2D3748')
       .text(`Prix : ${property.price.toLocaleString('fr-FR')} €`);
    doc.moveDown(2);

    // === INFORMATIONS DE LA VISITE ===
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Détails de la visite');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    doc.text(`Client : ${clientName || 'Non spécifié'}`);
    doc.text(`Date de visite : ${visitDate ? formatDateFR(visitDate) : formatDateFR(new Date())}`);
    doc.moveDown(0.3);
    doc.text(`Agent immobilier : ${property.agent.firstName} ${property.agent.lastName}`);
    doc.text(`Email de l'agent : ${property.agent.email}`);
    doc.moveDown(3);

    // === OBSERVATIONS ===
    doc.fontSize(16).font('Helvetica-Bold').text('Observations et remarques');
    doc.moveDown(0.5);

    // Zone de texte pour les notes
    doc.rect(50, doc.y, 500, 150).stroke();
    doc.moveDown(10);

    // === SIGNATURES ===
    doc.fontSize(12).font('Helvetica-Bold').text('Signatures', { align: 'center' });
    doc.moveDown(1);

    const signatureY = doc.y;

    // Signature du client (gauche)
    doc.fontSize(10).font('Helvetica').text('Le Client :', 70, signatureY);
    doc.text('Signature :', 70, signatureY + 20);
    doc.moveTo(70, signatureY + 80).lineTo(240, signatureY + 80).stroke();
    doc.text('Date :', 70, signatureY + 90);
    doc.moveTo(70, signatureY + 120).lineTo(240, signatureY + 120).stroke();

    // Signature de l'agent (droite)
    doc.text("L'Agent :", 350, signatureY);
    doc.text('Signature :', 350, signatureY + 20);
    doc.moveTo(350, signatureY + 80).lineTo(520, signatureY + 80).stroke();
    doc.text('Date :', 350, signatureY + 90);
    doc.moveTo(350, signatureY + 120).lineTo(520, signatureY + 120).stroke();

    // === PIED DE PAGE ===
    doc.fontSize(8).fillColor('#999999')
       .text(
         'Ce document certifie que la visite du bien a été effectuée conformément aux règles en vigueur.',
         50,
         doc.page.height - 50,
         { align: 'center', width: 500 }
       );

    doc.end();

    logActivity(req.user.id, "PDF_GENERATED", `Bon de visite généré pour le bien #${propertyId}`);

  } catch (error) {
    console.error("Erreur génération bon de visite:", error);
    res.status(500).json({ error: "Erreur lors de la génération du PDF" });
  }
});

// 📄 Générer une Offre d'Achat
app.get('/api/properties/:id/documents/offre-achat', authenticateToken, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { buyerName, buyerEmail, buyerPhone, offerAmount } = req.query;

    // Récupérer le bien et l'agent
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: true }
    });

    if (!property || property.agentId !== req.user.id) {
      return res.status(404).json({ error: "Bien non trouvé" });
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });

    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=offre-achat-${propertyId}.pdf`);

    doc.pipe(res);

    // === EN-TÊTE ===
    doc.fontSize(24).font('Helvetica-Bold').text("OFFRE D'ACHAT", { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`Document généré le ${formatDateFR(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    // === INFORMATIONS DE L'ACQUÉREUR ===
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text("Informations de l'acquéreur");
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    doc.text(`Nom complet : ${buyerName || '___________________________'}`);
    doc.text(`Email : ${buyerEmail || '___________________________'}`);
    doc.text(`Téléphone : ${buyerPhone || '___________________________'}`);
    doc.moveDown(2);

    // === INFORMATIONS DU BIEN ===
    doc.fontSize(16).font('Helvetica-Bold').text('Bien concerné');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    doc.text(`Adresse complète : ${property.address}, ${property.postalCode} ${property.city}`);
    doc.text(`Type de bien : ${property.type || 'N/A'}`);
    doc.text(`Surface habitable : ${property.area} m²`);
    doc.text(`Nombre de chambres : ${property.bedrooms}`);
    doc.text(`Nombre de pièces : ${property.rooms}`);
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2D3748')
       .text(`Prix demandé : ${property.price.toLocaleString('fr-FR')} €`);
    doc.moveDown(2);

    // === OFFRE ===
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text("Montant de l'offre");
    doc.moveDown(0.5);

    const offer = offerAmount || property.price;
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2C5282')
       .text(`${parseInt(offer).toLocaleString('fr-FR')} €`, { align: 'center' });
    doc.moveDown(2);

    // === CONDITIONS ===
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Conditions de l\'offre');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.list([
      "Cette offre est valable pendant 7 jours à compter de sa signature.",
      "L'acquéreur s'engage à fournir un justificatif de financement sous 15 jours.",
      "La vente est conditionnée à l'obtention d'un prêt immobilier.",
      "Un délai de rétractation de 10 jours est accordé conformément à la loi.",
      "Les frais de notaire sont à la charge de l'acquéreur."
    ], { bulletRadius: 2 });
    doc.moveDown(2);

    // === NOTES ADDITIONNELLES ===
    doc.fontSize(14).font('Helvetica-Bold').text('Notes et conditions particulières');
    doc.moveDown(0.5);

    doc.rect(50, doc.y, 500, 100).stroke();
    doc.moveDown(7);

    // === SIGNATURES ===
    doc.fontSize(12).font('Helvetica-Bold').text('Signatures', { align: 'center' });
    doc.moveDown(1);

    const signatureY = doc.y;

    // Signature de l'acquéreur
    doc.fontSize(10).font('Helvetica').text("L'Acquéreur :", 70, signatureY);
    doc.text('Lu et approuvé', 70, signatureY + 20);
    doc.text('Signature :', 70, signatureY + 40);
    doc.moveTo(70, signatureY + 100).lineTo(240, signatureY + 100).stroke();
    doc.text('Date :', 70, signatureY + 110);

    // Signature de l'agent
    doc.text("L'Agent immobilier :", 350, signatureY);
    doc.text(`${property.agent.firstName} ${property.agent.lastName}`, 350, signatureY + 20);
    doc.text('Signature :', 350, signatureY + 40);
    doc.moveTo(350, signatureY + 100).lineTo(520, signatureY + 100).stroke();
    doc.text('Date :', 350, signatureY + 110);

    // === PIED DE PAGE ===
    doc.fontSize(8).fillColor('#999999')
       .text(
         "Ce document constitue une offre d'achat non contractuelle. Il doit être validé par un compromis de vente signé devant notaire.",
         50,
         doc.page.height - 50,
         { align: 'center', width: 500 }
       );

    doc.end();

    logActivity(req.user.id, "PDF_GENERATED", `Offre d'achat générée pour le bien #${propertyId}`);

  } catch (error) {
    console.error("Erreur génération offre d'achat:", error);
    res.status(500).json({ error: "Erreur lors de la génération du PDF" });
  }
});

// ================================
// 📸 AMÉLIORATION AUTOMATIQUE DES PHOTOS (IA)
// ================================

// Endpoint pour améliorer automatiquement une photo
app.post('/api/properties/:id/enhance-photo', authenticateToken, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Récupérer le bien
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.agentId !== req.user.id) {
      return res.status(404).json({ error: "Bien non trouvé" });
    }

    if (!property.imageUrl) {
      return res.status(400).json({ error: "Aucune photo à améliorer" });
    }

    console.log("🖼️  Début amélioration photo pour le bien #" + propertyId);

    // Télécharger l'image originale
    const protocol = property.imageUrl.startsWith('https') ? https : http;

    const imageBuffer = await new Promise((resolve, reject) => {
      protocol.get(property.imageUrl, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      });
    });

    console.log("✅ Image téléchargée, taille:", imageBuffer.length, "bytes");

    // Amélioration automatique avec Sharp
    const enhancedBuffer = await sharp(imageBuffer)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      // Auto-optimisation : luminosité, contraste, saturation
      .normalize() // Ajustement automatique de la luminosité
      .modulate({
        brightness: 1.05, // +5% de luminosité
        saturation: 1.15, // +15% de saturation (couleurs plus vives)
      })
      .sharpen({
        sigma: 1.2 // Netteté professionnelle
      })
      .jpeg({
        quality: 92, // Qualité optimale
        progressive: true
      })
      .toBuffer();

    console.log("✅ Image améliorée, nouvelle taille:", enhancedBuffer.length, "bytes");

    // Convertir en base64 pour retour
    const base64Image = `data:image/jpeg;base64,${enhancedBuffer.toString('base64')}`;

    // Mise à jour du champ dans la base de données
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        imageUrlEnhanced: base64Image
      }
    });

    logActivity(req.user.id, "PHOTO_ENHANCED", `Photo améliorée pour le bien #${propertyId}`);

    res.json({
      success: true,
      message: "Photo améliorée avec succès !",
      enhancedUrl: base64Image,
      improvements: [
        "✨ Luminosité optimisée",
        "🎨 Couleurs plus vives (+15%)",
        "🔍 Netteté professionnelle",
        "📐 Format optimisé"
      ]
    });

  } catch (error) {
    console.error("Erreur amélioration photo:", error);
    res.status(500).json({ error: "Erreur lors de l'amélioration de la photo" });
  }
});

// ========================================
// 🛋️ HOME STAGING VIRTUEL - Meubler une pièce vide avec IA
// ========================================
app.post('/api/properties/:id/stage-photo', authenticateToken, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { style } = req.body; // Style: 'modern', 'scandinavian', 'industrial', 'classic', 'bohemian'

    // 1. Vérifier que le bien existe et appartient à l'agent
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: "Bien non trouvé" });
    }

    if (property.agentId !== req.user.userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    if (!property.imageUrl) {
      return res.status(400).json({ error: "Ce bien n'a pas de photo" });
    }

    // 2. Appeler l'API Replicate pour le staging virtuel
    const Replicate = require('replicate');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Mapping des styles vers des prompts efficaces
    const stylePrompts = {
      modern: "modern minimalist interior design, clean lines, neutral colors, contemporary furniture, large windows, natural light, professional photography",
      scandinavian: "scandinavian interior design, light wood, white walls, hygge atmosphere, minimalist nordic style, cozy and bright, professional photography",
      industrial: "industrial loft interior design, exposed brick, metal fixtures, wooden beams, urban style, concrete floors, professional photography",
      classic: "classic elegant interior design, traditional furniture, luxurious fabrics, ornate details, sophisticated style, professional photography",
      bohemian: "bohemian interior design, colorful textiles, plants, eclectic decor, warm atmosphere, artistic style, professional photography"
    };

    const selectedPrompt = stylePrompts[style] || stylePrompts.modern;

    console.log(`🛋️ Staging virtuel pour bien ${propertyId} - Style: ${style}`);

    // 3. Utiliser le modèle interior-ai ou roomGPT
    const output = await replicate.run(
      "adirik/interior-design:76604baddc85003d0ce8f37e49f2f3b52f0a83b5e5bf96cb86dc2b0c0e2faa6a",
      {
        input: {
          image: property.imageUrl,
          prompt: selectedPrompt,
          num_inference_steps: 50,
          guidance_scale: 7.5
        }
      }
    );

    // 4. L'output de Replicate est généralement une URL d'image
    const stagedImageUrl = Array.isArray(output) ? output[0] : output;

    // 5. Sauvegarder l'URL dans la base de données
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        imageUrlStaged: stagedImageUrl,
        stagingStyle: style
      }
    });

    // 6. Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: 'HOME_STAGING_VIRTUEL',
        description: `Home staging virtuel appliqué (${style}) sur ${property.address}`,
        agentId: req.user.userId
      }
    });

    res.json({
      success: true,
      stagedUrl: stagedImageUrl,
      style: style,
      message: `✨ Votre pièce a été meublée avec le style ${style} !`
    });

  } catch (error) {
    console.error("❌ Erreur home staging virtuel:", error);
    res.status(500).json({
      error: "Erreur lors du staging virtuel",
      details: error.message
    });
  }
});

// DÉMARRAGE
app.listen(PORT, () => {
  console.log(`✅ Serveur OK sur port ${PORT}`);
  console.log(`✅ CORS Manuel activé - Version Dec 8 2025`);
  console.log(`✅ Middleware OPTIONS configuré`);
});