// Fichier : server.js (Version FINALE - Leads inclus)

// 1. IMPORTS
const { Resend } = require('resend'); // <-- NOUVEAU
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');

// 2. INITIALISATION
const resend = new Resend(process.env.RESEND_API_KEY); // <-- NOUVEAU
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_super_secret_a_changer'; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 3. MIDDLEWARE GLOBAL
app.use(express.json());
app.use(cors());

// 4. ROUTES PUBLIQUES

// Test
app.get('/', (req, res) => {
  res.json({ message: "Le serveur fonctionne parfaitement !" });
});

// Voir un bien (Public)
app.get('/api/public/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: { 
        agent: { select: { firstName: true, lastName: true, email: true } } 
      }
    });
    if (!property) return res.status(404).json({ error: 'Bien introuvable.' });
    res.status(200).json(property);
  } catch (error) {
    console.error("Erreur Public Property:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- ROUTE PUBLIQUE : Réception de Leads + Email ---
app.post('/api/public/leads', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message, propertyId } = req.body;

    // 1. Retrouver le bien et l'agent
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
      include: { agent: true } // On a besoin de l'email de l'agent
    });

    if (!property) return res.status(404).json({ error: "Bien introuvable." });

    // 2. Gestion du Contact (Client)
    let contact = await prisma.contact.findFirst({
        where: { email: email, agentId: property.agentId }
    });

    if (!contact) {
        contact = await prisma.contact.create({
            data: {
                firstName, lastName, email, phoneNumber: phone, type: 'BUYER', agentId: property.agentId
            }
        });
    }

    // 3. Créer la Tâche
    await prisma.task.create({
        data: {
            title: `📢 LEAD ENTRANT : ${firstName} ${lastName} pour ${property.address}`,
            status: 'PENDING',
            agentId: property.agentId,
            contactId: contact.id,
            propertyId: property.id,
            dueDate: new Date()
        }
    });

    // 4. ENVOYER L'EMAIL (NOUVEAU !) 📧
    try {
        await resend.emails.send({
          from: 'onboarding@resend.dev', // Adresse par défaut obligatoire en mode gratuit
          to: 'amirelattaoui49@gmail.com', // <--- ⚠️ REMPLACE PAR TON ADRESSE EMAIL PERSO (Celle de ton compte Resend)
          subject: `🔥 Nouveau Lead pour : ${property.address}`,
          html: `
            <h1>Nouveau client intéressé !</h1>
            <p><strong>Client :</strong> ${firstName} ${lastName}</p>
            <p><strong>Téléphone :</strong> ${phone}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Message :</strong> ${message}</p>
            <br/>
            <p><em>Connectez-vous à votre espace ImmoPro pour traiter ce lead.</em></p>
          `
        });
        console.log("Email envoyé avec succès !");
    } catch (emailError) {
        console.error("Erreur envoi email:", emailError);
        // On ne bloque pas la réponse si l'email échoue, le lead est quand même sauvé
    }

    res.status(200).json({ message: "Demande reçue avec succès." });

  } catch (error) {
    console.error("Erreur Lead:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});

// Inscription (Admin seulement via route secrète front)
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

// Connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Erreur /api/auth/login:", error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// 5. MIDDLEWARE D'AUTHENTIFICATION
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.status(401).json({ error: 'Token manquant.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur du token non trouvé.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalide ou expiré.' });
  }
};

// 6. ROUTES PROTÉGÉES
app.get('/api/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// --- ROUTES BIENS ---

// Créer
app.post('/api/properties', authenticateToken, async (req, res) => {
  try {
    const { address, city, postalCode, price, area, rooms, bedrooms, description, imageUrl } = req.body;
    if (!address || !price || !area) {
        return res.status(400).json({ error: "Champs requis manquants." });
    }
    const newProperty = await prisma.property.create({
      data: {
        address, city, postalCode, 
        price: parseInt(price), area: parseInt(area), 
        rooms: parseInt(rooms) || 0, bedrooms: parseInt(bedrooms) || 0, 
        description,
        imageUrl,
        agentId: req.user.id
      }
    });
    res.status(201).json(newProperty);
  } catch (error) {
    console.error("Erreur POST Property:", error);
    res.status(500).json({ error: 'Erreur création bien.' });
  }
});

// Lister (Avec Filtres)
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const { minPrice, maxPrice, minRooms, city } = req.query;
    const filters = {};
    if (minPrice) filters.price = { gte: parseInt(minPrice) };
    if (maxPrice) filters.price = { ...filters.price, lte: parseInt(maxPrice) };
    if (minRooms) filters.rooms = { gte: parseInt(minRooms) };
    if (city) filters.city = { contains: city, mode: 'insensitive' };

    const properties = await prisma.property.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { firstName: true, lastName: true } } }
    });
    res.status(200).json(properties);
  } catch (error) {
    console.error("Erreur GET properties:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Détail d'un bien
app.get('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { agent: { select: { firstName: true, lastName: true } } }
    });
    if (!property) return res.status(404).json({ error: 'Bien non trouvé.' });
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Modifier
app.put('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { address, city, postalCode, price, area, rooms, bedrooms, description, imageUrl } = req.body;
      const updatedProperty = await prisma.property.update({
        where: { id: parseInt(id) },
        data: { address, city, postalCode, price: parseInt(price), area: parseInt(area), rooms: parseInt(rooms), bedrooms: parseInt(bedrooms), description, imageUrl }
      });
      res.status(200).json(updatedProperty);
    } catch (error) {
      res.status(500).json({ error: "Erreur update bien." });
    }
});
  
// Supprimer
app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.property.delete({ where: { id: parseInt(req.params.id) } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur delete bien." });
    }
});

// --- ROUTES CONTACTS ---

app.post('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, type } = req.body;
    const newContact = await prisma.contact.create({ data: { firstName, lastName, email, phoneNumber, type, agentId: req.user.id }});
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ error: "Erreur création contact." });
  }
});

app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({ 
      orderBy: { lastName: 'asc' },
      include: { agent: { select: { firstName: true, lastName: true } } }
    });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: { id: parseInt(req.params.id) },
        include: { agent: { select: { firstName: true, lastName: true } } }
      });
      if (!contact) return res.status(404).json({ error: 'Contact non trouvé.' });
      res.status(200).json(contact);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur." });
    }
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const { firstName, lastName, email, phoneNumber, type } = req.body;
      const updatedContact = await prisma.contact.update({ where: { id: parseInt(req.params.id) }, data: { firstName, lastName, email, phoneNumber, type }});
      res.status(200).json(updatedContact);
    } catch (error) {
      res.status(500).json({ error: "Erreur update contact." });
    }
});
  
app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      await prisma.contact.delete({ where: { id: parseInt(req.params.id) } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur delete contact." });
    }
});

// --- ROUTES TÂCHES (TASKS) ---

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, dueDate, contactId, propertyId } = req.body;
        if (!title) return res.status(400).json({ error: "Le titre est requis." });

        const newTask = await prisma.task.create({
            data: {
                title,
                dueDate: dueDate ? new Date(dueDate) : null,
                agentId: req.user.id,
                contactId: contactId ? parseInt(contactId) : null,
                propertyId: propertyId ? parseInt(propertyId) : null
            }
        });
        res.status(201).json(newTask);
    } catch (error) {
        console.error("Erreur POST /api/tasks:", error);
        res.status(500).json({ error: "Erreur création tâche." });
    }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const agentId = req.user.id;
    const tasks = await prisma.task.findMany({
        where: { agentId: agentId },
        include: {
            contact: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
            property: { select: { id: true, address: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Erreur GET tasks:", error);
    res.status(500).json({ error: "Erreur récupération tâches." });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, dueDate } = req.body;
        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: { title, status, dueDate: dueDate ? new Date(dueDate) : undefined }
        });
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: "Erreur mise à jour tâche." });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Erreur suppression tâche." });
    }
});

// --- ROUTES IA ---

app.post('/api/properties/:id/generate-description', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id: parseInt(id) } });
    if (!property) return res.status(404).json({ error: 'Bien non trouvé.' });

    const prompt = `Rédige une description immo courte et pro pour : ${property.address}. Surface: ${property.area}m2.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    res.json({ description: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Erreur IA." });
  }
});

app.post('/api/estimate-price', authenticateToken, async (req, res) => {
  try {
    const { city, area } = req.body;
    const prompt = `Estime le prix pour un bien à ${city} de ${area}m2. Réponds JSON { "estimationMin": 100000, "estimationMax": 120000 }`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ error: "Erreur IA." });
  }
});

// --- ROUTE STATISTIQUES (Simplifiée) ---
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const agentId = req.user.id;
    const [propertyCount, contactCount, buyerCount, sellerCount, pendingTaskCount] = await Promise.all([
      prisma.property.count(),
      prisma.contact.count(),
      prisma.contact.count({ where: { type: 'BUYER' } }),
      prisma.contact.count({ where: { type: 'SELLER' } }),
      prisma.task.count({ where: { agentId: agentId, status: 'PENDING' } })
    ]);

    const stats = {
      properties: { total: propertyCount },
      contacts: { total: contactCount, buyers: buyerCount, sellers: sellerCount },
      tasks: { pending: pendingTaskCount, done: 0 }
    };
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: "Erreur stats." });
  }
});

// 7. DÉMARRAGE
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});