# 🔐 Guide de Rotation des Clés API - URGENT

## ⚠️ ACTION IMMÉDIATE REQUISE

Vos credentials actuels dans le fichier `.env` **DOIVENT** être changés immédiatement car ils pourraient être exposés.

---

## 📋 Checklist de Rotation (30-45 minutes)

### 🔴 **CRITIQUE - À faire MAINTENANT**

#### 1. **Base de Données PostgreSQL (Supabase)**

**Action :**
```bash
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Settings > Database > Connection string
4. Cliquer sur "Reset database password"
5. Copier la nouvelle connexion string
```

**Mise à jour :**
- Render : Variables d'environnement
  - `DATABASE_URL` (pooled connection)
  - `DIRECT_URL` (direct connection)

**Temps estimé :** 5 minutes

---

#### 2. **JWT Secret**

**Action :**
```bash
# Générer un nouveau secret fort (32+ caractères)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ IMPORTANT :** Changer le JWT_SECRET **invalidera tous les tokens existants**.
Tous les utilisateurs devront se reconnecter.

**Mise à jour :**
- Render : `JWT_SECRET`
- Local : `.env`

**Temps estimé :** 2 minutes

---

#### 3. **OpenAI API Key**

**Action :**
```bash
1. Aller sur https://platform.openai.com/api-keys
2. "Create new secret key"
3. Nommer : "SaaS-Immo-Production-2026"
4. Copier la clé (commence par sk-proj-)
5. SUPPRIMER l'ancienne clé
```

**Mise à jour :**
- Render : `OPENAI_API_KEY`

**Temps estimé :** 3 minutes

---

#### 4. **Stripe Secret Key**

**Action :**
```bash
1. Aller sur https://dashboard.stripe.com/apikeys
2. Section "Secret key"
3. Cliquer sur "Roll secret key"
4. Confirmer
5. Copier la nouvelle clé
```

**⚠️ ATTENTION :** Si vous utilisez Stripe en production, faire ça en dehors des heures de pointe.

**Mise à jour :**
- Render : `STRIPE_SECRET_KEY`

**Temps estimé :** 3 minutes

---

#### 5. **Resend API Key**

**Action :**
```bash
1. Aller sur https://resend.com/api-keys
2. Créer nouvelle clé : "SaaS-Immo-Prod-2026"
3. Copier la clé (commence par re_)
4. Supprimer l'ancienne
```

**Mise à jour :**
- Render : `RESEND_API_KEY`

**Temps estimé :** 2 minutes

---

#### 6. **Replicate API Token**

**Action :**
```bash
1. Aller sur https://replicate.com/account/api-tokens
2. "Create token"
3. Nommer : "SaaS-Immo-2026"
4. Copier (commence par r8_)
5. Révoquer l'ancien
```

**Mise à jour :**
- Render : `REPLICATE_API_TOKEN`

**Temps estimé :** 2 minutes

---

#### 7. **Supabase Service Role Key**

**Action :**
```bash
1. Aller sur https://supabase.com/dashboard
2. Votre projet > Settings > API
3. Section "Service Role Key"
4. Cliquer sur l'icône "Regenerate"
5. Confirmer
6. Copier la nouvelle clé
```

**⚠️ ATTENTION :** Cette clé bypasse RLS. À manipuler avec précaution.

**Mise à jour :**
- Render : `SUPABASE_SERVICE_ROLE_KEY`

**Temps estimé :** 3 minutes

---

#### 8. **Firebase Service Account**

**Action :**
```bash
1. Aller sur https://console.firebase.google.com
2. Project Settings > Service Accounts
3. Cliquer sur "Generate new private key"
4. Télécharger le fichier JSON
5. Copier tout le contenu JSON
```

**Mise à jour :**
- Render : `FIREBASE_SERVICE_ACCOUNT` (coller le JSON complet)

**⚠️ Supprimez l'ancien service account :**
```bash
1. IAM & Admin > Service Accounts
2. Trouver l'ancien compte
3. Actions > Delete
```

**Temps estimé :** 5 minutes

---

#### 9. **VAPID Keys (Web Push)**

**Action :**
```bash
# Générer de nouvelles clés VAPID
cd saas-immo
npx web-push generate-vapid-keys
```

**Sortie :**
```
Public Key: BG...
Private Key: h0...
```

**⚠️ IMPACT :** Les utilisateurs devront se réabonner aux notifications push.

**Mise à jour :**
- Render :
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`

**Temps estimé :** 2 minutes

---

### 🟡 **Optionnel mais Recommandé**

#### 10. **Sentry DSN (si configuré)**

**Action :**
```bash
1. Aller sur https://sentry.io
2. Project Settings > Client Keys (DSN)
3. "Rotate DSN" ou créer une nouvelle clé
```

**Mise à jour :**
- Render : `SENTRY_DSN`

**Temps estimé :** 2 minutes

---

## 🚀 Après la Rotation

### 1. **Mettre à jour Render**

```bash
1. Aller sur https://dashboard.render.com
2. Sélectionner votre service backend
3. Environment > Variables
4. Mettre à jour TOUTES les clés listées ci-dessus
5. Cliquer "Save Changes"
6. Le service redémarrera automatiquement
```

### 2. **Tester l'application**

```bash
# Vérifier que l'app démarre sans erreur
curl https://saas-immo.onrender.com/health

# Tester l'authentification
# Tester la création d'un bien
# Tester les notifications
```

### 3. **Notifier les utilisateurs**

Si vous avez changé le JWT_SECRET, envoyez un email :

```
Sujet : Maintenance de sécurité - Reconnexion requise

Bonjour,

Nous avons effectué une mise à jour de sécurité de notre plateforme.
Par mesure de précaution, veuillez vous reconnecter à votre compte.

Merci de votre compréhension.
L'équipe [Votre SaaS]
```

---

## 📝 Fichier de Suivi

Créez un fichier `SECURITY_ROTATION_LOG.md` (NE PAS commiter) :

```markdown
# Log de Rotation des Clés

## Date : 2026-01-19

| Service | Ancienne Clé (4 derniers caractères) | Nouvelle Clé | Date | Status |
|---------|--------------------------------------|--------------|------|--------|
| Database | ...abc1 | ...xyz9 | 2026-01-19 | ✅ |
| JWT | ...def2 | ...uvw8 | 2026-01-19 | ✅ |
| OpenAI | ...ghi3 | ...rst7 | 2026-01-19 | ✅ |
| Stripe | ...jkl4 | ...opq6 | 2026-01-19 | ✅ |
| Resend | ...mno5 | ...lmn5 | 2026-01-19 | ✅ |
| Replicate | ...pqr6 | ...ijk4 | 2026-01-19 | ✅ |
| Supabase | ...stu7 | ...ghi3 | 2026-01-19 | ✅ |
| Firebase | ...vwx8 | ...def2 | 2026-01-19 | ✅ |
| VAPID | ...yza9 | ...abc1 | 2026-01-19 | ✅ |

## Notes
- Tous les utilisateurs notifiés de la reconnexion requise
- Tests complets effectués
- Monitoring Sentry actif
```

---

## 🔒 Bonnes Pratiques de Sécurité

### 1. **Rotation Régulière**
- JWT_SECRET : tous les 3-6 mois
- API Keys : tous les 6-12 mois
- Database password : tous les 12 mois

### 2. **Stockage Sécurisé**
- Utilisez un gestionnaire de mots de passe (1Password, Bitwarden)
- Ne stockez JAMAIS les clés en clair dans des documents
- Utilisez les services de secrets (AWS Secrets Manager, HashiCorp Vault) en production

### 3. **Monitoring**
- Activez les alertes de connexion suspecte sur tous les services
- Vérifiez régulièrement les logs d'accès API
- Configurez Sentry pour tracker les erreurs d'authentification

### 4. **Accès Minimal**
- Principe du moindre privilège
- Créez des clés API avec des scopes limités quand possible
- Révoquez immédiatement les clés inutilisées

### 5. **Documentation**
- Maintenez une liste à jour des services utilisés
- Documentez qui a accès à quoi
- Ayez un plan de réponse en cas de fuite

---

## 🆘 En Cas de Fuite Avérée

Si vous savez que vos clés ont été exposées publiquement :

### Immédiatement (0-15 min)
1. ✅ Révoquer TOUTES les clés exposées
2. ✅ Changer le mot de passe de la base de données
3. ✅ Désactiver temporairement l'API si nécessaire

### Rapidement (15-60 min)
4. ✅ Générer de nouvelles clés
5. ✅ Mettre à jour Render
6. ✅ Vérifier les logs pour activité suspecte

### Court Terme (1-24h)
7. ✅ Notifier les utilisateurs
8. ✅ Analyser les logs d'accès
9. ✅ Faire un audit de sécurité complet
10. ✅ Documenter l'incident

### Moyen Terme (1-7 jours)
11. ✅ Renforcer la sécurité (2FA partout)
12. ✅ Mettre en place des alertes
13. ✅ Former l'équipe sur les bonnes pratiques

---

## 📞 Support

**Services à contacter en cas de problème :**

- **Supabase** : https://supabase.com/support
- **Stripe** : https://support.stripe.com
- **OpenAI** : https://help.openai.com
- **Resend** : support@resend.com
- **Replicate** : help@replicate.com

---

**Dernière mise à jour** : 2026-01-19
**Temps total estimé** : 30-45 minutes
**Criticité** : 🔴 URGENT

---

**Une fois toutes les clés changées, supprimez l'ancien fichier .env et ne le commitez JAMAIS !**
