const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { requirePlan } = require('../middleware/requireSubscription');
const { checkSignatureLimit } = require('../middleware/checkPlanLimits');
const PDFDocument = require('pdfkit');

// Types de documents disponibles
const DOCUMENT_TYPES = [
  { id: 'MANDAT_VENTE', name: 'Mandat de vente' },
  { id: 'MANDAT_GESTION', name: 'Mandat de gestion' },
  { id: 'BAIL_HABITATION', name: "Bail d'habitation" },
];

// Initialiser Resend si la clé est disponible
let resend = null;
try {
  const { Resend } = require('resend');
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (e) {
  // Resend non disponible
}

/**
 * GET /api/documents/types
 * Liste des types de documents disponibles
 */
router.get('/types', requirePlan(['pro', 'premium']), (req, res) => {
  res.json({ types: DOCUMENT_TYPES });
});

/**
 * GET /api/documents
 * Liste des documents de l'agent/agence
 */
router.get('/', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const documents = await prisma.document.findMany({
      where: agencyId ? { agencyId } : { agentId: userId },
      include: {
        property: { select: { id: true, address: true, city: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ documents });
  } catch (error) {
    logger.error('Error fetching documents', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
});

/**
 * POST /api/documents
 * Créer un nouveau document
 */
router.post('/', requirePlan(['pro', 'premium']), checkSignatureLimit, async (req, res) => {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agencyId;
    const { title, type, signerName, signerEmail, propertyId } = req.body;

    if (!title || !type || !signerName || !signerEmail) {
      return res.status(400).json({ error: 'Titre, type, nom et email du signataire sont requis' });
    }

    const validType = DOCUMENT_TYPES.find((t) => t.id === type);
    if (!validType) {
      return res.status(400).json({ error: 'Type de document invalide' });
    }

    // Vérifier le bien si spécifié
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: parseInt(propertyId),
          ...(agencyId ? { agencyId } : { agentId: userId }),
        },
      });
      if (!property) {
        return res.status(404).json({ error: 'Bien non trouvé' });
      }
    }

    const document = await prisma.document.create({
      data: {
        title,
        type,
        signerName,
        signerEmail,
        agentId: userId,
        agencyId: agencyId || null,
        propertyId: propertyId ? parseInt(propertyId) : null,
      },
      include: {
        property: { select: { id: true, address: true, city: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log activité
    await prisma.activityLog.create({
      data: {
        action: 'DOCUMENT_CREATED',
        description: `Document "${title}" créé (${validType.name})`,
        agentId: userId,
        agencyId: agencyId || null,
      },
    });

    logger.info('Document created', { documentId: document.id, type, userId });
    res.status(201).json({ document });
  } catch (error) {
    logger.error('Error creating document', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la création du document' });
  }
});

/**
 * GET /api/documents/:id
 * Détail d'un document
 */
router.get('/:id', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
      include: {
        property: { select: { id: true, address: true, city: true, price: true, area: true, rooms: true, propertyType: true } },
        agent: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    res.json({ document });
  } catch (error) {
    logger.error('Error fetching document', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération du document' });
  }
});

/**
 * DELETE /api/documents/:id
 * Supprimer un brouillon
 */
router.delete('/:id', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    if (document.status === 'SIGNED') {
      return res.status(400).json({ error: 'Impossible de supprimer un document signé' });
    }

    await prisma.document.delete({ where: { id: documentId } });

    logger.info('Document deleted', { documentId, userId });
    res.json({ message: 'Document supprimé' });
  } catch (error) {
    logger.error('Error deleting document', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la suppression du document' });
  }
});

/**
 * POST /api/documents/:id/send
 * Envoyer le lien de signature par email
 */
router.post('/:id/send', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
      include: {
        agent: { select: { firstName: true, lastName: true } },
        property: { select: { address: true, city: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    if (document.status === 'SIGNED') {
      return res.status(400).json({ error: 'Ce document est déjà signé' });
    }

    // Construire l'URL de signature
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const signUrl = `${frontendUrl}/signer/${document.signingToken}`;

    // Envoyer l'email
    if (resend) {
      const typeName = DOCUMENT_TYPES.find((t) => t.id === document.type)?.name || document.type;
      const agentName = `${document.agent.firstName} ${document.agent.lastName}`;
      const propertyInfo = document.property ? ` pour le bien ${document.property.address}, ${document.property.city}` : '';

      await resend.emails.send({
        from: 'ImmoFlow <onboarding@resend.dev>',
        to: document.signerEmail,
        subject: `📝 Document à signer : ${typeName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366F1;">Document à signer</h2>
            <p>Bonjour ${document.signerName},</p>
            <p>${agentName} vous invite à signer le document suivant :</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Type :</strong> ${typeName}</p>
              <p style="margin: 4px 0;"><strong>Titre :</strong> ${document.title}</p>
              ${propertyInfo ? `<p style="margin: 4px 0;"><strong>Bien :</strong>${propertyInfo}</p>` : ''}
            </div>
            <p>Cliquez sur le bouton ci-dessous pour signer :</p>
            <a href="${signUrl}" style="display: inline-block; background: #6366F1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Signer le document
            </a>
            <p style="color: #888; font-size: 12px; margin-top: 24px;">
              Si le bouton ne fonctionne pas, copiez ce lien : ${signUrl}
            </p>
          </div>
        `,
      });
    }

    // Mettre à jour le statut
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'SENT' },
    });

    // Log activité
    await prisma.activityLog.create({
      data: {
        action: 'DOCUMENT_SENT',
        description: `Document "${document.title}" envoyé à ${document.signerName} (${document.signerEmail})`,
        agentId: userId,
        agencyId: agencyId || null,
      },
    });

    logger.info('Document sent for signature', { documentId, signerEmail: document.signerEmail });
    res.json({ message: 'Lien de signature envoyé par email', signUrl });
  } catch (error) {
    logger.error('Error sending document', { error: error.message });
    res.status(500).json({ error: "Erreur lors de l'envoi du document" });
  }
});

/**
 * GET /api/documents/:id/download
 * Télécharger le PDF du document
 */
router.get('/:id/download', requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const agencyId = req.user.agencyId;
    const userId = req.user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...(agencyId ? { agencyId } : { agentId: userId }),
      },
      include: {
        agent: { select: { firstName: true, lastName: true, email: true } },
        property: { select: { address: true, city: true, postalCode: true, price: true, area: true, rooms: true, propertyType: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    const typeName = DOCUMENT_TYPES.find((t) => t.id === document.type)?.name || document.type;

    // Générer le PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.pdf"`);
    doc.pipe(res);

    // En-tête
    doc.fontSize(20).fillColor('#6366F1').text(typeName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#333').text(document.title, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ddd');
    doc.moveDown();

    // Infos document
    doc.fontSize(10).fillColor('#666');
    doc.text(`Date de création : ${new Date(document.createdAt).toLocaleDateString('fr-FR')}`);
    doc.text(`Statut : ${document.status === 'SIGNED' ? 'Signé' : document.status === 'SENT' ? 'En attente de signature' : 'Brouillon'}`);
    doc.moveDown();

    // Agent
    doc.fontSize(12).fillColor('#333').text('Agent immobilier', { underline: true });
    doc.fontSize(10).fillColor('#666');
    doc.text(`${document.agent.firstName} ${document.agent.lastName}`);
    doc.text(`Email : ${document.agent.email}`);
    doc.moveDown();

    // Signataire
    doc.fontSize(12).fillColor('#333').text('Signataire', { underline: true });
    doc.fontSize(10).fillColor('#666');
    doc.text(`Nom : ${document.signerName}`);
    doc.text(`Email : ${document.signerEmail}`);
    doc.moveDown();

    // Bien immobilier (si lié)
    if (document.property) {
      doc.fontSize(12).fillColor('#333').text('Bien immobilier', { underline: true });
      doc.fontSize(10).fillColor('#666');
      doc.text(`Adresse : ${document.property.address}`);
      if (document.property.city) doc.text(`Ville : ${document.property.city} ${document.property.postalCode || ''}`);
      if (document.property.price) doc.text(`Prix : ${document.property.price.toLocaleString('fr-FR')} €`);
      if (document.property.area) doc.text(`Surface : ${document.property.area} m²`);
      if (document.property.rooms) doc.text(`Pièces : ${document.property.rooms}`);
      doc.moveDown();
    }

    // Zone de signature
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ddd');
    doc.moveDown();

    if (document.status === 'SIGNED' && document.signatureData) {
      doc.fontSize(12).fillColor('#333').text('Signature', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Signé par ${document.signerName} le ${new Date(document.signedAt).toLocaleDateString('fr-FR')} à ${new Date(document.signedAt).toLocaleTimeString('fr-FR')}`);
      if (document.signerIp) doc.fontSize(8).text(`IP : ${document.signerIp}`);
      doc.moveDown(0.5);

      // Insérer l'image de signature
      try {
        const signatureBuffer = Buffer.from(document.signatureData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        doc.image(signatureBuffer, { width: 200 });
      } catch (e) {
        doc.text('[Signature enregistrée]');
      }
    } else {
      doc.fontSize(12).fillColor('#333').text('Signature du client', { align: 'left' });
      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#333');
      doc.moveDown(0.3);
      doc.fontSize(10).text('Date : ____/____/________');

      doc.moveDown(2);
      doc.fontSize(12).text("Signature de l'agent", { align: 'left' });
      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#333');
      doc.moveDown(0.3);
      doc.fontSize(10).text('Date : ____/____/________');
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text(
      'Document généré par ImmoFlow. Ce document a valeur de preuve de la signature électronique du signataire.',
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    logger.error('Error downloading document', { error: error.message });
    res.status(500).json({ error: 'Erreur lors du téléchargement du document' });
  }
});

// =============================================
// ROUTES PUBLIQUES (sans authentification)
// Montées séparément sur /api/public/sign
// =============================================

/**
 * GET /sign/:token
 * Page publique : récupérer les infos du document
 */
router.get('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const document = await prisma.document.findUnique({
      where: { signingToken: token },
      include: {
        agent: { select: { firstName: true, lastName: true } },
        property: { select: { address: true, city: true, price: true, area: true, rooms: true, propertyType: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé ou lien invalide' });
    }

    if (document.status === 'SIGNED') {
      return res.json({
        alreadySigned: true,
        signedAt: document.signedAt,
        document: {
          title: document.title,
          type: document.type,
          typeName: DOCUMENT_TYPES.find((t) => t.id === document.type)?.name || document.type,
          signerName: document.signerName,
        },
      });
    }

    if (document.status === 'DRAFT') {
      return res.status(400).json({ error: "Ce document n'a pas encore été envoyé pour signature" });
    }

    const typeName = DOCUMENT_TYPES.find((t) => t.id === document.type)?.name || document.type;

    res.json({
      alreadySigned: false,
      document: {
        title: document.title,
        type: document.type,
        typeName,
        signerName: document.signerName,
        agentName: `${document.agent.firstName} ${document.agent.lastName}`,
        property: document.property,
      },
    });
  } catch (error) {
    logger.error('Error fetching public document', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la récupération du document' });
  }
});

/**
 * POST /sign/:token
 * Page publique : soumettre la signature
 * Body: { signatureData: "data:image/png;base64,..." }
 */
router.post('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureData } = req.body;

    if (!signatureData) {
      return res.status(400).json({ error: 'Signature requise' });
    }

    const document = await prisma.document.findUnique({
      where: { signingToken: token },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé ou lien invalide' });
    }

    if (document.status === 'SIGNED') {
      return res.status(400).json({ error: 'Ce document est déjà signé' });
    }

    if (document.status === 'DRAFT') {
      return res.status(400).json({ error: "Ce document n'a pas encore été envoyé pour signature" });
    }

    // Récupérer l'IP du signataire
    const signerIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

    // Mettre à jour le document avec la signature
    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'SIGNED',
        signatureData,
        signedAt: new Date(),
        signerIp,
      },
    });

    // Log activité
    await prisma.activityLog.create({
      data: {
        action: 'DOCUMENT_SIGNED',
        description: `Document "${document.title}" signé par ${document.signerName}`,
        agentId: document.agentId,
        agencyId: document.agencyId,
      },
    });

    // Notifier l'agent par email
    if (resend) {
      const agent = await prisma.user.findUnique({ where: { id: document.agentId } });
      if (agent) {
        await resend.emails.send({
          from: 'ImmoFlow <onboarding@resend.dev>',
          to: agent.email,
          subject: `✅ Document signé : ${document.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #38A169;">Document signé !</h2>
              <p>Bonjour ${agent.firstName},</p>
              <p><strong>${document.signerName}</strong> a signé le document :</p>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Titre :</strong> ${document.title}</p>
                <p style="margin: 4px 0;"><strong>Signé le :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
              <p>Connectez-vous à ImmoFlow pour télécharger le document signé.</p>
            </div>
          `,
        });
      }
    }

    logger.info('Document signed', { documentId: document.id, signerName: document.signerName });
    res.json({ message: 'Document signé avec succès', signedAt: updated.signedAt });
  } catch (error) {
    logger.error('Error signing document', { error: error.message });
    res.status(500).json({ error: 'Erreur lors de la signature du document' });
  }
});

module.exports = router;
