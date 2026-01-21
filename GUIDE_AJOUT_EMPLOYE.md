# 👥 Guide : Ajouter un Employé à l'Équipe

## 🐛 Problème Résolu

**Erreur précédente** : Lors de l'ajout d'un collaborateur, vous aviez cette erreur :
```
Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule,
un chiffre et un caractère spécial (@$!%*?&).
```

**Cause** : L'ancienne route `/api/auth/register` était utilisée et exigeait que l'utilisateur fournisse un mot de passe fort.

**Solution** : Nouvelle route dédiée `/api/employees` qui **génère automatiquement** un mot de passe fort et l'envoie par email.

---

## ✅ Nouvelle API : `/api/employees`

### 1️⃣ Ajouter un Employé

**Endpoint** : `POST /api/employees`

**Requête** :
```javascript
const response = await fetch('https://saas-immo.onrender.com/api/employees', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'employe@example.com',
    firstName: 'Jean',
    lastName: 'Dupont'
  })
});

const data = await response.json();
```

**Important** : ⚠️ **NE PAS envoyer de mot de passe** ! Il sera généré automatiquement.

**Réponse** :
```json
{
  "message": "Employé ajouté avec succès. Un email avec les identifiants a été envoyé.",
  "employee": {
    "id": 42,
    "email": "employe@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "EMPLOYEE",
    "createdAt": "2026-01-20T..."
  }
}
```

**Email envoyé automatiquement** :
L'employé reçoit un email avec :
- Son email de connexion
- Son mot de passe temporaire (16 caractères forts)
- Un lien vers la page de connexion
- Un rappel de changer son mot de passe

---

### 2️⃣ Lister les Employés

**Endpoint** : `GET /api/employees`

```javascript
const response = await fetch('https://saas-immo.onrender.com/api/employees', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { employees } = await response.json();
```

**Réponse** :
```json
{
  "employees": [
    {
      "id": 42,
      "email": "employe@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "EMPLOYEE",
      "createdAt": "2026-01-20T..."
    }
  ]
}
```

---

### 3️⃣ Supprimer un Employé

**Endpoint** : `DELETE /api/employees/:employeeId`

```javascript
const response = await fetch(`https://saas-immo.onrender.com/api/employees/${employeeId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// { "message": "Employé supprimé avec succès" }
```

---

### 4️⃣ Réinitialiser le Mot de Passe d'un Employé

**Endpoint** : `POST /api/employees/:employeeId/reset-password`

```javascript
const response = await fetch(`https://saas-immo.onrender.com/api/employees/${employeeId}/reset-password`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// { "message": "Mot de passe réinitialisé avec succès. Un email a été envoyé à l'employé." }
```

L'employé reçoit un email avec son nouveau mot de passe temporaire.

---

## 🔧 Modification du Frontend

### Avant (❌ Ancien code)

```javascript
// ❌ NE PLUS UTILISER
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email,
    password,      // ❌ Problème : exige un mot de passe fort
    firstName,
    lastName
  })
});
```

### Après (✅ Nouveau code)

```javascript
// ✅ UTILISER CECI
const response = await fetch('/api/employees', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // ✅ Authentification requise
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email,
    firstName,
    lastName
    // ✅ Pas de mot de passe : généré automatiquement
  })
});
```

---

## 📋 Formulaire Frontend Simplifié

Votre formulaire "Ajouter un Collaborateur" doit maintenant avoir **seulement 3 champs** :

```tsx
<form onSubmit={handleAddEmployee}>
  <input
    type="text"
    name="firstName"
    placeholder="Prénom *"
    required
  />

  <input
    type="text"
    name="lastName"
    placeholder="Nom *"
    required
  />

  <input
    type="email"
    name="email"
    placeholder="Email Pro *"
    required
  />

  {/* ❌ SUPPRIMER le champ "Mot de passe initial" */}

  <button type="submit">
    Créer le compte
  </button>
</form>
```

**Supprimez** le champ "Mot de passe initial" de votre formulaire car il n'est plus nécessaire.

---

## 🔐 Sécurité

### Génération du Mot de Passe

Le mot de passe est automatiquement généré avec :
- **16 caractères** (au lieu de 12)
- Au moins 1 **majuscule**
- Au moins 1 **minuscule**
- Au moins 1 **chiffre**
- Au moins 1 **caractère spécial** (@$!%*?&)
- Caractères **mélangés aléatoirement**

Exemple de mot de passe généré : `aB3$xYz9@Qw2Rt!7`

### Permissions

Seuls les utilisateurs avec le rôle **OWNER** peuvent :
- Ajouter des employés
- Supprimer des employés
- Réinitialiser les mots de passe

Les employés (EMPLOYEE) ne peuvent pas gérer d'autres employés.

---

## 📧 Email Automatique

### Email de Bienvenue

Quand vous ajoutez un employé, il reçoit automatiquement cet email :

**Sujet** : Bienvenue dans l'équipe ImmoPro !

**Contenu** :
```
Bonjour Jean !

Vous avez été ajouté(e) à l'équipe ImmoPro par Pierre Dupont.

Vos identifiants de connexion :
- Email : employe@example.com
- Mot de passe : aB3$xYz9@Qw2Rt!7

⚠️ Important : Pour des raisons de sécurité, veuillez changer
ce mot de passe dès votre première connexion.

[Se connecter]
```

### Email de Réinitialisation

Quand vous réinitialisez le mot de passe d'un employé :

**Sujet** : Réinitialisation de votre mot de passe ImmoPro

**Contenu** :
```
Bonjour Jean,

Votre mot de passe a été réinitialisé par votre administrateur.

Votre nouveau mot de passe :
cD5&Mn8@Lp1Wx!4Y

⚠️ Important : Veuillez changer ce mot de passe dès votre prochaine connexion.

[Se connecter]
```

---

## 🧪 Tester la Nouvelle Route

### Test 1 : Ajouter un Employé

```bash
curl -X POST https://saas-immo.onrender.com/api/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.employe@gmail.com",
    "firstName": "Test",
    "lastName": "Employé"
  }'
```

**Résultat attendu** :
- L'employé est créé dans la base de données
- Un email est envoyé à `test.employe@gmail.com`
- Vous recevez la confirmation

### Test 2 : Lister les Employés

```bash
curl https://saas-immo.onrender.com/api/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 3 : Réinitialiser un Mot de Passe

```bash
curl -X POST https://saas-immo.onrender.com/api/employees/42/reset-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ❓ FAQ

**Q : Le mot de passe généré est-il assez sécurisé ?**
R : Oui ! 16 caractères avec majuscules, minuscules, chiffres et caractères spéciaux. C'est même plus sécurisé que le minimum requis (12 caractères).

**Q : L'employé peut-il changer son mot de passe ?**
R : Oui, il doit le faire dès sa première connexion via la page "Profil" ou "Paramètres".

**Q : Que se passe-t-il si l'email n'est pas envoyé ?**
R : L'employé est quand même créé. Vous pouvez utiliser la fonction "Réinitialiser le mot de passe" pour renvoyer un email.

**Q : Puis-je ajouter un employé si mon plan a une limite ?**
R : Oui, mais si vous avez le middleware `checkEmployeeLimit` activé sur cette route, vous serez bloqué si vous atteignez la limite de votre plan.

**Q : Comment activer la limite d'employés ?**
R : Ajoutez le middleware dans `server.js` :
```javascript
const { checkEmployeeLimit } = require('./middleware/checkPlanLimits');

app.use('/api/employees', authenticateToken, checkEmployeeLimit, employeesRouter);
```

---

## 📞 Support

Si vous rencontrez toujours des problèmes :

1. Vérifiez que `RESEND_API_KEY` est configuré dans vos variables d'environnement
2. Vérifiez que `RESEND_FROM_EMAIL` est une adresse email vérifiée sur Resend
3. Consultez les logs du serveur pour voir les erreurs éventuelles

---

**Dernière mise à jour** : 2026-01-20
**Status** : ✅ Production Ready
