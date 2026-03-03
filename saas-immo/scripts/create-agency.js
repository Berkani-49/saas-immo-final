// Script : create-agency.js
// Crée une nouvelle agence avec son propriétaire (OWNER) et ajoute le sous-domaine sur Vercel automatiquement
// Usage : node scripts/create-agency.js --name "Agence Dupont" --slug "agence-dupont" --owner-email "dupont@email.com" --owner-password "motdepasse" [--owner-first "Jean"] [--owner-last "Dupont"] [--plan "pro"]
// Variables d'env requises pour Vercel auto : VERCEL_TOKEN, VERCEL_PROJECT_ID, APP_DOMAIN

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const https = require('https');
const prisma = new PrismaClient();

// Ajoute un domaine au projet Vercel via leur API
async function addVercelDomain(subdomain) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const appDomain = process.env.APP_DOMAIN;

  if (!token || !projectId || !appDomain) {
    console.log('   ⚠️  VERCEL_TOKEN / VERCEL_PROJECT_ID / APP_DOMAIN non configurés → sous-domaine à ajouter manuellement sur Vercel');
    return null;
  }

  const fullDomain = `${subdomain}.${appDomain}`;
  const body = JSON.stringify({ name: fullDomain });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vercel.com',
      path: `/v10/projects/${projectId}/domains`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(fullDomain);
        } else if (json.error?.code === 'domain_already_in_use') {
          resolve(fullDomain); // déjà configuré, pas grave
        } else {
          reject(new Error(json.error?.message || `Vercel API error ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

async function main() {
  const args = parseArgs();

  const name = args.name;
  const slug = args.slug;
  const ownerEmail = args['owner-email'];
  const ownerPassword = args['owner-password'];
  const ownerFirst = args['owner-first'] || 'Admin';
  const ownerLast = args['owner-last'] || name || 'Owner';
  const plan = args.plan; // optionnel : "pro" ou "premium"

  if (!name || !slug || !ownerEmail || !ownerPassword) {
    console.error('Usage : node scripts/create-agency.js --name "Nom" --slug "slug" --owner-email "email" --owner-password "mdp" [--owner-first "Prénom"] [--owner-last "Nom"] [--plan "pro"]');
    process.exit(1);
  }

  console.log(`\n🏢 Création de l'agence "${name}" (slug: ${slug})...\n`);

  // Vérifier que le slug n'existe pas déjà
  const existing = await prisma.agency.findUnique({ where: { slug } });
  if (existing) {
    console.error(`❌ Le slug "${slug}" est déjà utilisé par l'agence "${existing.name}" (id=${existing.id})`);
    process.exit(1);
  }

  // Vérifier que l'email n'existe pas déjà
  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existingUser) {
    console.error(`❌ L'email "${ownerEmail}" est déjà utilisé par l'utilisateur id=${existingUser.id}`);
    process.exit(1);
  }

  // 1. Créer l'agence
  const agency = await prisma.agency.create({
    data: {
      name,
      slug,
      isActive: true,
    }
  });
  console.log(`✅ Agence créée (id=${agency.id})`);

  // 2. Créer l'utilisateur OWNER
  const hashedPassword = await bcrypt.hash(ownerPassword, 10);
  const owner = await prisma.user.create({
    data: {
      email: ownerEmail,
      password: hashedPassword,
      firstName: ownerFirst,
      lastName: ownerLast,
      role: 'OWNER',
      agencyId: agency.id,
    }
  });
  console.log(`✅ Propriétaire créé : ${ownerFirst} ${ownerLast} (${ownerEmail}, id=${owner.id})`);

  // 3. Optionnel : créer une subscription
  if (plan === 'pro' || plan === 'premium') {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 10); // 10 ans (abonnement "éternel" admin)

    await prisma.subscription.create({
      data: {
        userId: owner.id,
        agencyId: agency.id,
        stripeSubscriptionId: `admin_${slug}_${Date.now()}`,
        stripePriceId: plan === 'premium' ? 'admin_premium' : 'admin_pro',
        stripeCustomerId: `admin_${slug}`,
        status: 'active',
        planName: plan,
        amount: plan === 'premium' ? 7900 : 3900,
        currency: 'eur',
        interval: 'month',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      }
    });
    console.log(`✅ Abonnement ${plan} activé`);
  }

  // 4. Ajouter le sous-domaine sur Vercel automatiquement
  let fullDomain = null;
  try {
    fullDomain = await addVercelDomain(slug);
    if (fullDomain) console.log(`✅ Sous-domaine Vercel ajouté : https://${fullDomain}`);
  } catch (err) {
    console.warn(`⚠️  Vercel : impossible d'ajouter le sous-domaine automatiquement (${err.message})`);
    console.warn(`   → Ajoutez manuellement "${slug}.${process.env.APP_DOMAIN || 'votre-domaine.com'}" dans votre projet Vercel`);
  }

  console.log(`\n🎉 Agence "${name}" prête !`);
  console.log(`   Slug    : ${slug}`);
  console.log(`   Owner   : ${ownerEmail}`);
  console.log(`   URL     : https://${fullDomain || `${slug}.${process.env.APP_DOMAIN || 'votre-domaine.com'}`}`);
  if (plan) console.log(`   Plan    : ${plan}`);
  console.log('');
}

main()
  .catch(e => {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
