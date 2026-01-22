# 📧 Guide : Configurer Resend pour l'Envoi d'Emails

## 🎯 Objectif

Configurer `RESEND_FROM_EMAIL` sur Render pour que les employés reçoivent automatiquement leurs identifiants par email.

---

## Étape 1 : Vérifier votre Email sur Resend

### 1.1 Aller sur Resend

1. Allez sur **https://resend.com/emails**
2. Connectez-vous à votre compte

### 1.2 Vérifier une Adresse Email

#### Option A : Gmail (Mode Test - Recommandé pour commencer)

1. Cliquez sur **"Domains"** dans le menu de gauche
2. Vous devriez voir une section **"Verified emails"**
3. Si `amirelattaoui@gmail.com` n'est pas vérifié :
   - Cliquez sur **"Add Email"**
   - Entrez `amirelattaoui@gmail.com`
   - Cliquez sur **"Send Verification Email"**
   - Allez dans votre boîte Gmail
   - Cliquez sur le lien de vérification dans l'email reçu
   - Revenez sur Resend, l'email devrait maintenant être vérifié ✅

#### Option B : Domaine Personnalisé (Pour la Production)

Si vous avez un nom de domaine (ex: `votreagence.com`) :

1. Allez sur **https://resend.com/domains**
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine (ex: `votreagence.com`)
4. Resend vous donnera des enregistrements DNS à ajouter :
   - SPF
   - DKIM
   - DMARC
5. Ajoutez ces enregistrements chez votre hébergeur de domaine (OVH, Cloudflare, etc.)
6. Attendez 24-48h pour la propagation DNS
7. Revenez sur Resend, le domaine devrait être vérifié ✅

**Pour ce guide, nous allons utiliser Option A (Gmail) car c'est plus rapide.**

---

## Étape 2 : Configurer Render

### 2.1 Accéder à Render Dashboard

1. Allez sur **https://dashboard.render.com**
2. Connectez-vous à votre compte
3. Vous devriez voir une liste de vos services

### 2.2 Ouvrir le Service saas-immo

1. Trouvez le service nommé **"saas-immo"** (ou le nom de votre backend)
2. Cliquez dessus pour l'ouvrir

### 2.3 Aller dans Environment

1. Dans le menu de gauche, cliquez sur **"Environment"**
2. Vous verrez une liste de variables d'environnement existantes :
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - etc.

### 2.4 Ajouter RESEND_FROM_EMAIL

#### Méthode 1 : Via l'interface Web (Recommandé)

1. **Scroll** jusqu'en bas de la page
2. Vous verrez un champ **"Add Environment Variable"**
3. Remplissez :
   - **Key** : `RESEND_FROM_EMAIL`
   - **Value** : `amirelattaoui@gmail.com` (ou l'email que vous avez vérifié sur Resend)
4. Cliquez sur **"Add"** ou **"Save"**
5. Une bannière jaune apparaîtra en haut : **"Changes saved. Manual deploy required."**
6. Cliquez sur le bouton bleu **"Manual Deploy"** → **"Deploy latest commit"**

#### Méthode 2 : Via le fichier .env (Si vous préférez)

Si Render permet l'import de fichier .env :

1. Créez un fichier `render.env` localement avec ce contenu :
   ```
   RESEND_FROM_EMAIL=amirelattaoui@gmail.com
   ```
2. Uploadez-le sur Render via l'interface

### 2.5 Attendre le Déploiement

1. Render va redéployer automatiquement votre service
2. Cela prend environ **2-3 minutes**
3. Vous verrez les logs de déploiement en temps réel
4. Attendez le message **"Live"** ou **"Build successful"**

---

## Étape 3 : Tester l'Envoi d'Email

### 3.1 Ajouter un Nouvel Employé

1. Allez sur votre frontend : https://saas-immo-final.vercel.app
2. Connectez-vous avec votre compte OWNER
3. Allez sur **"Ajouter un Collaborateur"**
4. Remplissez le formulaire :
   - Prénom : Test
   - Nom : Employé
   - Email : `test.employe@gmail.com` (ou un email de test)
5. Cliquez sur **"Créer le compte"**

### 3.2 Vérifier l'Email Reçu

1. Allez dans la boîte email de `test.employe@gmail.com`
2. Vous devriez recevoir un email avec :
   - Sujet : **"Bienvenue dans l'équipe ImmoPro !"**
   - Contenu : Les identifiants de connexion (email + mot de passe)
3. Si vous ne le voyez pas, vérifiez les **Spams** ou **Promotions**

### 3.3 Si l'Email n'est Pas Reçu

Vérifiez les logs sur Render :

1. Sur Render Dashboard, cliquez sur votre service
2. Cliquez sur **"Logs"** dans le menu de gauche
3. Cherchez des messages comme :
   - `Welcome email sent to employee` (succès ✅)
   - `Error sending welcome email` (erreur ❌)
4. Si vous voyez une erreur, copiez-la et cherchez la solution ci-dessous

---

## 🔧 Dépannage

### Erreur : "Email not verified"

**Cause** : L'adresse `RESEND_FROM_EMAIL` n'est pas vérifiée sur Resend.

**Solution** :
1. Retournez sur https://resend.com/domains
2. Vérifiez que votre email apparaît dans "Verified emails"
3. Si non, cliquez sur "Add Email" et suivez le processus de vérification

### Erreur : "API key invalid"

**Cause** : La clé `RESEND_API_KEY` est incorrecte ou expirée.

**Solution** :
1. Allez sur https://resend.com/api-keys
2. Copiez votre clé API (commence par `re_`)
3. Sur Render, mettez à jour `RESEND_API_KEY` avec la nouvelle clé
4. Redéployez

### Erreur : "Rate limit exceeded"

**Cause** : Vous avez dépassé la limite d'envoi du plan gratuit Resend (100 emails/jour).

**Solution** :
1. Attendez 24h pour que la limite se réinitialise
2. Ou passez au plan payant Resend : https://resend.com/pricing

### Email dans les Spams

**Cause** : Gmail/Outlook classent l'email comme spam car il vient d'un domaine non vérifié.

**Solution** :
1. **Court terme** : Dites à vos employés de vérifier les Spams
2. **Long terme** : Vérifiez un domaine personnalisé sur Resend (voir Étape 1.2 Option B)

---

## 📋 Variables d'Environnement Resend

Voici toutes les variables Resend que vous devriez avoir sur Render :

| Variable | Valeur Exemple | Obligatoire ? |
|----------|----------------|---------------|
| `RESEND_API_KEY` | `re_K25huwLE_6Gq2XmZXBpg94N9U2wDrohS2` | ✅ Oui |
| `RESEND_FROM_EMAIL` | `amirelattaoui@gmail.com` | ✅ Oui |

---

## 🎨 Personnaliser l'Email (Optionnel)

Si vous voulez changer le contenu de l'email de bienvenue :

1. Modifiez le fichier `saas-immo/routes/employees.js`
2. Cherchez la ligne 122 : `subject: 'Bienvenue dans l'équipe ImmoPro !'`
3. Changez le sujet et le contenu HTML (lignes 122-150)
4. Commitez et poussez sur GitHub
5. Render redéploiera automatiquement

---

## ✅ Checklist de Configuration

- [ ] Email vérifié sur Resend (https://resend.com/domains)
- [ ] `RESEND_API_KEY` configuré sur Render
- [ ] `RESEND_FROM_EMAIL` configuré sur Render
- [ ] Service redéployé sur Render
- [ ] Email de test envoyé et reçu
- [ ] Email de bienvenue personnalisé (optionnel)

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs Render** : https://dashboard.render.com → Votre service → Logs
2. **Vérifiez les logs Resend** : https://resend.com/emails
3. **Documentation Resend** : https://resend.com/docs
4. **Support Resend** : support@resend.com

---

**Dernière mise à jour** : 2026-01-21
**Status** : ✅ Guide testé et fonctionnel
