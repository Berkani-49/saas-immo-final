// Script : migrate-to-agencies.js
// Migre les données existantes vers le modèle multi-agence.
// Pour chaque user OWNER : crée une Agency, rattache tous ses données.
// Usage : node scripts/migrate-to-agencies.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

async function main() {
  console.log('🚀 Migration vers multi-agence...\n');

  // 1. Récupérer tous les OWNER
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER', agencyId: null },
    include: { subscription: true }
  });

  console.log(`📋 ${owners.length} propriétaire(s) à migrer.\n`);

  for (const owner of owners) {
    const agencyName = `Agence ${owner.firstName} ${owner.lastName}`;
    let slug = slugify(agencyName);

    // Vérifier l'unicité du slug
    const existing = await prisma.agency.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${owner.id}`;
    }

    console.log(`\n👤 ${owner.firstName} ${owner.lastName} (id=${owner.id})`);
    console.log(`   → Création agence "${agencyName}" (slug: ${slug})`);

    // 2. Créer l'Agency
    const agency = await prisma.agency.create({
      data: {
        name: agencyName,
        slug,
        isActive: true,
        stripeCustomerId: owner.stripeCustomerId || null,
      }
    });

    console.log(`   ✅ Agency créée (id=${agency.id})`);

    // 3. Rattacher le user OWNER à l'agence
    await prisma.user.update({
      where: { id: owner.id },
      data: { agencyId: agency.id }
    });

    // 4. Migrer toutes les données de ce user
    const propCount = await prisma.property.updateMany({
      where: { agentId: owner.id },
      data: { agencyId: agency.id }
    });
    console.log(`   📦 ${propCount.count} biens migrés`);

    const contactCount = await prisma.contact.updateMany({
      where: { agentId: owner.id },
      data: { agencyId: agency.id }
    });
    console.log(`   👥 ${contactCount.count} contacts migrés`);

    const taskCount = await prisma.task.updateMany({
      where: { agentId: owner.id },
      data: { agencyId: agency.id }
    });
    console.log(`   📋 ${taskCount.count} tâches migrées`);

    const invoiceCount = await prisma.invoice.updateMany({
      where: { agentId: owner.id },
      data: { agencyId: agency.id }
    });
    console.log(`   💰 ${invoiceCount.count} factures migrées`);

    const activityCount = await prisma.activityLog.updateMany({
      where: { agentId: owner.id },
      data: { agencyId: agency.id }
    });
    console.log(`   📝 ${activityCount.count} activités migrées`);

    const appointmentCount = await prisma.appointment.updateMany({
      where: { agentId: owner.id },
      data: { agencyId: agency.id }
    });
    console.log(`   📅 ${appointmentCount.count} rendez-vous migrés`);

    // 5. Migrer la subscription si elle existe
    if (owner.subscription) {
      await prisma.subscription.update({
        where: { id: owner.subscription.id },
        data: { agencyId: agency.id }
      });
      console.log(`   💳 Subscription migrée (plan: ${owner.subscription.planName})`);
    }

    // 6. Rattacher les employés éventuels (même email domain ou liés)
    // Note : sans parentId, on ne peut pas deviner les employés.
    // Ils seront assignés manuellement via le script admin.
  }

  // 7. Vérifier les users EMPLOYEE orphelins (sans agencyId)
  const orphanEmployees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', agencyId: null }
  });

  if (orphanEmployees.length > 0) {
    console.log(`\n⚠️  ${orphanEmployees.length} employé(s) sans agence :`);
    for (const emp of orphanEmployees) {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.email}, id=${emp.id})`);
    }
    console.log('   → Assignez-les manuellement avec : UPDATE "User" SET "agencyId" = X WHERE id = Y;');
  }

  console.log('\n✅ Migration terminée !');

  // Stats finales
  const agencyCount = await prisma.agency.count();
  const migratedUsers = await prisma.user.count({ where: { agencyId: { not: null } } });
  const totalUsers = await prisma.user.count();

  console.log(`\n📊 Résumé :`);
  console.log(`   Agences créées : ${agencyCount}`);
  console.log(`   Users migrés : ${migratedUsers}/${totalUsers}`);
}

main()
  .catch(e => {
    console.error('❌ Erreur de migration :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
