# 📸 Guide d'Intégration - Photos Multiples

## Composant créé: PropertyImageGallery

Le composant `PropertyImageGallery.jsx` permet de gérer plusieurs photos pour un bien immobilier avec toutes les fonctionnalités modernes.

---

## ✨ Fonctionnalités du composant

- ✅ **Upload de photos** avec validation (type, taille max 5MB)
- ✅ **Affichage en grille** responsive (1 col mobile, 2 cols tablette, 3 cols desktop)
- ✅ **Photo principale** avec badge ⭐
- ✅ **Suppression** de photos avec confirmation
- ✅ **Zoom** sur clic pour voir en grand (modal)
- ✅ **Badges** pour les types (Original, Améliorée IA, Staging)
- ✅ **Stockage** automatique sur Supabase
- ✅ **Animation** au survol
- ✅ **Feedback** utilisateur (toasts)

---

## 🔧 Comment l'utiliser

### Option 1 : Dans le formulaire de création de bien

Ajoutez le composant dans votre page de création de bien (par exemple `AddProperty.jsx`):

```jsx
import React, { useState } from 'react';
import PropertyImageGallery from './components/PropertyImageGallery';
import { Box, VStack, Input, Button, FormControl, FormLabel } from '@chakra-ui/react';

export default function AddProperty({ token }) {
  const [propertyId, setPropertyId] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    price: '',
    // ... autres champs
  });

  // Fonction pour créer le bien
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        'https://saas-immo.onrender.com/api/properties',
        formData,
        config
      );

      // Stocker l'ID du bien créé
      setPropertyId(response.data.id);

      toast({
        title: 'Bien créé !',
        description: 'Vous pouvez maintenant ajouter des photos',
        status: 'success',
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Formulaire de création */}
        <form onSubmit={handleSubmit}>
          <FormControl>
            <FormLabel>Adresse</FormLabel>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </FormControl>

          {/* ... autres champs ... */}

          <Button type="submit" colorScheme="blue" mt={4}>
            Créer le bien
          </Button>
        </form>

        {/* Galerie de photos (apparaît après création) */}
        {propertyId && (
          <PropertyImageGallery
            propertyId={propertyId}
            token={token}
          />
        )}
      </VStack>
    </Box>
  );
}
```

### Option 2 : Dans le formulaire d'édition de bien

Ajoutez le composant dans votre page d'édition (par exemple dans `PropertyItem.jsx` en mode édition):

```jsx
import PropertyImageGallery from './components/PropertyImageGallery';

export default function PropertyItem({ property, token }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <Box>
        {/* Formulaire d'édition */}
        <VStack spacing={6}>
          {/* Champs du bien */}
          <Input value={property.address} ... />

          {/* Galerie de photos */}
          <PropertyImageGallery
            propertyId={property.id}
            token={token}
          />

          <Button onClick={() => setIsEditing(false)}>Enregistrer</Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Vue normale du bien */}
    </Box>
  );
}
```

### Option 3 : Page dédiée à la gestion des photos

Créez une page séparée pour gérer les photos d'un bien:

```jsx
// pages/PropertyPhotos.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import PropertyImageGallery from '../components/PropertyImageGallery';
import { Box, Heading } from '@chakra-ui/react';

export default function PropertyPhotos({ token }) {
  const { propertyId } = useParams(); // Depuis l'URL

  return (
    <Box p={8}>
      <Heading mb={6}>Gérer les photos du bien</Heading>

      <PropertyImageGallery
        propertyId={parseInt(propertyId)}
        token={token}
      />
    </Box>
  );
}
```

---

## 📦 Props du composant

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `propertyId` | Number | ✅ Oui | ID du bien immobilier |
| `token` | String | ✅ Oui | Token JWT d'authentification |
| `onImagesChange` | Function | ❌ Non | Callback appelée quand les images changent |

### Exemple avec callback

```jsx
<PropertyImageGallery
  propertyId={property.id}
  token={token}
  onImagesChange={(images) => {
    console.log('Nombre de photos:', images.length);
    // Mettre à jour le state parent, etc.
  }}
/>
```

---

## 🎨 Personnalisation

### Changer le nombre de colonnes

Modifiez la ligne 336 dans `PropertyImageGallery.jsx`:

```jsx
// Actuel (1 col mobile, 2 tablette, 3 desktop)
<Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>

// 2 colonnes partout
<Grid templateColumns="repeat(2, 1fr)" gap={4}>

// 4 colonnes sur desktop
<Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
```

### Changer la taille maximale des images

Modifiez la ligne 76:

```jsx
// Actuel (5 MB max)
if (file.size > 5 * 1024 * 1024) {

// 10 MB max
if (file.size > 10 * 1024 * 1024) {
```

### Changer les couleurs

Modifiez les couleurs des badges et boutons selon votre charte graphique:

```jsx
// Badge principale
<Badge colorScheme="green">  // Changer en "blue", "purple", etc.

// Boutons
<IconButton colorScheme="yellow">  // Pour le bouton étoile
<IconButton colorScheme="red">     // Pour le bouton supprimer
```

---

## 🔄 Workflow complet

### Scénario: Agent crée un nouveau bien

1. **Agent remplit le formulaire** (adresse, prix, surface, etc.)
2. **Clique sur "Créer le bien"** → Le bien est créé dans la BDD
3. **Le composant `PropertyImageGallery` apparaît**
4. **Agent clique sur le bouton "Parcourir"** et sélectionne une photo
5. **Upload automatique** vers Supabase Storage
6. **Enregistrement en BDD** via l'API
7. **Photo s'affiche** dans la grille avec badge "⭐ Principale"
8. **Agent ajoute 2 autres photos** (cuisine, chambre)
9. **Agent peut**:
   - Cliquer sur une photo pour la voir en grand
   - Cliquer sur ⭐ pour changer la photo principale
   - Cliquer sur 🗑️ pour supprimer une photo

---

## 🧪 Test du composant

### 1. Créer un bien de test

```bash
# Dans votre interface, créez un bien:
- Adresse: 10 rue de Test
- Ville: Paris
- Prix: 300000
- Surface: 80
- Chambres: 2
```

### 2. Tester l'upload

- Sélectionnez 3-4 images depuis votre ordinateur
- Vérifiez qu'elles apparaissent dans la grille
- Vérifiez que la première est marquée "⭐ Principale"

### 3. Tester les actions

- Cliquez sur une photo → Elle s'ouvre en grand (modal)
- Cliquez sur ⭐ sur la 2ème photo → Elle devient principale
- Cliquez sur 🗑️ → Photo supprimée après confirmation

### 4. Vérifier Supabase

Allez dans Supabase → Storage → Bucket "property-images"
Vous devriez voir vos images uploadées

---

## 🐛 Dépannage

### Erreur "Bucket not found"

**Problème**: Le bucket Supabase "property-images" n'existe pas

**Solution**: Créez-le dans Supabase:
1. Allez sur supabase.com → votre projet
2. Storage → Create new bucket
3. Nom: `property-images`
4. Public: ✅ Oui
5. Policies: Allow public read, authenticated insert/delete

### Les images ne s'affichent pas

**Problème**: L'URL Supabase n'est pas publique

**Solution**: Vérifiez que le bucket est bien public:
```sql
-- Dans SQL Editor Supabase:
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');
```

### Upload lent

**Problème**: Images trop volumineuses

**Solution**: Compressez les images avant upload (ajoutez cette fonction):

```jsx
// À ajouter dans PropertyImageGallery.jsx
const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Erreur compression:', error);
    return file;
  }
};

// Puis dans handleUpload:
const compressedFile = await compressImage(file);
// Utiliser compressedFile au lieu de file
```

---

## 📊 Exemple de données

### Réponse API GET /api/properties/:id/images

```json
[
  {
    "id": 1,
    "url": "https://abc.supabase.co/storage/v1/object/public/property-images/property_15_1234567890_photo1.jpg",
    "isPrimary": true,
    "order": 0,
    "caption": null,
    "type": "ORIGINAL",
    "propertyId": 15,
    "createdAt": "2025-01-12T10:30:00Z"
  },
  {
    "id": 2,
    "url": "https://abc.supabase.co/storage/v1/object/public/property-images/property_15_1234567891_photo2.jpg",
    "isPrimary": false,
    "order": 1,
    "caption": "Cuisine",
    "type": "ORIGINAL",
    "propertyId": 15,
    "createdAt": "2025-01-12T10:31:00Z"
  }
]
```

---

## 🚀 Prochaines améliorations possibles

1. **Drag & Drop**: Réorganiser les photos par glisser-déposer
2. **Légendes éditables**: Permettre de modifier le texte de chaque photo
3. **Recadrage**: Intégrer un éditeur d'image avant upload
4. **Galerie lightbox**: Navigation entre photos en plein écran
5. **Upload multiple**: Sélectionner plusieurs fichiers à la fois
6. **Progress bar**: Afficher la progression de l'upload

---

Créé le 2025-01-12 pour ImmoPro CRM
