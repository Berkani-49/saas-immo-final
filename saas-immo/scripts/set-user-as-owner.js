#!/usr/bin/env node

/**
 * Script pour définir un utilisateur comme OWNER
 *
 * Usage:
 *   node scripts/set-user-as-owner.js <email>
 *
 * Exemple:
 *   node scripts/set-user-as-owner.js pierre@agence.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setUserAsOwner(email) {
  if (!email) {
    console.log('❌ Usage: node scripts/set-user-as-owner.js <email>');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/set-user-as-owner.js pierre@agence.com');
    return;
  }

  try {
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('');
      console.log('💡 Vérifiez que l\'email est correct.');
      return;
    }

    console.log(`\n📋 Utilisateur trouvé:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Nom: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Rôle actuel: ${user.role}`);

    if (user.role === 'OWNER') {
      console.log('\n✅ Cet utilisateur est déjà OWNER.');
      return;
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'OWNER' }
    });

    console.log(`\n✅ Rôle mis à jour avec succès !`);
    console.log(`  Nouveau rôle: ${updatedUser.role}`);
    console.log('');
    console.log('🎉 Cet utilisateur peut maintenant ajouter des employés.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];
setUserAsOwner(email);
