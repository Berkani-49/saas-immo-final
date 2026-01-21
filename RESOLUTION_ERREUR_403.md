# 🔒 Résolution de l'Erreur 403 : "Seul le propriétaire peut ajouter des employés"

## 🐛 Problème

Vous voyez cette erreur quand vous essayez d'ajouter un employé :
```
Erreur : Request failed with status code 403
Seul le propriétaire peut ajouter des employés
```

## 🔍 Cause

L'utilisateur actuellement connecté n'a **pas le rôle OWNER** dans la base de données.

Seuls les utilisateurs avec le rôle `OWNER` peuvent :
- Ajouter des employés
- Supprimer des employés
- Réinitialiser les mots de passe des employés

## ✅ Solution 1 : Se Connecter avec le Compte Owner (Recommandé)

Vous avez déjà un compte OWNER dans votre base de données :

**Email** : `amirelattaoui@gmail.com`
**Nom** : Amir El Attaoui
**Rôle** : OWNER

### Étapes :
1. Déconnectez-vous de votre compte actuel
2. Reconnectez-vous avec `amirelattaoui@gmail.com`
3. Essayez d'ajouter un employé

## ✅ Solution 2 : Définir Votre Compte Actuel comme OWNER

Si vous voulez utiliser un autre compte comme propriétaire, vous devez changer son rôle.

### Étape 1 : Lister les utilisateurs

```bash
cd saas-immo
node scripts/list-users.js
```

Cela affichera tous les utilisateurs avec leurs emails et rôles.

### Étape 2 : Identifier votre email

Notez l'email du compte avec lequel vous êtes connecté actuellement sur le frontend.

### Étape 3 : Définir ce compte comme OWNER

```bash
node scripts/set-user-as-owner.js VOTRE_EMAIL@example.com
```

**Exemple** :
```bash
node scripts/set-user-as-owner.js pierre.dupont@agence.com
```

### Étape 4 : Tester

1. Rechargez la page du frontend (ou reconnectez-vous)
2. Essayez d'ajouter un employé
3. Ça devrait fonctionner ! ✅

---

## 🧪 Vérifier le Rôle de l'Utilisateur Connecté

Si vous ne savez pas quel utilisateur est connecté :

### Option A : Via les DevTools du navigateur

1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet **Application** (ou **Stockage**)
3. Cherchez dans **Local Storage** ou **Session Storage**
4. Trouvez la clé `token` ou `user`
5. Copiez le token JWT
6. Allez sur https://jwt.io et collez le token
7. Regardez dans le payload : vous verrez l'`id` et l'`email` de l'utilisateur

### Option B : Ajouter un console.log temporaire

Dans votre frontend, ajoutez temporairement dans `SecretRegister.jsx` :

```javascript
console.log('Utilisateur connecté:', token);
```

Le token JWT contient les infos de l'utilisateur.

---

## 🔧 Exécuter les Scripts sur Render (Production)

Si vous voulez changer le rôle d'un utilisateur directement sur la production (Render) :

### Étape 1 : Se connecter à Render Shell

1. Allez sur https://dashboard.render.com
2. Sélectionnez votre service `saas-immo`
3. Cliquez sur **Shell** dans le menu de gauche
4. Une console s'ouvre

### Étape 2 : Exécuter le script

```bash
node scripts/list-users.js
```

Puis :

```bash
node scripts/set-user-as-owner.js EMAIL_A_DEFINIR@example.com
```

### Étape 3 : Tester

Essayez à nouveau d'ajouter un employé depuis le frontend.

---

## 📋 Scripts Disponibles

Nous avons créé 3 scripts utiles :

### 1. Lister les utilisateurs
```bash
node scripts/list-users.js
```
Affiche tous les utilisateurs avec leurs rôles.

### 2. Définir un utilisateur comme OWNER
```bash
node scripts/set-user-as-owner.js <email>
```
Change le rôle d'un utilisateur en OWNER.

### 3. Lister les plans d'abonnement
```bash
node scripts/manage-plans.js list
```

---

## ❓ FAQ

**Q : Peut-on avoir plusieurs OWNER ?**
R : Oui ! Plusieurs utilisateurs peuvent avoir le rôle OWNER. Ils pourront tous gérer les employés.

**Q : Un EMPLOYEE peut-il ajouter d'autres employés ?**
R : Non, pour des raisons de sécurité. Seul un OWNER peut le faire.

**Q : Que se passe-t-il si je change le rôle d'un OWNER en EMPLOYEE ?**
R : Il perdra immédiatement la permission d'ajouter/supprimer des employés.

**Q : Comment voir mon rôle actuel dans le frontend ?**
R : Ajoutez une page "Mon Profil" qui affiche les infos de l'utilisateur connecté, ou utilisez les DevTools (voir ci-dessus).

---

## 🎯 Récapitulatif

1. **Vérifiez quel utilisateur est connecté** sur le frontend
2. **Vérifiez son rôle** avec `node scripts/list-users.js`
3. Si le rôle est EMPLOYEE :
   - **Soit** connectez-vous avec `amirelattaoui@gmail.com` (OWNER existant)
   - **Soit** changez le rôle avec `node scripts/set-user-as-owner.js <email>`
4. **Testez** l'ajout d'un employé

---

**Dernière mise à jour** : 2026-01-21
**Status** : ✅ Scripts testés et fonctionnels
