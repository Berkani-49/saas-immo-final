#!/usr/bin/env node

/**
 * Script pour lister tous les utilisateurs et leurs rôles
 *
 * Usage:
 *   node scripts/list-users.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('\n❌ Aucun utilisateur trouvé dans la base de données.\n');
      return;
    }

    console.log(`\n📋 Liste des utilisateurs (${users.length} total):\n`);

    users.forEach(user => {
      const roleIcon = user.role === 'OWNER' ? '👑' : '👤';
      console.log(`${roleIcon} ${user.role}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Nom: ${user.firstName} ${user.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Créé le: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    const ownerCount = users.filter(u => u.role === 'OWNER').length;
    const employeeCount = users.filter(u => u.role === 'EMPLOYEE').length;

    console.log('📊 Statistiques:');
    console.log(`  👑 Propriétaires (OWNER): ${ownerCount}`);
    console.log(`  👤 Employés (EMPLOYEE): ${employeeCount}`);
    console.log('');

    if (ownerCount === 0) {
      console.log('⚠️  Attention: Aucun utilisateur n\'a le rôle OWNER.');
      console.log('💡 Utilisez "node scripts/set-user-as-owner.js <email>" pour en définir un.\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
