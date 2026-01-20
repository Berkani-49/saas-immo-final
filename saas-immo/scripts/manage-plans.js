#!/usr/bin/env node

/**
 * Script de gestion des plans d'abonnement
 *
 * Usage:
 *   node scripts/manage-plans.js list              - Lister tous les plans
 *   node scripts/manage-plans.js create            - Créer un nouveau plan (interactif)
 *   node scripts/manage-plans.js update <slug>     - Mettre à jour un plan
 *   node scripts/manage-plans.js disable <slug>    - Désactiver un plan
 *   node scripts/manage-plans.js enable <slug>     - Activer un plan
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Lister tous les plans
async function listPlans() {
  console.log('\n📋 Plans d\'abonnement actuels:\n');

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { amount: 'asc' }
  });

  if (plans.length === 0) {
    console.log('❌ Aucun plan trouvé dans la base de données.');
    console.log('\n💡 Utilisez "node scripts/manage-plans.js create" pour en créer un.\n');
    return;
  }

  plans.forEach(plan => {
    const priceEur = (plan.amount / 100).toFixed(2);
    const status = plan.isActive ? '✅ Actif' : '❌ Inactif';
    const featured = plan.isFeatured ? '⭐ Mis en avant' : '';

    console.log(`${status} ${featured}`);
    console.log(`  ID: ${plan.id}`);
    console.log(`  Nom: ${plan.name} (${plan.slug})`);
    console.log(`  Prix: ${priceEur} ${plan.currency.toUpperCase()}/${plan.interval}`);
    console.log(`  Limites: ${plan.maxProperties || '∞'} propriétés, ${plan.maxContacts || '∞'} contacts, ${plan.maxEmployees || '∞'} employés`);
    console.log(`  Stripe Price ID: ${plan.stripePriceId}`);
    console.log(`  Stripe Product ID: ${plan.stripeProductId}`);
    console.log('');
  });
}

// Créer un nouveau plan (interactif)
async function createPlan() {
  console.log('\n🆕 Création d\'un nouveau plan\n');
  console.log('⚠️  Assurez-vous d\'avoir créé le produit sur Stripe Dashboard d\'abord!\n');

  const stripePriceId = await question('Stripe Price ID (ex: price_1ABC123...): ');
  if (!stripePriceId.startsWith('price_')) {
    console.log('❌ Le Price ID doit commencer par "price_"');
    return;
  }

  const stripeProductId = await question('Stripe Product ID (ex: prod_ABC123...): ');
  if (!stripeProductId.startsWith('prod_')) {
    console.log('❌ Le Product ID doit commencer par "prod_"');
    return;
  }

  const name = await question('Nom du plan (ex: Pro): ');
  const slug = await question('Slug (ex: pro): ');
  const description = await question('Description: ');

  const amountStr = await question('Prix en EUR (ex: 49.00): ');
  const amount = Math.round(parseFloat(amountStr) * 100);

  const interval = await question('Intervalle (month/year): ');

  const maxPropertiesStr = await question('Max propriétés (vide = illimité): ');
  const maxProperties = maxPropertiesStr ? parseInt(maxPropertiesStr) : null;

  const maxContactsStr = await question('Max contacts (vide = illimité): ');
  const maxContacts = maxContactsStr ? parseInt(maxContactsStr) : null;

  const maxEmployeesStr = await question('Max employés (vide = illimité): ');
  const maxEmployees = maxEmployeesStr ? parseInt(maxEmployeesStr) : null;

  const featuresStr = await question('Fonctionnalités (séparées par des virgules): ');
  const features = featuresStr.split(',').map(f => f.trim()).filter(f => f);

  const isFeaturedStr = await question('Mettre en avant? (o/n): ');
  const isFeatured = isFeaturedStr.toLowerCase() === 'o';

  console.log('\n📝 Résumé du plan:\n');
  console.log(`  Nom: ${name} (${slug})`);
  console.log(`  Prix: ${(amount / 100).toFixed(2)} EUR/${interval}`);
  console.log(`  Limites: ${maxProperties || '∞'} propriétés, ${maxContacts || '∞'} contacts, ${maxEmployees || '∞'} employés`);
  console.log(`  Fonctionnalités: ${features.join(', ')}`);
  console.log(`  Mis en avant: ${isFeatured ? 'Oui' : 'Non'}\n`);

  const confirm = await question('Confirmer la création? (o/n): ');
  if (confirm.toLowerCase() !== 'o') {
    console.log('❌ Création annulée.');
    return;
  }

  try {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        stripePriceId,
        stripeProductId,
        name,
        slug,
        description,
        amount,
        currency: 'eur',
        interval,
        maxProperties,
        maxContacts,
        maxEmployees,
        features: features,
        isActive: true,
        isFeatured,
      }
    });

    console.log(`\n✅ Plan "${name}" créé avec succès! (ID: ${plan.id})\n`);
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  }
}

// Mettre à jour un plan
async function updatePlan(slug) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { slug }
  });

  if (!plan) {
    console.log(`❌ Aucun plan trouvé avec le slug "${slug}"`);
    return;
  }

  console.log(`\n✏️  Mise à jour du plan "${plan.name}"\n`);
  console.log('Laissez vide pour conserver la valeur actuelle\n');

  const newDescription = await question(`Description [${plan.description}]: `);

  const newMaxPropertiesStr = await question(`Max propriétés [${plan.maxProperties || '∞'}]: `);
  const newMaxProperties = newMaxPropertiesStr ? (newMaxPropertiesStr === '∞' ? null : parseInt(newMaxPropertiesStr)) : plan.maxProperties;

  const newMaxContactsStr = await question(`Max contacts [${plan.maxContacts || '∞'}]: `);
  const newMaxContacts = newMaxContactsStr ? (newMaxContactsStr === '∞' ? null : parseInt(newMaxContactsStr)) : plan.maxContacts;

  const newMaxEmployeesStr = await question(`Max employés [${plan.maxEmployees || '∞'}]: `);
  const newMaxEmployees = newMaxEmployeesStr ? (newMaxEmployeesStr === '∞' ? null : parseInt(newMaxEmployeesStr)) : plan.maxEmployees;

  const newIsFeaturedStr = await question(`Mettre en avant? [${plan.isFeatured ? 'o' : 'n'}]: `);
  const newIsFeatured = newIsFeaturedStr ? newIsFeaturedStr.toLowerCase() === 'o' : plan.isFeatured;

  try {
    await prisma.subscriptionPlan.update({
      where: { slug },
      data: {
        description: newDescription || plan.description,
        maxProperties: newMaxProperties,
        maxContacts: newMaxContacts,
        maxEmployees: newMaxEmployees,
        isFeatured: newIsFeatured,
      }
    });

    console.log(`\n✅ Plan "${plan.name}" mis à jour avec succès!\n`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
  }
}

// Désactiver un plan
async function disablePlan(slug) {
  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { slug },
      data: { isActive: false }
    });

    console.log(`\n✅ Plan "${plan.name}" désactivé.\n`);
    console.log('💡 Les utilisateurs existants conservent leur abonnement, mais les nouveaux ne pourront plus le choisir.\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Activer un plan
async function enablePlan(slug) {
  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { slug },
      data: { isActive: true }
    });

    console.log(`\n✅ Plan "${plan.name}" réactivé.\n`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Main
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'list':
      await listPlans();
      break;

    case 'create':
      await createPlan();
      break;

    case 'update':
      if (!arg) {
        console.log('❌ Usage: node scripts/manage-plans.js update <slug>');
      } else {
        await updatePlan(arg);
      }
      break;

    case 'disable':
      if (!arg) {
        console.log('❌ Usage: node scripts/manage-plans.js disable <slug>');
      } else {
        await disablePlan(arg);
      }
      break;

    case 'enable':
      if (!arg) {
        console.log('❌ Usage: node scripts/manage-plans.js enable <slug>');
      } else {
        await enablePlan(arg);
      }
      break;

    default:
      console.log(`
📦 Gestion des plans d'abonnement

Usage:
  node scripts/manage-plans.js <command> [args]

Commandes:
  list                  Lister tous les plans
  create                Créer un nouveau plan (interactif)
  update <slug>         Mettre à jour un plan existant
  disable <slug>        Désactiver un plan
  enable <slug>         Activer un plan

Exemples:
  node scripts/manage-plans.js list
  node scripts/manage-plans.js create
  node scripts/manage-plans.js update pro
  node scripts/manage-plans.js disable starter
  node scripts/manage-plans.js enable starter
      `);
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  rl.close();
  prisma.$disconnect();
  process.exit(1);
});
