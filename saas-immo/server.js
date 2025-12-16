// Fichier : server.js (Version FINALE - CORS Fix Manuel + RDV + PDF + AI Photos)
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');
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
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

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

// Vérification des variables Supabase
if (!process.env.SUPABASE_URL) {
  console.error('❌ ERREUR : SUPABASE_URL manquant dans les variables d\'environnement');
  console.error('📝 Ajoutez SUPABASE_URL sur Render : https://wcybvmyamnpkwpuabvqq.supabase.co');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERREUR : SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d\'environnement');
  console.error('📝 Ajoutez SUPABASE_SERVICE_ROLE_KEY sur Render (clé service_role depuis Supabase)');
}

// Supabase client avec service_role pour bypasser RLS (optionnel si non configuré)
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

if (supabase) {
  console.log('✅ Supabase Storage configuré');
} else {
  console.warn('⚠️  Supabase Storage non configuré - Upload de photos désactivé');
}

// Configuration de multer pour gérer les uploads en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seulement les fichiers image sont acceptés'));
    }
  }
});

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

        // Extraire uniquement les champs autorisés (éviter les champs de relation)
        const { address, city, postalCode, price, area, rooms, bedrooms, description, imageUrl } = req.body;

        const updated = await prisma.property.update({
            where: { id: parseInt(req.params.id) },
            data: {
                address,
                city,
                postalCode,
                price: price ? parseInt(price) : property.price,
                area: area ? parseInt(area) : property.area,
                rooms: rooms ? parseInt(rooms) : property.rooms,
                bedrooms: bedrooms ? parseInt(bedrooms) : property.bedrooms,
                description,
                imageUrl
            },
            include: { images: { orderBy: { order: 'asc' } } } // Inclure les images dans la réponse
        });
        logActivity(req.user.id, "MODIF_BIEN", `Modification : ${updated.address}`);
        res.json(updated);
    } catch (e) {
        console.error("Erreur PUT /api/properties/:id:", e);
        res.status(500).json({ error: "Erreur lors de la mise à jour", details: e.message });
    }
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
        include: { agent: true, images: { orderBy: { order: 'asc' } } }
    });
    p ? res.json(p) : res.status(404).json({ error: "Non trouvé ou non autorisé" });
});

// ================================
// 📸 GESTION DES IMAGES MULTIPLES
// ================================

// 🔄 ROUTE D'UPLOAD - Upload une photo vers Supabase (bypass RLS)
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        // Vérifier que Supabase est configuré
        if (!supabase) {
            console.error('❌ Supabase non configuré - variables manquantes');
            return res.status(503).json({
                error: "Service d'upload non configuré",
                details: "Les variables d'environnement Supabase sont manquantes sur le serveur"
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier fourni" });
        }

        // Générer un nom de fichier unique
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        console.log(`📤 Tentative d'upload: ${fileName} (${req.file.size} bytes)`);

        // Upload vers Supabase Storage en utilisant le service_role (bypass RLS)
        const { data, error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Erreur upload Supabase:", uploadError);
            return res.status(500).json({
                error: "Erreur lors de l'upload",
                details: uploadError.message
            });
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

        console.log(`✅ Photo uploadée avec succès: ${publicUrl}`);

        res.json({
            success: true,
            url: publicUrl,
            fileName: fileName
        });

    } catch (error) {
        console.error("Erreur route upload:", error);
        res.status(500).json({
            error: "Erreur serveur lors de l'upload",
            details: error.message
        });
    }
});

// Ajouter une photo à un bien
app.post('/api/properties/:id/images', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const { url, caption, isPrimary } = req.body;

        // DEBUG: Log pour diagnostiquer le problème
        console.log('🔍 DEBUG - req.body:', JSON.stringify(req.body, null, 2));
        console.log('🔍 DEBUG - url value:', url);
        console.log('🔍 DEBUG - url type:', typeof url);

        // Validation: vérifier que l'URL est présente
        if (!url) {
            return res.status(400).json({
                error: "URL manquante",
                details: "Le paramètre 'url' est requis pour ajouter une image"
            });
        }

        // Vérifier que le bien appartient à l'agent
        const property = await prisma.property.findFirst({
            where: { id: propertyId, agentId: req.user.id }
        });

        if (!property) {
            return res.status(404).json({ error: "Bien non trouvé" });
        }

        // Si cette photo est définie comme principale, retirer le statut primary des autres
        if (isPrimary) {
            await prisma.propertyImage.updateMany({
                where: { propertyId, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        // Compter le nombre de photos existantes pour définir l'ordre
        const imageCount = await prisma.propertyImage.count({
            where: { propertyId }
        });

        // Créer la nouvelle image
        const newImage = await prisma.propertyImage.create({
            data: {
                url,
                caption: caption || null,
                isPrimary: isPrimary || false,
                order: imageCount,
                propertyId
            }
        });

        logActivity(req.user.id, "PHOTO_AJOUTÉE", `Photo ajoutée au bien ${property.address}`);

        res.status(201).json(newImage);
    } catch (error) {
        console.error("Erreur ajout image:", error);
        res.status(500).json({ error: "Erreur lors de l'ajout de l'image" });
    }
});

// Récupérer toutes les photos d'un bien
app.get('/api/properties/:id/images', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);

        // Vérifier que le bien appartient à l'agent
        const property = await prisma.property.findFirst({
            where: { id: propertyId, agentId: req.user.id }
        });

        if (!property) {
            return res.status(404).json({ error: "Bien non trouvé" });
        }

        const images = await prisma.propertyImage.findMany({
            where: { propertyId },
            orderBy: [
                { isPrimary: 'desc' }, // Photo principale en premier
                { order: 'asc' }        // Puis par ordre
            ]
        });

        res.json(images);
    } catch (error) {
        console.error("Erreur récupération images:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des images" });
    }
});

// Supprimer une photo
app.delete('/api/properties/:propertyId/images/:imageId', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId);
        const imageId = parseInt(req.params.imageId);

        // Vérifier que le bien appartient à l'agent
        const property = await prisma.property.findFirst({
            where: { id: propertyId, agentId: req.user.id }
        });

        if (!property) {
            return res.status(404).json({ error: "Bien non trouvé" });
        }

        // Supprimer l'image
        await prisma.propertyImage.delete({
            where: { id: imageId }
        });

        logActivity(req.user.id, "PHOTO_SUPPRIMÉE", `Photo supprimée du bien ${property.address}`);

        res.status(204).send();
    } catch (error) {
        console.error("Erreur suppression image:", error);
        res.status(500).json({ error: "Erreur lors de la suppression de l'image" });
    }
});

// Définir une photo comme principale
app.patch('/api/properties/:propertyId/images/:imageId/set-primary', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId);
        const imageId = parseInt(req.params.imageId);

        // Vérifier que le bien appartient à l'agent
        const property = await prisma.property.findFirst({
            where: { id: propertyId, agentId: req.user.id }
        });

        if (!property) {
            return res.status(404).json({ error: "Bien non trouvé" });
        }

        // Retirer le statut primary de toutes les images
        await prisma.propertyImage.updateMany({
            where: { propertyId, isPrimary: true },
            data: { isPrimary: false }
        });

        // Définir cette image comme principale
        const updatedImage = await prisma.propertyImage.update({
            where: { id: imageId },
            data: { isPrimary: true }
        });

        res.json(updatedImage);
    } catch (error) {
        console.error("Erreur mise à jour image principale:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
});

// Réorganiser l'ordre des photos
app.put('/api/properties/:id/images/reorder', authenticateToken, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const { imageIds } = req.body; // Array d'IDs dans le nouvel ordre

        // Vérifier que le bien appartient à l'agent
        const property = await prisma.property.findFirst({
            where: { id: propertyId, agentId: req.user.id }
        });

        if (!property) {
            return res.status(404).json({ error: "Bien non trouvé" });
        }

        // Mettre à jour l'ordre de chaque image
        const updates = imageIds.map((imageId, index) =>
            prisma.propertyImage.update({
                where: { id: imageId },
                data: { order: index }
            })
        );

        await prisma.$transaction(updates);

        res.json({ success: true, message: "Ordre mis à jour" });
    } catch (error) {
        console.error("Erreur réorganisation images:", error);
        res.status(500).json({ error: "Erreur lors de la réorganisation" });
    }
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
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true }
    });
    res.json(agents);
});

// Supprimer un membre de l'équipe (réservé au patron)
app.delete('/api/agents/:id', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.id);

    // Vérifier que l'utilisateur actuel est un OWNER
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true }
    });

    if (currentUser.role !== 'OWNER') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Seul le patron peut supprimer des membres de l\'équipe'
      });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, firstName: true, lastName: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Empêcher le patron de se supprimer lui-même
    if (targetUserId === currentUserId) {
      return res.status(400).json({
        error: 'Action non autorisée',
        message: 'Vous ne pouvez pas supprimer votre propre compte depuis cette interface'
      });
    }

    // Empêcher de supprimer un autre patron
    if (targetUser.role === 'OWNER') {
      return res.status(400).json({
        error: 'Action non autorisée',
        message: 'Vous ne pouvez pas supprimer un autre patron'
      });
    }

    console.log(`👤 Suppression du membre ${targetUser.firstName} ${targetUser.lastName} (ID: ${targetUserId})`);

    // Supprimer toutes les données de l'utilisateur (même logique que RGPD)
    const userProperties = await prisma.property.findMany({
      where: { agentId: targetUserId },
      select: { id: true }
    });
    const propertyIds = userProperties.map(p => p.id);

    // Supprimer PropertyView
    if (propertyIds.length > 0) {
      await prisma.propertyView.deleteMany({
        where: { propertyId: { in: propertyIds } }
      });
    }

    // Supprimer PropertyImage
    await prisma.propertyImage.deleteMany({
      where: {
        property: { agentId: targetUserId }
      }
    });

    // Supprimer Task
    await prisma.task.deleteMany({
      where: { agentId: targetUserId }
    });

    // Supprimer Notification liées aux contacts
    const userContacts = await prisma.contact.findMany({
      where: { agentId: targetUserId },
      select: { id: true }
    });
    const contactIds = userContacts.map(c => c.id);

    if (contactIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { contactId: { in: contactIds } }
      });
    }

    // Supprimer Invoice
    await prisma.invoice.deleteMany({
      where: { agentId: targetUserId }
    });

    // Supprimer PropertyOwner
    if (propertyIds.length > 0) {
      await prisma.propertyOwner.deleteMany({
        where: { propertyId: { in: propertyIds } }
      });
    }

    // Supprimer Property
    await prisma.property.deleteMany({
      where: { agentId: targetUserId }
    });

    // Supprimer Contact
    await prisma.contact.deleteMany({
      where: { agentId: targetUserId }
    });

    // Supprimer Appointment
    await prisma.appointment.deleteMany({
      where: { agentId: targetUserId }
    });

    // Supprimer ActivityLog
    await prisma.activityLog.deleteMany({
      where: { agentId: targetUserId }
    });

    // Enfin, supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: targetUserId }
    });

    console.log(`✅ Membre ${targetUser.firstName} ${targetUser.lastName} supprimé avec succès`);

    res.json({
      success: true,
      message: `${targetUser.firstName} ${targetUser.lastName} a été supprimé de l'équipe`
    });

  } catch (error) {
    console.error('❌ Erreur suppression membre équipe:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du membre',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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

    // Vérifier que le bien appartient à l'agent connecté
    if (property.agentId !== req.user.id) {
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
    console.log(`📸 Image URL: ${property.imageUrl}`);
    console.log(`📝 Prompt: ${selectedPrompt}`);

    // 3. Créer une prédiction ASYNCHRONE (retourne immédiatement sans attendre)
    console.log(`⏳ Création de la prédiction Replicate (asynchrone)...`);

    const prediction = await replicate.predictions.create({
      version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      input: {
        image: property.imageUrl,
        prompt: selectedPrompt
      }
    });

    console.log(`✅ Prédiction créée ! ID: ${prediction.id}, Status: ${prediction.status}`);
    console.log(`📦 URL de prédiction:`, prediction.urls?.get);

    // 4. Retourner immédiatement l'ID de prédiction au frontend
    // Le frontend fera du polling pour vérifier le statut
    res.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
      message: `🛋️ Génération en cours... Cela prendra 60-90 secondes.`
    });

  } catch (error) {
    console.error("❌ Erreur home staging virtuel:", error);
    res.status(500).json({
      error: "Erreur lors du staging virtuel",
      details: error.message
    });
  }
});

// 🛋️ HOME STAGING VIRTUEL - Meubler UNE IMAGE SPÉCIFIQUE avec IA
// ========================================
app.post('/api/properties/:id/stage-image', authenticateToken, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { imageUrl, imageId, style } = req.body;

    // Vérifier que le bien appartient à l'agent
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.agentId !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "URL d'image manquante" });
    }

    // Appeler Replicate pour le staging
    const Replicate = require('replicate');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const stylePrompts = {
      modern: "modern minimalist interior design, clean lines, neutral colors, contemporary furniture, large windows, natural light, professional photography",
      scandinavian: "scandinavian interior design, light wood, white walls, hygge atmosphere, minimalist nordic style, cozy and bright, professional photography",
      industrial: "industrial loft interior design, exposed brick, metal fixtures, wooden beams, urban style, concrete floors, professional photography",
      classic: "classic elegant interior design, traditional furniture, luxurious fabrics, ornate details, sophisticated style, professional photography",
      bohemian: "bohemian interior design, colorful textiles, plants, eclectic decor, warm atmosphere, artistic style, professional photography"
    };

    const selectedPrompt = stylePrompts[style] || stylePrompts.modern;

    console.log(`🛋️ Staging image ${imageId} pour bien ${propertyId} - Style: ${style}`);
    console.log(`📸 Image URL: ${imageUrl}`);

    const prediction = await replicate.predictions.create({
      version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      input: {
        image: imageUrl,
        prompt: selectedPrompt
      }
    });

    console.log(`✅ Prédiction créée ! ID: ${prediction.id}`);

    res.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
      imageId: imageId,
      message: `🛋️ Génération en cours... Cela prendra 60-90 secondes.`
    });

  } catch (error) {
    console.error("❌ Erreur staging image:", error);
    res.status(500).json({
      error: "Erreur lors du staging",
      details: error.message
    });
  }
});

// ========================================
// 🔄 POLLING - Vérifier le statut d'une prédiction Replicate
// ========================================
app.get('/api/properties/:id/stage-status/:predictionId', authenticateToken, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { predictionId } = req.params;

    // Vérifier que le bien appartient à l'agent
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.agentId !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // Récupérer le statut de la prédiction Replicate
    const Replicate = require('replicate');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const prediction = await replicate.predictions.get(predictionId);

    console.log(`🔄 Statut prédiction ${predictionId}: ${prediction.status}`);

    // Si la prédiction est réussie, sauvegarder l'image dans la BDD
    if (prediction.status === 'succeeded' && prediction.output) {
      const stagedImageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      const imageId = req.query.imageId; // Si présent, on ajoute une nouvelle photo à la galerie

      if (imageId) {
        // Cas 1: Ajouter la photo meublée à la galerie PropertyImage
        const imageCount = await prisma.propertyImage.count({
          where: { propertyId }
        });

        await prisma.propertyImage.create({
          data: {
            url: stagedImageUrl,
            caption: `Photo meublée (${req.query.style || 'modern'})`,
            isPrimary: false,
            type: 'ENHANCED',
            order: imageCount,
            propertyId: propertyId
          }
        });

        console.log(`✅ Photo meublée ajoutée à la galerie: ${stagedImageUrl}`);

        await prisma.activityLog.create({
          data: {
            action: 'HOME_STAGING_VIRTUEL',
            description: `Home staging virtuel appliqué sur une photo de ${property.address}`,
            agentId: req.user.id
          }
        });

        return res.json({
          status: 'succeeded',
          stagedUrl: stagedImageUrl,
          message: `✨ Photo meublée ajoutée à la galerie !`
        });
      } else {
        // Cas 2: Mise à jour de property.imageUrlStaged (ancien comportement)
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            imageUrlStaged: stagedImageUrl,
            stagingStyle: req.query.style || 'modern'
          }
        });

        await prisma.activityLog.create({
          data: {
            action: 'HOME_STAGING_VIRTUEL',
            description: `Home staging virtuel appliqué sur ${property.address}`,
            agentId: req.user.id
          }
        });

        console.log(`✅ Image sauvegardée: ${stagedImageUrl}`);

        return res.json({
          status: 'succeeded',
          stagedUrl: stagedImageUrl,
          message: `✨ Votre pièce a été meublée !`
        });
      }
    }

    // Si échec
    if (prediction.status === 'failed') {
      return res.json({
        status: 'failed',
        error: prediction.error || "La génération a échoué"
      });
    }

    // Sinon, toujours en cours (starting, processing)
    res.json({
      status: prediction.status,
      message: `⏳ Génération en cours... (${prediction.status})`
    });

  } catch (error) {
    console.error("❌ Erreur vérification statut:", error);
    res.status(500).json({
      error: "Erreur lors de la vérification du statut",
      details: error.message
    });
  }
});

// ============================================
// ROUTES RGPD (Conformité légale)
// ============================================

// Export de toutes les données utilisateur (Droit d'accès)
app.get('/api/rgpd/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer toutes les données de l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    });

    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      include: {
        images: true
      }
    });

    const contacts = await prisma.contact.findMany({
      where: { agentId: userId }
    });

    const tasks = await prisma.task.findMany({
      where: { agentId: userId }
    });

    const appointments = await prisma.appointment.findMany({
      where: { agentId: userId }
    });

    const invoices = await prisma.invoice.findMany({
      where: { agentId: userId }
    });

    const activities = await prisma.activityLog.findMany({
      where: { agentId: userId }
    });

    // Préparer l'export complet
    const exportData = {
      exportDate: new Date().toISOString(),
      notice: "Ceci est un export complet de toutes vos données personnelles conformément au RGPD (Article 15 - Droit d'accès)",
      user: userData,
      properties: properties,
      contacts: contacts,
      tasks: tasks,
      appointments: appointments,
      invoices: invoices,
      activities: activities,
      statistics: {
        totalProperties: properties.length,
        totalContacts: contacts.length,
        totalTasks: tasks.length,
        totalAppointments: appointments.length,
        totalInvoices: invoices.length,
        totalActivities: activities.length
      }
    };

    res.json(exportData);

  } catch (error) {
    console.error('Erreur export RGPD:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
});

// Suppression définitive du compte (Droit à l'oubli)
app.delete('/api/rgpd/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🗑️  Début suppression compte utilisateur ${userId} (RGPD)`);

    // Supprimer toutes les données associées à l'utilisateur
    // L'ordre est CRITIQUE pour respecter les contraintes de clés étrangères

    // 1. Récupérer tous les IDs de propriétés de l'utilisateur
    const userProperties = await prisma.property.findMany({
      where: { agentId: userId },
      select: { id: true }
    });
    const propertyIds = userProperties.map(p => p.id);

    // 2. Supprimer les vues de propriétés (PropertyView)
    if (propertyIds.length > 0) {
      await prisma.propertyView.deleteMany({
        where: { propertyId: { in: propertyIds } }
      });
      console.log('✓ PropertyView supprimées');
    }

    // 3. Supprimer les images des propriétés (et fichiers Supabase)
    const propertyImages = await prisma.propertyImage.findMany({
      where: {
        property: {
          agentId: userId
        }
      }
    });

    // Supprimer les fichiers de Supabase Storage
    if (supabase && propertyImages.length > 0) {
      for (const img of propertyImages) {
        try {
          const urlParts = img.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('property-images').remove([fileName]);
        } catch (err) {
          console.warn('Erreur suppression image Supabase:', err);
        }
      }
    }

    await prisma.propertyImage.deleteMany({
      where: {
        property: {
          agentId: userId
        }
      }
    });
    console.log('✓ PropertyImage supprimées');

    // 4. Supprimer les tâches (avant les propriétés et contacts)
    await prisma.task.deleteMany({
      where: { agentId: userId }
    });
    console.log('✓ Task supprimées');

    // 5. Récupérer tous les IDs de contacts de l'utilisateur
    const userContacts = await prisma.contact.findMany({
      where: { agentId: userId },
      select: { id: true }
    });
    const contactIds = userContacts.map(c => c.id);

    // 6. Supprimer les notifications liées aux contacts
    if (contactIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { contactId: { in: contactIds } }
      });
      console.log('✓ Notification supprimées');
    }

    // 7. Supprimer les factures (avant les contacts)
    await prisma.invoice.deleteMany({
      where: { agentId: userId }
    });
    console.log('✓ Invoice supprimées');

    // 8. Supprimer les relations PropertyOwner (table de jonction)
    if (propertyIds.length > 0) {
      await prisma.propertyOwner.deleteMany({
        where: { propertyId: { in: propertyIds } }
      });
      console.log('✓ PropertyOwner supprimées');
    }

    // 9. Supprimer les propriétés
    await prisma.property.deleteMany({
      where: { agentId: userId }
    });
    console.log('✓ Property supprimées');

    // 10. Supprimer les contacts
    await prisma.contact.deleteMany({
      where: { agentId: userId }
    });
    console.log('✓ Contact supprimés');

    // 11. Supprimer les rendez-vous
    await prisma.appointment.deleteMany({
      where: { agentId: userId }
    });
    console.log('✓ Appointment supprimés');

    // 12. Supprimer les activités
    await prisma.activityLog.deleteMany({
      where: { agentId: userId }
    });
    console.log('✓ ActivityLog supprimées');

    // 13. Enfin, supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`✅ Compte utilisateur ${userId} supprimé définitivement (RGPD - Droit à l'oubli)`);

    res.json({
      success: true,
      message: 'Votre compte et toutes vos données ont été supprimés définitivement'
    });

  } catch (error) {
    console.error('❌ Erreur suppression compte RGPD:', error);
    console.error('Détails:', error.message);
    res.status(500).json({
      error: 'Erreur lors de la suppression du compte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// ROUTES ANALYTICS (Tableau de bord avancé)
// ============================================

// Track une vue de bien (appelé depuis PublicPropertyPage)
app.post('/api/analytics/track-view', async (req, res) => {
  try {
    const { propertyId, referrer, userAgent, device } = req.body;

    // Créer une vue
    const view = await prisma.propertyView.create({
      data: {
        propertyId: parseInt(propertyId),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: userAgent || req.headers['user-agent'],
        referrer: referrer || req.headers.referer || 'Direct',
        device: device || 'unknown',
        viewedAt: new Date()
      }
    });

    // Incrémenter le compteur de vues du bien
    await prisma.property.update({
      where: { id: parseInt(propertyId) },
      data: {
        views: {
          increment: 1
        }
      }
    });

    res.json({ success: true, viewId: view.id });
  } catch (error) {
    console.error('Erreur tracking vue:', error);
    res.status(500).json({ error: 'Erreur lors du tracking' });
  }
});

// Mettre à jour la durée d'une vue
app.post('/api/analytics/update-duration', async (req, res) => {
  try {
    const { propertyId, duration } = req.body;

    // Trouver la vue la plus récente pour cette propriété et cet IP
    const recentView = await prisma.propertyView.findFirst({
      where: {
        propertyId: parseInt(propertyId),
        ipAddress: req.ip || req.connection.remoteAddress,
        duration: null
      },
      orderBy: {
        viewedAt: 'desc'
      }
    });

    if (recentView) {
      await prisma.propertyView.update({
        where: { id: recentView.id },
        data: { duration: parseInt(duration) }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur update duration:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la durée' });
  }
});

// Obtenir les statistiques globales d'un agent
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les biens de l'agent
    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    // Total des vues sur les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalViews = await prisma.propertyView.count({
      where: {
        propertyId: { in: propertyIds },
        viewedAt: { gte: thirtyDaysAgo }
      }
    });

    // Taux de conversion (vues qui ont converti)
    const conversions = await prisma.propertyView.count({
      where: {
        propertyId: { in: propertyIds },
        converted: true,
        viewedAt: { gte: thirtyDaysAgo }
      }
    });

    const conversionRate = totalViews > 0 ? ((conversions / totalViews) * 100).toFixed(2) : 0;

    // Temps moyen passé sur les biens
    const avgDuration = await prisma.propertyView.aggregate({
      where: {
        propertyId: { in: propertyIds },
        duration: { not: null }
      },
      _avg: {
        duration: true
      }
    });

    // Vues par jour (derniers 30 jours)
    let viewsByDay = [];

    if (propertyIds.length > 0) {
      viewsByDay = await prisma.$queryRaw`
        SELECT DATE("viewedAt") as date, COUNT(*)::int as count
        FROM "PropertyView"
        WHERE "propertyId" IN (${Prisma.join(propertyIds)})
          AND "viewedAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("viewedAt")
        ORDER BY date ASC
      `;
    }

    res.json({
      totalViews,
      conversions,
      conversionRate: parseFloat(conversionRate),
      avgDuration: Math.round(avgDuration._avg.duration || 0),
      viewsByDay
    });

  } catch (error) {
    console.error('Erreur analytics overview:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Obtenir les statistiques détaillées par bien
app.get('/api/analytics/properties', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les biens avec leurs vues
    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        views: true
      }
    });

    // Pour chaque bien, calculer les stats
    const propertiesWithStats = await Promise.all(
      properties.map(async (property) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Vues des 30 derniers jours
        const recentViews = await prisma.propertyView.count({
          where: {
            propertyId: property.id,
            viewedAt: { gte: thirtyDaysAgo }
          }
        });

        // Temps moyen
        const avgDuration = await prisma.propertyView.aggregate({
          where: {
            propertyId: property.id,
            duration: { not: null }
          },
          _avg: {
            duration: true
          }
        });

        // Conversions
        const conversions = await prisma.propertyView.count({
          where: {
            propertyId: property.id,
            converted: true
          }
        });

        return {
          ...property,
          recentViews,
          avgDuration: Math.round(avgDuration._avg.duration || 0),
          conversions,
          conversionRate: recentViews > 0 ? ((conversions / recentViews) * 100).toFixed(2) : 0
        };
      })
    );

    // Trier par nombre de vues récentes
    propertiesWithStats.sort((a, b) => b.recentViews - a.recentViews);

    res.json(propertiesWithStats);

  } catch (error) {
    console.error('Erreur analytics properties:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques par bien' });
  }
});

// Obtenir l'origine du trafic
app.get('/api/analytics/traffic-sources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Grouper par referrer
    const trafficSources = await prisma.propertyView.groupBy({
      by: ['referrer'],
      where: {
        propertyId: { in: propertyIds },
        viewedAt: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const formattedSources = trafficSources.map(source => ({
      source: source.referrer || 'Direct',
      count: source._count.id
    }));

    res.json(formattedSources);

  } catch (error) {
    console.error('Erreur traffic sources:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sources de trafic' });
  }
});

// Obtenir la répartition par appareil
app.get('/api/analytics/devices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Grouper par device
    const devices = await prisma.propertyView.groupBy({
      by: ['device'],
      where: {
        propertyId: { in: propertyIds },
        viewedAt: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      }
    });

    const formattedDevices = devices.map(d => ({
      device: d.device || 'Unknown',
      count: d._count.id
    }));

    res.json(formattedDevices);

  } catch (error) {
    console.error('Erreur devices analytics:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques par appareil' });
  }
});

// DÉMARRAGE
app.listen(PORT, () => {
  console.log(`✅ Serveur OK sur port ${PORT}`);
  console.log(`✅ CORS Manuel activé - Version Dec 11 2025`);
  console.log(`✅ Middleware OPTIONS configuré`);
  console.log(`✅ Replicate API: ${process.env.REPLICATE_API_TOKEN ? 'Configurée ✓' : 'NON configurée ✗'}`);
  console.log(`✅ Routes RGPD activées (Export + Suppression)`);
  console.log(`✅ Routes Analytics activées (Tableau de bord avancé)`);
});