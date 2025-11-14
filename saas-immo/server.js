// Fichier : server.js (Version 22 - COMPLÈTE & CORRIGÉE)

// 1. IMPORTS
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');

// 2. INITIALISATION
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
app.get('/', (req, res) => {
  res.json({ message: "Le serveur fonctionne parfaitement !" });
});

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

// --- ROUTES BIENS (Properties) - VERSION CORRIGÉE AVEC LOGS ---
app.post('/api/properties', authenticateToken, async (req, res) => {
  console.log("----------------------------------------------------");
  console.log("🕵️‍♂️ [ESPION] Tentative de création de bien...");
  console.log("📦 Données reçues:", req.body);

  try {
    const { address, city, postalCode, price, area, rooms, bedrooms, description } = req.body;

    // Vérification avant envoi
    if (!address || !price || !area) {
        console.log("❌ [ESPION] Il manque des données obligatoires !");
        return res.status(400).json({ error: "Champs requis manquants." });
    }

    console.log("🔄 [ESPION] Envoi à la base de données (Prisma)...");
    
    const newProperty = await prisma.property.create({
      data: {
        address, city, postalCode, 
        price: parseInt(price), 
        area: parseInt(area), 
        rooms: parseInt(rooms) || 0, 
        bedrooms: parseInt(bedrooms) || 0, 
        description,
        agentId: req.user.id
      }
    });

    console.log("✅ [ESPION] SUCCÈS ! Bien créé avec ID:", newProperty.id);
    res.status(201).json(newProperty);

  } catch (error) {
    console.error("💥 [ESPION] ERREUR FATALE :", error);
    res.status(500).json({ error: 'Erreur lors de la création du bien.' });
  }
});

// Route : Voir TOUS les biens de l'agence (Mode Équipe)
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      // ON A ENLEVÉ : where: { agentId: req.user.id },
      // On veut tout voir !
      orderBy: { createdAt: 'desc' },
      include: { 
        agent: { // On demande aussi le nom de l'agent qui a créé le bien
            select: { firstName: true, lastName: true } 
        } 
      }
    });
    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: parseInt(req.params.id), agentId: req.user.id }
    });
    if (!property) return res.status(404).json({ error: 'Bien non trouvé.' });
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.put('/api/properties/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { address, city, postalCode, price, area, rooms, bedrooms, description } = req.body;
      const updatedProperty = await prisma.property.update({
        where: { id: parseInt(id) },
        data: { address, city, postalCode, price: parseInt(price), area: parseInt(area), rooms: parseInt(rooms), bedrooms: parseInt(bedrooms), description }
      });
      res.status(200).json(updatedProperty);
    } catch (error) {
      res.status(500).json({ error: "Erreur update bien." });
    }
});
  
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

// Route : Voir TOUS les contacts de l'agence (Mode Équipe)
app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({ 
      // ON A ENLEVÉ le filtre agentId
      orderBy: { lastName: 'asc' },
      include: { 
        agent: { // On veut savoir à qui appartient ce client
            select: { firstName: true, lastName: true } 
        } 
      }
    });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get('/api/contacts/:id', authenticateToken, async (req, res) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: { id: parseInt(req.params.id), agentId: req.user.id }
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

// 1. Créer une tâche
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

// 2. Lister toutes les tâches de l'agent
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { agentId: req.user.id },
            include: { // On inclut les infos du contact et du bien liés !
                contact: true,
                property: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Erreur GET /api/tasks:", error);
        res.status(500).json({ error: "Erreur récupération tâches." });
    }
});

// 3. Mettre à jour une tâche
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, dueDate } = req.body;

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: { 
                title, 
                status, 
                dueDate: dueDate ? new Date(dueDate) : undefined 
            }
        });
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Erreur PUT /api/tasks:", error);
        res.status(500).json({ error: "Erreur mise à jour tâche." });
    }
});

// 4. Supprimer une tâche
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    } catch (error) {
        console.error("Erreur DELETE /api/tasks:", error);
        res.status(500).json({ error: "Erreur suppression tâche." });
    }
});




// --- ROUTES IA (RETOUR DE L'INTELLIGENCE) ---

// 1. Générer une description
app.post('/api/properties/:id/generate-description', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id: parseInt(id) } });

    if (!property) return res.status(404).json({ error: 'Bien non trouvé.' });

    const prompt = `Rédige une description d'annonce immobilière attrayante, professionnelle et vendeuse (environ 150 mots) pour ce bien :
    - Type : Appartement/Maison
    - Adresse : ${property.address}, ${property.city}
    - Surface : ${property.area} m²
    - Pièces : ${property.rooms}
    - Chambres : ${property.bedrooms}
    - Prix : ${property.price} €
    - Infos brutes : ${property.description || "Aucune info supplémentaire"}
    
    Ne mets pas de titre, commence directement la description.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Ou "gpt-3.5-turbo"
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const generatedText = completion.choices[0].message.content;
    res.json({ description: generatedText });

  } catch (error) {
    console.error("Erreur IA Description:", error);
    res.status(500).json({ error: "Erreur lors de la génération de la description." });
  }
});

// 2. Estimer un prix
app.post('/api/estimate-price', authenticateToken, async (req, res) => {
  try {
    const { area, city, rooms, bedrooms, propertyType, condition, avgPricePerSqm } = req.body;
    
    // Prompt pour l'estimation
    const prompt = `
      Agis comme un expert immobilier. Estime la fourchette de prix pour ce bien :
      - Ville : ${city}
      - Surface : ${area} m²
      - Type : ${propertyType}
      - État : ${condition}
      - Pièces : ${rooms}, Chambres : ${bedrooms}
      - Prix moyen secteur : ${avgPricePerSqm} €/m²
      
      Réponds UNIQUEMENT au format JSON comme ceci :
      { "estimationMin": 100000, "estimationMax": 120000 }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // Force le format JSON
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error("Erreur IA Estimation:", error);
    res.status(500).json({ error: "Erreur lors de l'estimation." });
  }
});


// 7. DÉMARRAGE
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});