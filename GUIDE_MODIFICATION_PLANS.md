# 📝 Guide : Modifier les Plans d'Abonnement

## 🎯 Objectif
Ce guide vous explique comment créer, modifier ou supprimer des plans d'abonnement dans votre application SaaS.

---

## ✅ Méthode 1 : Créer de Nouveaux Plans (Recommandé)

### Étape 1 : Créer les produits sur Stripe

1. Allez sur **https://dashboard.stripe.com/products**
2. Cliquez sur **"+ Add product"**
3. Pour chaque plan, remplissez :

#### Plan Starter (19€/mois)
```
Name: ImmoPro Starter
Description: Plan de démarrage pour petites agences
Pricing model: Standard pricing
Price: 19.00 EUR
Billing period: Monthly (recurring)
```
→ **Copiez le `price_id`** (ex: `price_1ABC123...`)
→ **Copiez le `product_id`** (ex: `prod_ABC123...`)

#### Plan Pro (49€/mois) - Recommandé
```
Name: ImmoPro Pro
Description: Plan professionnel avec IA
Pricing model: Standard pricing
Price: 49.00 EUR
Billing period: Monthly (recurring)
```
→ **Copiez le `price_id`**
→ **Copiez le `product_id`**

#### Plan Premium (99€/mois)
```
Name: ImmoPro Premium
Description: Plan premium illimité
Pricing model: Standard pricing
Price: 99.00 EUR
Billing period: Monthly (recurring)
```
→ **Copiez le `price_id`**
→ **Copiez le `product_id`**

---

### Étape 2 : Modifier le fichier SQL

1. Ouvrez le fichier `saas-immo/scripts/seed-subscription-plans.sql`
2. Remplacez les valeurs suivantes :

**Ligne 22 :**
```sql
'price_REMPLACEZ_PAR_VOTRE_PRICE_ID_STARTER',
```
↓ Remplacez par votre price_id Stripe, par exemple :
```sql
'price_1QYhZ7RqJ9xKLmN2oP3qR4sT',
```

**Ligne 23 :**
```sql
'prod_REMPLACEZ_PAR_VOTRE_PRODUCT_ID_STARTER',
```
↓ Remplacez par votre product_id Stripe

**Répétez pour les 3 plans** (Starter, Pro, Premium)

---

### Étape 3 : Personnaliser les Limites et Prix

Vous pouvez modifier ces valeurs dans le SQL :

**Prix (en centimes) :**
```sql
"amount",
1900,  -- 19.00 EUR → Changez en 2900 pour 29.00 EUR
```

**Limites :**
```sql
"maxProperties",
10,    -- Changez selon vos besoins (NULL = illimité)

"maxContacts",
50,    -- Changez selon vos besoins

"maxEmployees",
3,     -- Changez selon vos besoins
```

**Fonctionnalités :**
```sql
"features",
'["basic_crm", "basic_messaging", "email_support"]',  -- Format JSON
```

Exemples de fonctionnalités :
- `basic_crm` - CRM de base
- `advanced_crm` - CRM avancé
- `ai_staging` - Staging virtuel IA
- `ai_description` - Descriptions IA
- `calendar_integration` - Intégration calendrier
- `matching_ai` - Matching intelligent
- `priority_support` - Support prioritaire
- `unlimited_everything` - Tout illimité
- `white_label` - Marque blanche
- `api_access` - Accès API

---

### Étape 4 : Exécuter le SQL

**Option A : Avec psql (ligne de commande)**
```bash
# Depuis le dossier saas-immo
psql "postgresql://postgres.uxzmnufqbnnghyfnbxvh:cihzox-Ryxvup-qaxha8@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" -f scripts/seed-subscription-plans.sql
```

**Option B : Avec Supabase Dashboard**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Menu **SQL Editor**
4. Copiez-collez le contenu du fichier `seed-subscription-plans.sql`
5. Cliquez sur **Run**

**Option C : Avec Prisma Studio**
```bash
cd saas-immo
npx prisma studio
```
Puis créez les plans manuellement via l'interface.

---

### Étape 5 : Ajouter les Variables d'Environnement

Dans Render Dashboard → Environment, ajoutez :

```bash
STRIPE_PRICE_ID_STARTER=price_VOTRE_ID_STARTER
STRIPE_PRICE_ID_PRO=price_VOTRE_ID_PRO
STRIPE_PRICE_ID_PREMIUM=price_VOTRE_ID_PREMIUM
```

(Ces variables sont optionnelles, elles peuvent être utilisées dans le frontend)

---

## 🔧 Méthode 2 : Modifier des Plans Existants

### Modifier les prix (Stripe)

**⚠️ Important :** Vous ne pouvez pas modifier un prix existant sur Stripe. Vous devez :

1. Créer un **nouveau prix** pour le même produit
2. Mettre à jour la base de données avec le nouveau `price_id`
3. Les abonnements existants continueront avec l'ancien prix (sauf si vous les migrez)

### Modifier les limites (Base de données)

```sql
-- Exemple : Augmenter la limite de propriétés du plan Starter
UPDATE "SubscriptionPlan"
SET
  "maxProperties" = 20,    -- Était 10, maintenant 20
  "updatedAt" = NOW()
WHERE slug = 'starter';

-- Exemple : Rendre les contacts illimités pour le plan Pro
UPDATE "SubscriptionPlan"
SET
  "maxContacts" = NULL,    -- NULL = illimité
  "updatedAt" = NOW()
WHERE slug = 'pro';
```

### Modifier les fonctionnalités

```sql
-- Ajouter une fonctionnalité au plan Pro
UPDATE "SubscriptionPlan"
SET
  "features" = '["advanced_crm", "ai_staging", "ai_description", "calendar_integration", "matching_ai", "priority_support", "reports_advanced"]'::jsonb,
  "updatedAt" = NOW()
WHERE slug = 'pro';
```

---

## ➕ Méthode 3 : Ajouter un Nouveau Plan

### Exemple : Créer un plan "Entreprise" à 199€/mois

**1. Créer sur Stripe Dashboard**
```
Name: ImmoPro Entreprise
Price: 199.00 EUR
Billing: Monthly
```

**2. Insérer dans la base de données**
```sql
INSERT INTO "SubscriptionPlan" (
  "stripePriceId",
  "stripeProductId",
  "name",
  "slug",
  "description",
  "amount",
  "currency",
  "interval",
  "maxProperties",
  "maxContacts",
  "maxEmployees",
  "features",
  "isActive",
  "isFeatured",
  "createdAt",
  "updatedAt"
) VALUES (
  'price_VOTRE_NOUVEAU_PRICE_ID',
  'prod_VOTRE_NOUVEAU_PRODUCT_ID',
  'Entreprise',
  'entreprise',
  'Plan entreprise avec fonctionnalités sur mesure',
  19900,  -- 199.00 EUR
  'eur',
  'month',
  NULL,   -- Illimité
  NULL,   -- Illimité
  NULL,   -- Illimité
  '["unlimited_everything", "white_label", "dedicated_support", "custom_integration", "api_access", "multi_agency"]',
  true,
  false,
  NOW(),
  NOW()
);
```

---

## 🗑️ Méthode 4 : Désactiver un Plan

**⚠️ Ne supprimez JAMAIS un plan qui a des abonnements actifs !**

À la place, désactivez-le :

```sql
-- Désactiver le plan Starter (il n'apparaîtra plus sur la page pricing)
UPDATE "SubscriptionPlan"
SET
  "isActive" = false,
  "updatedAt" = NOW()
WHERE slug = 'starter';

-- Les utilisateurs existants conservent leur abonnement
-- Mais les nouveaux utilisateurs ne pourront plus le choisir
```

---

## 🧪 Vérifier les Plans

### Via SQL
```sql
-- Voir tous les plans actifs
SELECT
  id,
  name,
  slug,
  amount / 100.0 as price_eur,
  "maxProperties",
  "maxContacts",
  "maxEmployees",
  "isActive",
  "isFeatured"
FROM "SubscriptionPlan"
WHERE "isActive" = true
ORDER BY amount ASC;
```

### Via API
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://saas-immo.onrender.com/api/billing/plans
```

---

## 📊 Créer des Variantes Annuelles

Pour offrir des réductions sur la facturation annuelle :

**1. Créer le prix annuel sur Stripe**
```
Name: ImmoPro Pro (Annuel)
Price: 490.00 EUR  (au lieu de 588€, soit 2 mois gratuits)
Billing period: Yearly
```

**2. Ajouter à la base de données**
```sql
INSERT INTO "SubscriptionPlan" (
  "stripePriceId",
  "stripeProductId",
  "name",
  "slug",
  "description",
  "amount",
  "currency",
  "interval",  -- ⚠️ 'year' au lieu de 'month'
  "maxProperties",
  "maxContacts",
  "maxEmployees",
  "features",
  "isActive",
  "isFeatured",
  "createdAt",
  "updatedAt"
) VALUES (
  'price_VOTRE_PRICE_ID_ANNUEL',
  'prod_PRO_PRODUCT_ID',  -- Même product_id que le plan Pro mensuel
  'Pro (Annuel)',
  'pro-yearly',
  'Plan Pro avec facturation annuelle - 2 mois gratuits',
  49000,  -- 490.00 EUR
  'eur',
  'year',  -- 🎯 ANNUEL
  50,
  200,
  10,
  '["advanced_crm", "ai_staging", "ai_description", "calendar_integration", "matching_ai", "priority_support"]',
  true,
  true,
  NOW(),
  NOW()
);
```

---

## 🎨 Afficher les Plans sur le Frontend

Votre API `/api/billing/plans` retourne automatiquement tous les plans actifs.

Exemple de réponse :
```json
{
  "plans": [
    {
      "id": 1,
      "name": "Starter",
      "slug": "starter",
      "description": "Plan de démarrage",
      "amount": 1900,
      "currency": "eur",
      "interval": "month",
      "maxProperties": 10,
      "maxContacts": 50,
      "features": ["basic_crm", "basic_messaging"],
      "stripePriceId": "price_ABC123"
    }
  ]
}
```

---

## ❓ FAQ

**Q: Puis-je changer le prix d'un plan existant ?**
R: Non sur Stripe. Vous devez créer un nouveau prix. Les abonnements existants gardent l'ancien prix.

**Q: Que se passe-t-il si je modifie les limites ?**
R: Les nouvelles limites s'appliquent immédiatement à tous les utilisateurs du plan.

**Q: Comment migrer les utilisateurs vers un nouveau prix ?**
R: Utilisez l'API admin `POST /api/admin/subscriptions/:userId/update-plan` avec le nouveau `priceId`.

**Q: Puis-je avoir plus de 3 plans ?**
R: Oui ! Ajoutez autant de plans que vous voulez en suivant la Méthode 3.

**Q: Comment tester sans facturer ?**
R: Utilisez les clés de test Stripe (`sk_test_...`) et la carte de test `4242 4242 4242 4242`.

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Stripe Dashboard
2. Consultez les logs du webhook dans `StripeWebhookEvent`
3. Vérifiez que les `price_id` correspondent entre Stripe et votre base de données

---

**Dernière mise à jour :** 2026-01-20
