# 🔧 Configuration des variables d'environnement sur Render

## Problème
Le backend a besoin des credentials Supabase pour uploader les photos, mais le fichier `.env` n'est pas (et ne doit pas être) commité dans Git pour des raisons de sécurité.

## Solution
Ajouter les variables d'environnement directement dans le dashboard Render.

---

## 📋 Étapes à suivre

### 1. Aller sur Render.com
- Connectez-vous sur [render.com](https://render.com)
- Allez dans votre service backend (probablement appelé `saas-immo` ou similaire)

### 2. Accéder aux variables d'environnement
- Dans le menu de gauche, cliquez sur **"Environment"**
- Vous verrez la liste des variables d'environnement existantes

### 3. Ajouter les nouvelles variables
Ajoutez ces **2 nouvelles variables** :

#### Variable 1: SUPABASE_URL
```
Key: SUPABASE_URL
Value: https://wcybvmyamnpkwpuabvqq.supabase.co
```

#### Variable 2: SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWJ2bXlhbW5wa3dwdWFidnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkxNjg5MiwiZXhwIjoyMDc4NDkyODkyfQ.7XLEg-g-n0dSgaBK9_9kjkUHlnXTkbE3dVdmWL2Bpd8
```

> ⚠️ **Important** : C'est la clé `service_role` qui permet de bypasser les restrictions RLS de Supabase. Ne jamais exposer cette clé côté frontend !

### 4. Sauvegarder
- Cliquez sur **"Save Changes"**
- Render va automatiquement redéployer votre backend avec les nouvelles variables

---

## 🔍 Vérifier que tout fonctionne

### 1. Attendre le redéploiement
Le redéploiement prend généralement **2-5 minutes**. Vous pouvez suivre la progression dans l'onglet **"Logs"**.

### 2. Tester l'upload
Une fois le déploiement terminé :
1. Allez sur votre application frontend
2. Essayez d'ajouter un nouveau bien avec une photo
3. Ou allez dans un bien existant et ajoutez une photo via la galerie

### 3. Vérifier les logs
Si l'upload ne fonctionne pas :
- Allez dans Render → Onglet **"Logs"**
- Cherchez des erreurs contenant `Supabase` ou `upload`
- Vérifiez que les variables sont bien chargées (vous devriez voir un log au démarrage)

---

## ✅ Ce qui devrait fonctionner maintenant

Avec cette configuration, voici ce qui se passe lors d'un upload :

1. **Frontend** : L'utilisateur sélectionne une image
2. **Frontend → Backend** : L'image est envoyée au backend via `POST /api/upload-image`
3. **Backend → Supabase** : Le backend upload l'image sur Supabase Storage en utilisant la `service_role` key (bypass RLS)
4. **Backend → Frontend** : Le backend retourne l'URL publique de l'image
5. **Frontend → Backend** : Le frontend enregistre l'URL dans la base de données via `POST /api/properties/:id/images`

---

## 🚨 Dépannage

### Erreur: "SUPABASE_URL is undefined"
- Vérifiez que vous avez bien sauvegardé les variables sur Render
- Vérifiez qu'il n'y a pas d'espace avant/après la clé ou la valeur
- Redéployez manuellement si nécessaire

### Erreur: "Invalid API key"
- Vérifiez que vous avez utilisé la clé **service_role** et non la clé **anon**
- La clé service_role se trouve dans Supabase → Settings → API → `service_role` (section "Project API keys")

### Les images ne s'affichent toujours pas
- Vérifiez que le bucket `property-images` existe dans Supabase Storage
- Vérifiez que le bucket est **PUBLIC**
- Testez l'URL d'une image directement dans le navigateur

---

## 📝 Récapitulatif des variables nécessaires

Voici **toutes** les variables d'environnement que votre backend doit avoir sur Render :

```env
# Base de données
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentification
JWT_SECRET=kE9!z$@8qLpW3jHc*R7b(GfD_2sF5aY+C(Uj-Nn_q)

# Services tiers
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=re_K25huwLE_...
STRIPE_SECRET_KEY=sk_test_51Sa2GbPb11hK6zTI...
REPLICATE_API_TOKEN=r8_KdsjlPBkghAYJB9a6QD2...

# Supabase (NOUVEAU - à ajouter)
SUPABASE_URL=https://wcybvmyamnpkwpuabvqq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://votre-frontend.vercel.app

# Node
NODE_OPTIONS=--dns-result-order=ipv4first

# Firebase (si utilisé)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

---

**Date de création** : 2025-12-14
**Status** : En attente de configuration sur Render
