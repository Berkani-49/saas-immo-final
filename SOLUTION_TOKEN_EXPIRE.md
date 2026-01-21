# 🔐 Solution : Token JWT Expiré

## 🐛 Symptôme

Vous voyez cette erreur dans la console :
```
Error: Request failed with status code 403
response: {data: "Forbidden", status: 403}
```

## 🔍 Cause

Votre **token JWT est expiré**. Les tokens JWT ont une durée de vie de **24 heures**.

Si vous ne vous êtes pas reconnecté depuis plus de 24h, le token stocké dans votre navigateur est invalide.

## ✅ Solution Simple

### Étape 1 : Déconnectez-vous

Sur le frontend, cliquez sur **"Se déconnecter"** ou **"Déconnexion"**.

### Étape 2 : Reconnectez-vous

Reconnectez-vous avec votre email et mot de passe.

Un nouveau token valide sera généré automatiquement.

### Étape 3 : Testez

Essayez à nouveau d'ajouter un employé. **Ça devrait fonctionner !** ✅

---

## 🔧 Solution Alternative : Vider le Cache

Si la déconnexion ne fonctionne pas :

### Option A : Vider le Local Storage manuellement

1. Ouvrez les DevTools (F12 ou Cmd+Option+I)
2. Allez dans l'onglet **Application** (Chrome) ou **Stockage** (Firefox)
3. Cherchez **Local Storage** ou **Session Storage**
4. Trouvez l'entrée `token` et **supprimez-la**
5. Rechargez la page
6. Reconnectez-vous

### Option B : Fenêtre Privée

1. Ouvrez une **fenêtre de navigation privée** (Ctrl+Shift+N ou Cmd+Shift+N)
2. Allez sur votre site
3. Connectez-vous
4. Essayez d'ajouter un employé

---

## 📊 Durée de Vie des Tokens

- **Token JWT** : 24 heures
- Après 24h, vous devez vous reconnecter
- C'est une mesure de sécurité normale

---

## 🔄 Améliorations Apportées

J'ai amélioré le code pour que les messages d'erreur soient plus clairs :

### Avant (❌ Ancien code)
```javascript
catch (e) { res.sendStatus(403); }
// Retourne juste "Forbidden" (texte brut)
```

### Après (✅ Nouveau code)
```javascript
catch (e) {
  if (e.name === 'TokenExpiredError') {
    return res.status(403).json({
      error: 'Token expiré. Veuillez vous reconnecter.'
    });
  }
  return res.status(403).json({ error: 'Token invalide' });
}
```

Maintenant, quand un token expire, vous verrez :
```json
{
  "error": "Token expiré. Veuillez vous reconnecter."
}
```

Au lieu de juste `"Forbidden"`.

---

## 🎯 Pour les Développeurs

### Tester l'Expiration du Token

Si vous voulez tester l'expiration, vous pouvez temporairement réduire la durée de vie :

**Dans `server.js` ligne 863** :
```javascript
// Avant (production)
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

// Test (expire après 30 secondes)
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30s' });
```

⚠️ **N'oubliez pas de remettre `'24h'` après le test !**

### Décoder un Token JWT

Pour voir le contenu d'un token :

1. Copiez le token depuis le Local Storage
2. Allez sur https://jwt.io
3. Collez le token dans la section "Encoded"
4. Vous verrez :
   - **Header** : algorithme (HS256)
   - **Payload** : `{ id: 4, iat: ..., exp: ... }`
   - **iat** : date de création (timestamp)
   - **exp** : date d'expiration (timestamp)

### Augmenter la Durée de Vie (Optionnel)

Si vous voulez que les tokens durent plus longtemps :

**Dans `server.js` ligne 863** :
```javascript
// 24 heures (actuel)
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

// 7 jours (moins sécurisé, mais plus pratique)
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

// 30 jours (encore moins sécurisé)
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
```

⚠️ **Important** : Plus la durée est longue, moins c'est sécurisé. Si un token est volé, l'attaquant aura accès au compte jusqu'à l'expiration.

**Recommandation** : Garder 24h pour la sécurité, et demander aux utilisateurs de se reconnecter chaque jour.

---

## ❓ FAQ

**Q : Pourquoi le token expire ?**
R : C'est une mesure de sécurité. Si quelqu'un vole votre token, il ne pourra l'utiliser que pendant 24h maximum.

**Q : Puis-je augmenter la durée à 1 mois ?**
R : Oui, mais c'est moins sécurisé. 24h est un bon compromis entre sécurité et confort.

**Q : Comment savoir si mon token est expiré ?**
R : Maintenant, le backend vous renvoie un message clair : "Token expiré. Veuillez vous reconnecter."

**Q : Que se passe-t-il si je ne me reconnecte pas ?**
R : Vous ne pourrez plus accéder aux routes protégées (ajouter des employés, des biens, etc.). Vous verrez des erreurs 403.

**Q : Le token est-il régénéré automatiquement ?**
R : Non, vous devez vous reconnecter manuellement. Certaines applications utilisent un "refresh token" pour régénérer automatiquement, mais ce n'est pas implémenté ici.

---

## 🚀 Prochaines Améliorations (Optionnelles)

### 1. Refresh Token

Implémenter un système de refresh token pour éviter de demander à l'utilisateur de se reconnecter toutes les 24h.

### 2. Auto-Déconnexion

Ajouter un message dans le frontend qui détecte quand le token va expirer et prévient l'utilisateur.

### 3. Interception Axios

Configurer Axios pour intercepter les erreurs 403 et rediriger automatiquement vers la page de connexion.

**Exemple** :
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Token expiré, rediriger vers login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

**Dernière mise à jour** : 2026-01-21
**Status** : ✅ Problème résolu - Il suffit de se reconnecter
