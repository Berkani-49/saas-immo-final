// Fichier : server.js (Version AVEC Historique d'Activité)

const axios = require('axios');
const { Resend } = require('resend');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; 
const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(cors());

// --- FONCTION D'AIDE : ENREGISTRER UNE ACTIVITÉ ---
async function logActivity(agentId, action, description) {
  try {
    await prisma.activityLog.create({
      data: { agentId, action, description }
    });
    console.log(`📝 Activité enregistrée : ${action}`);
  } catch (e) {
    console.error("Erreur enregistrement activité:", e);
  }
}

// --- ROUTES PUBLIQUES ---
app.get('/', (req, res) => res.json({ message: "Serveur OK" }));

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
    
    // On loggue l'activité (c'est le système qui agit, pas un agent connecté, donc on met l'ID de l'agent du bien)
    logActivity(property.agentId, "NOUVEAU_LEAD", `Nouveau prospect pour ${property.address}`);

    try {
        await resend.emails.send({
          from: 'onboarding@resend.dev', to: 'amirelattaoui49@gmail.com', // TON EMAIL
          subject: `🔥 Lead: ${property.address}`,
          html: `<p>Nouveau client : ${firstName} ${lastName} (${phone})</p>`
        });
    } catch (e) {}

    res.json({ message: "OK" });
  } catch (e) { res.status(500).json({error: "Erreur"}); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Erreur' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

// --- AUTH MIDDLEWARE ---
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
        const newProperty = await prisma.property.create({ data: { ...req.body, agentId: req.user.id } });
        // LOG
        logActivity(req.user.id, "CRÉATION_BIEN", `Ajout du bien : ${req.body.address}`);
        res.status(201).json(newProperty);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.put('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await prisma.property.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        // LOG
        logActivity(req.user.id, "MODIF_BIEN", `Modification du bien : ${updated.address}`);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.property.delete({ where: { id: parseInt(req.params.id) } });
        // LOG
        logActivity(req.user.id, "SUPPRESSION_BIEN", `Suppression d'un bien (ID ${req.params.id})`);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.get('/api/properties/:id', authenticateToken, async (req, res) => {
    const p = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true } });
    p ? res.json(p) : res.status(404).json({ error: "Non trouvé" });
});

// --- ROUTES CONTACTS ---
app.get('/api/contacts', authenticateToken, async (req, res) => {
    const c = await prisma.contact.findMany({ orderBy: { lastName: 'asc' }, include: { agent: true } });
    res.json(c);
});

app.post('/api/contacts', authenticateToken, async (req, res) => {
    try {
        const newContact = await prisma.contact.create({ data: { ...req.body, agentId: req.user.id } });
        // LOG
        logActivity(req.user.id, "CRÉATION_CONTACT", `Nouveau contact : ${req.body.firstName} ${req.body.lastName}`);
        res.json(newContact);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await prisma.contact.update({ where: { id: parseInt(req.params.id) }, data: req.body });
        // LOG
        logActivity(req.user.id, "MODIF_CONTACT", `Modification contact : ${updated.lastName}`);
        res.json(updated);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.contact.delete({ where: { id: parseInt(req.params.id) } });
        // LOG
        logActivity(req.user.id, "SUPPRESSION_CONTACT", `Suppression contact (ID ${req.params.id})`);
        res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
});

app.get('/api/contacts/:id', authenticateToken, async (req, res) => {
    const c = await prisma.contact.findUnique({ where: { id: parseInt(req.params.id) }, include: { agent: true } });
    c ? res.json(c) : res.status(404).json({ error: "Non trouvé" });
});

// --- ROUTES TACHES ---
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
        const t = await prisma.task.create({ data: { ...req.body, agentId: req.user.id } });
        // LOG
        logActivity(req.user.id, "CRÉATION_TÂCHE", `Nouvelle tâche : ${req.body.title}`);
        res.json(t);
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
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
    const ref = `FAC-${Date.now().toString().slice(-6)}`;
    const i = await prisma.invoice.create({ data: { ...req.body, ref, agentId: req.user.id } });
    logActivity(req.user.id, "CRÉATION_FACTURE", `Facture créée : ${ref} (${req.body.amount}€)`);
    res.json(i);
});

// --- ROUTE : RÉCUPÉRER L'HISTORIQUE (POUR L'AFFICHAGE) ---
app.get('/api/activities', authenticateToken, async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' }, // Les plus récents d'abord
            take: 50, // On affiche les 50 derniers
            include: {
                agent: { select: { firstName: true, lastName: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        console.error("Erreur logs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- STATS ---
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

app.listen(PORT, () => console.log(`Serveur OK sur ${PORT}`));