const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Générer un mot de passe fort aléatoire
 */
function generateStrongPassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '@$!%*?&';
  const all = lowercase + uppercase + numbers + special;

  let password = '';

  // Assurer au moins un de chaque type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Compléter jusqu'à 16 caractères
  for (let i = 4; i < 16; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * POST /api/employees
 * Ajouter un employé à l'équipe
 */
router.post('/', async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { email, firstName, lastName } = req.body;

    // Validation des champs
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier que l'utilisateur actuel est bien un OWNER
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.role !== 'OWNER') {
      return res.status(403).json({ error: 'Seul le propriétaire peut ajouter des employés' });
    }

    // Générer un mot de passe fort
    const generatedPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Créer l'employé
    const newEmployee = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'EMPLOYEE',
      },
    });

    logger.info('Employee created', { employeeId: newEmployee.id, email, createdBy: ownerId });

    // Envoyer l'email avec les identifiants
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://saas-immo-final.vercel.app';

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
        to: email,
        subject: 'Bienvenue dans l\'équipe ImmoPro !',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Bienvenue ${firstName} !</h1>

            <p>Vous avez été ajouté(e) à l'équipe ImmoPro par ${owner.firstName} ${owner.lastName}.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Vos identifiants de connexion :</h2>
              <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Mot de passe :</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 4px;">${generatedPassword}</code></p>
            </div>

            <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, veuillez changer ce mot de passe dès votre première connexion.</p>

            <div style="margin: 30px 0;">
              <a href="${frontendUrl}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Se connecter
              </a>
            </div>

            <p>Si vous avez des questions, n'hésitez pas à contacter votre administrateur.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px;">
              ImmoPro - Votre plateforme de gestion immobilière
            </p>
          </div>
        `,
      });

      logger.info('Welcome email sent to employee', { email });
    } catch (emailError) {
      logger.error('Error sending welcome email', { error: emailError.message, email });
      // Ne pas faire échouer la création si l'email échoue
    }

    // Retourner l'employé créé (sans le mot de passe)
    const { password: _, ...employeeWithoutPassword } = newEmployee;

    res.status(201).json({
      message: 'Employé ajouté avec succès. Un email avec les identifiants a été envoyé.',
      employee: employeeWithoutPassword,
    });

  } catch (error) {
    logger.error('Error creating employee', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Erreur lors de la création de l\'employé' });
  }
});

/**
 * GET /api/employees
 * Lister tous les employés de l'équipe
 */
router.get('/', async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Vérifier que l'utilisateur est un OWNER
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.role !== 'OWNER') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer tous les employés
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ employees });

  } catch (error) {
    logger.error('Error fetching employees', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Erreur lors de la récupération des employés' });
  }
});

/**
 * DELETE /api/employees/:employeeId
 * Supprimer un employé
 */
router.delete('/:employeeId', async (req, res) => {
  try {
    const ownerId = req.user.id;
    const employeeId = parseInt(req.params.employeeId);

    // Vérifier que l'utilisateur est un OWNER
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.role !== 'OWNER') {
      return res.status(403).json({ error: 'Seul le propriétaire peut supprimer des employés' });
    }

    // Vérifier que l'employé existe et est bien un EMPLOYEE
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    if (employee.role !== 'EMPLOYEE') {
      return res.status(400).json({ error: 'Vous ne pouvez supprimer que des employés' });
    }

    // Supprimer l'employé
    await prisma.user.delete({
      where: { id: employeeId },
    });

    logger.info('Employee deleted', { employeeId, deletedBy: ownerId });

    res.json({ message: 'Employé supprimé avec succès' });

  } catch (error) {
    logger.error('Error deleting employee', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'employé' });
  }
});

/**
 * POST /api/employees/:employeeId/reset-password
 * Réinitialiser le mot de passe d'un employé
 */
router.post('/:employeeId/reset-password', async (req, res) => {
  try {
    const ownerId = req.user.id;
    const employeeId = parseInt(req.params.employeeId);

    // Vérifier que l'utilisateur est un OWNER
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.role !== 'OWNER') {
      return res.status(403).json({ error: 'Seul le propriétaire peut réinitialiser les mots de passe' });
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Générer un nouveau mot de passe
    const newPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: employeeId },
      data: { password: hashedPassword },
    });

    logger.info('Employee password reset', { employeeId, resetBy: ownerId });

    // Envoyer le nouveau mot de passe par email
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://saas-immo-final.vercel.app';

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@immopro.com',
        to: employee.email,
        subject: 'Réinitialisation de votre mot de passe ImmoPro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Réinitialisation de mot de passe</h1>

            <p>Bonjour ${employee.firstName},</p>

            <p>Votre mot de passe a été réinitialisé par votre administrateur.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Votre nouveau mot de passe :</h2>
              <p style="margin: 0;"><code style="background-color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${newPassword}</code></p>
            </div>

            <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, veuillez changer ce mot de passe dès votre prochaine connexion.</p>

            <div style="margin: 30px 0;">
              <a href="${frontendUrl}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Se connecter
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px;">
              ImmoPro - Votre plateforme de gestion immobilière
            </p>
          </div>
        `,
      });

      logger.info('Password reset email sent', { employeeId });
    } catch (emailError) {
      logger.error('Error sending password reset email', { error: emailError.message });
    }

    res.json({
      message: 'Mot de passe réinitialisé avec succès. Un email a été envoyé à l\'employé.',
    });

  } catch (error) {
    logger.error('Error resetting employee password', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

module.exports = router;
