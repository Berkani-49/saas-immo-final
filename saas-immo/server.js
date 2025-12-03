// Fichier : server.js (Version FINALE - Ordre Corrigé)

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

// 1. CONFIGURATION
app.use(express.json());
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// 2. FONCTIONS D'AIDE (DÉFINIES EN PREMIER !)

// Fonction Log
async function logActivity(agentId, action, description) {
  try {
    if (!agentId) return; 
    await prisma.activityLog.create({ data: { agentId, action, description } });
    console.log(`📝 Activité : ${action}`);
  } catch (e) { console.error("Log erreur:", e); }
}

// Fonction Sécurité (TOKEN) - ELLE DOIT ÊTRE ICI
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (e) { res.sendStatus(403); }
};

// 3. ROUTES

app.get('/', (req, res) => res.json({ message: "Serveur en ligne !" }));

// INSCRIPTION AGENT (Maintenant elle peut utiliser authenticateToken car il est défini au-dessus)
app.post('/api/auth/register', authenticateToken, async (req, res) => {
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

// --- ROUTE INSCRIPTION (VERSION RESTAURÉE) ---
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
    console.error("Erreur /api/auth/register:", error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
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

// VOIR UN BIEN PUBLIC
app.get('/api/public/properties/:id', async (req, res) => {
  const p = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true }});
  p ? res.json(p) : res.status(404).json({error: "Introuvable"});
});

app.get('/api/me', authenticateToken, (req, res) => res.json(req.user));


// --- ROUTES PROTÉGÉES ---

// BIENS
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

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.contact.delete({ where: { id: parseInt(req.params.id) } });
        logActivity(req.user.id, "SUPPRESSION_CONTACT", `Suppression contact`);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
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

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const t = await prisma.task.create({ 
            data: { 
                ...req.body,
                contactId: req.body.contactId ? parseInt(req.body.contactId) : null,
                propertyId: req.body.propertyId ? parseInt(req.body.propertyId) : null,
                agentId: req.user.id 
            } 
        });
        logActivity(req.user.id, "CRÉATION_TÂCHE", `Tâche : ${req.body.title}`);
        res.json(t);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
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

app.post('/api/properties/:id/generate-description', authenticateToken, async (req, res) => {
    res.json({ description: "Description IA..." }); 
});

app.post('/api/estimate-price', authenticateToken, async (req, res) => {
    res.json({ estimationMin: 100000, estimationMax: 120000 });
});

// ÉQUIPE
app.get('/api/agents', authenticateToken, async (req, res) => {
    const agents = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true }
    });
    res.json(agents);
});

// DÉMARRAGE
app.listen(PORT, () => console.log(`Serveur OK sur ${PORT}`));