# 🔍 Debug : Variables d'environnement Render

## Checklist de vérification

Vérifiez **EXACTEMENT** ces points sur Render :

### 1. Les noms des variables sont EXACTEMENT corrects ?

Les noms doivent être :
- `SUPABASE_URL` (PAS `SUPABASE_URI`, PAS `supabase_url`)
- `SUPABASE_SERVICE_ROLE_KEY` (PAS `SUPABASE_KEY`, PAS `SUPABASE_SERVICE_KEY`)

### 2. Les valeurs n'ont pas d'espaces avant/après ?

❌ MAUVAIS (espace au début) :
```
 https://wcybvmyamnpkwpuabvqq.supabase.co
```

✅ BON (pas d'espace) :
```
https://wcybvmyamnpkwpuabvqq.supabase.co
```

### 3. Les valeurs ne sont pas entre guillemets ?

❌ MAUVAIS (guillemets ajoutés par erreur) :
```
"https://wcybvmyamnpkwpuabvqq.supabase.co"
```

✅ BON (pas de guillemets) :
```
https://wcybvmyamnpkwpuabvqq.supabase.co
```

### 4. Les variables sont pour le BON service ?

Sur Render, si vous avez plusieurs services (frontend + backend), vérifiez que vous ajoutez les variables au **service BACKEND** (celui qui a Node.js et server.js).

### 5. Vous avez cliqué sur "Save Changes" ?

Après avoir ajouté les variables, il faut impérativement cliquer sur le bouton **"Save Changes"** en bas de la page.

---

## 🧪 Test : Vérifier que les variables sont bien chargées

Ajoutez temporairement cette ligne dans server.js pour voir si les variables sont chargées :

```javascript
// TEMPORAIRE - À SUPPRIMER APRÈS TEST
console.log('🔍 DEBUG ENV:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrlValue: process.env.SUPABASE_URL,
  keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
});
```

Cela affichera dans les logs Render si les variables sont bien présentes.

---

## 🎯 Solution alternative : Variables via fichier .env sur Render

Si les variables d'environnement normales ne marchent pas, Render permet aussi d'ajouter un fichier `.env` :

1. Sur Render → Votre service → **"Environment"**
2. Au lieu de "Environment Variables", cherchez **"Secret Files"**
3. Cliquez sur **"Add Secret File"**
4. Filename : `.env`
5. Contents :
```
SUPABASE_URL=https://wcybvmyamnpkwpuabvqq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWJ2bXlhbW5wa3dwdWFidnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkxNjg5MiwiZXhwIjoyMDc4NDkyODkyfQ.7XLEg-g-n0dSgaBK9_9kjkUHlnXTkbE3dVdmWL2Bpd8
```
6. Save

---

## 📸 Screenshot requis

Pouvez-vous me montrer une capture d'écran de votre page **Environment** sur Render ?

Cela m'aidera à identifier le problème exact.

---

**Date** : 2025-12-14
