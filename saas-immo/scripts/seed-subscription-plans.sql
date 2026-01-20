-- Script pour insérer/mettre à jour les plans d'abonnement
-- À exécuter après avoir créé les produits sur Stripe Dashboard

-- Supprimer les anciens plans (optionnel, décommenter si nécessaire)
-- DELETE FROM "SubscriptionPlan";

-- Insérer les 3 plans
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
) VALUES
  -- PLAN STARTER
  (
    'price_REMPLACEZ_PAR_VOTRE_PRICE_ID_STARTER',  -- ⚠️ À REMPLACER
    'prod_REMPLACEZ_PAR_VOTRE_PRODUCT_ID_STARTER', -- ⚠️ À REMPLACER
    'Starter',
    'starter',
    'Plan de démarrage pour petites agences',
    1900,                    -- 19.00 EUR (en centimes)
    'eur',
    'month',
    10,                      -- Max 10 propriétés
    50,                      -- Max 50 contacts
    3,                       -- Max 3 employés
    '["basic_crm", "basic_messaging", "email_support"]',
    true,                    -- Actif
    false,                   -- Pas mis en avant
    NOW(),
    NOW()
  ),

  -- PLAN PRO (Recommandé)
  (
    'price_REMPLACEZ_PAR_VOTRE_PRICE_ID_PRO',     -- ⚠️ À REMPLACER
    'prod_REMPLACEZ_PAR_VOTRE_PRODUCT_ID_PRO',    -- ⚠️ À REMPLACER
    'Pro',
    'pro',
    'Plan professionnel avec IA et intégrations avancées',
    4900,                    -- 49.00 EUR (en centimes)
    'eur',
    'month',
    50,                      -- Max 50 propriétés
    200,                     -- Max 200 contacts
    10,                      -- Max 10 employés
    '["advanced_crm", "ai_staging", "ai_description", "calendar_integration", "matching_ai", "priority_support"]',
    true,                    -- Actif
    true,                    -- Mis en avant (recommandé)
    NOW(),
    NOW()
  ),

  -- PLAN PREMIUM
  (
    'price_REMPLACEZ_PAR_VOTRE_PRICE_ID_PREMIUM',  -- ⚠️ À REMPLACER
    'prod_REMPLACEZ_PAR_VOTRE_PRODUCT_ID_PREMIUM', -- ⚠️ À REMPLACER
    'Premium',
    'premium',
    'Plan premium avec tout illimité et support dédié',
    9900,                    -- 99.00 EUR (en centimes)
    'eur',
    'month',
    NULL,                    -- Propriétés illimitées
    NULL,                    -- Contacts illimités
    NULL,                    -- Employés illimités
    '["unlimited_everything", "white_label", "dedicated_support", "custom_integration", "api_access"]',
    true,                    -- Actif
    false,                   -- Pas mis en avant
    NOW(),
    NOW()
  )
ON CONFLICT ("stripePriceId")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "amount" = EXCLUDED."amount",
  "maxProperties" = EXCLUDED."maxProperties",
  "maxContacts" = EXCLUDED."maxContacts",
  "maxEmployees" = EXCLUDED."maxEmployees",
  "features" = EXCLUDED."features",
  "isActive" = EXCLUDED."isActive",
  "isFeatured" = EXCLUDED."isFeatured",
  "updatedAt" = NOW();

-- Vérifier que les plans sont bien créés
SELECT id, name, slug, amount, "maxProperties", "maxContacts", "isActive"
FROM "SubscriptionPlan"
ORDER BY amount ASC;
