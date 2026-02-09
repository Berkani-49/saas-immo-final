-- Script pour insérer/mettre à jour les plans d'abonnement (3 tiers)
-- À exécuter après avoir créé les produits sur Stripe Dashboard

-- Supprimer les anciens plans pour repartir proprement
DELETE FROM "SubscriptionPlan";

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
  -- PLAN GRATUIT (pas de Stripe, placeholders)
  (
    'price_free_placeholder',
    'prod_free_placeholder',
    'Gratuit',
    'free',
    'Plan gratuit pour découvrir ImmoFlow',
    0,
    'eur',
    'month',
    3,                       -- Max 3 biens
    5,                       -- Max 5 contacts
    1,                       -- Proprio uniquement (pas d''employés)
    '["basic_crm", "tasks", "appointments", "rgpd"]',
    true,
    false,
    NOW(),
    NOW()
  ),

  -- PLAN PRO (39€/mois - Recommandé)
  (
    'price_REMPLACEZ_PAR_VOTRE_PRICE_ID_PRO',     -- À remplacer par le priceId Stripe
    'prod_REMPLACEZ_PAR_VOTRE_PRODUCT_ID_PRO',    -- À remplacer par le productId Stripe
    'Pro',
    'pro',
    'Pour les agents indépendants et petites agences',
    3900,                    -- 39.00 EUR (en centimes)
    'eur',
    'month',
    50,                      -- Max 50 biens
    200,                     -- Max 200 contacts
    3,                       -- Max 3 membres d''équipe
    '["basic_crm", "tasks", "appointments", "rgpd", "invoices", "activities", "team", "analytics", "notifications", "documents"]',
    true,
    true,                    -- Mis en avant (recommandé)
    NOW(),
    NOW()
  ),

  -- PLAN PREMIUM (79€/mois)
  (
    'price_REMPLACEZ_PAR_VOTRE_PRICE_ID_PREMIUM',  -- À remplacer par le priceId Stripe
    'prod_REMPLACEZ_PAR_VOTRE_PRODUCT_ID_PREMIUM', -- À remplacer par le productId Stripe
    'Premium',
    'premium',
    'Pour les agences qui veulent tout, sans limites',
    7900,                    -- 79.00 EUR (en centimes)
    'eur',
    'month',
    NULL,                    -- Biens illimités
    NULL,                    -- Contacts illimités
    NULL,                    -- Équipe illimitée
    '["basic_crm", "tasks", "appointments", "rgpd", "invoices", "activities", "team", "analytics", "notifications", "documents", "ai_staging", "ai_enhancement", "matching"]',
    true,
    false,
    NOW(),
    NOW()
  );

-- Vérifier que les plans sont bien créés
SELECT id, name, slug, amount, "maxProperties", "maxContacts", "maxEmployees", "isActive"
FROM "SubscriptionPlan"
ORDER BY amount ASC;
