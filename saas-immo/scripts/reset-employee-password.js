#!/usr/bin/env node

/**
 * Script pour réinitialiser le mot de passe d'un employé et l'afficher
 *
 * Usage:
 *   node scripts/reset-employee-password.js <email>
 *
 * Exemple:
 *   node scripts/reset-employee-password.js employe@example.com
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Générer un mot de passe fort
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

async function resetPassword(email) {
  if (!email) {
    console.log('❌ Usage: node scripts/reset-employee-password.js <email>');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/reset-employee-password.js employe@example.com');
    return;
  }

  try {
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      return;
    }

    console.log(`\n📋 Utilisateur trouvé:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Nom: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Rôle: ${user.role}`);

    // Générer un nouveau mot de passe
    const newPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log(`\n✅ Mot de passe réinitialisé avec succès !`);
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║            NOUVEAU MOT DE PASSE                        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  ${newPassword.padEnd(54)}║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('⚠️  IMPORTANT : Copiez ce mot de passe et envoyez-le à l\'employé par un canal sécurisé.');
    console.log('⚠️  Ce mot de passe ne sera plus affiché.');
    console.log('');
    console.log(`📧 Envoyez ce message à ${user.firstName} :

Bonjour ${user.firstName},

Voici vos identifiants de connexion :

Email : ${email}
Mot de passe : ${newPassword}

Connectez-vous sur : https://saas-immo-final.vercel.app

⚠️ Important : Changez ce mot de passe dès votre première connexion.

Cordialement,
`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];
resetPassword(email);
