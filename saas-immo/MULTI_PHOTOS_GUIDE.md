# 📸 Guide - Système de Photos Multiples

## Vue d'ensemble

Votre CRM immobilier supporte maintenant **plusieurs photos par bien immobilier** avec un système professionnel de gestion d'images.

## 🎯 Fonctionnalités

### Ancienne version (1 photo)
- ❌ Une seule photo par bien
- ❌ Difficile de montrer toutes les pièces
- ❌ Pas de légendes

### Nouvelle version (Photos multiples)
- ✅ **Nombre illimité de photos** par bien
- ✅ **Photo principale** définie
- ✅ **Ordre personnalisable** (glisser-déposer)
- ✅ **Légendes** pour chaque photo (ex: "Salon", "Cuisine", "Chambre 1")
- ✅ **Types de photos** : Originale, Améliorée IA, Home Staging virtuel
- ✅ Suppression individuelle

---

## 📊 Structure de la base de données

### Nouveau modèle `PropertyImage`

```prisma
model PropertyImage {
  id          Int      @id @default(autoincrement())
  url         String   // URL de l'image (Supabase, S3, ou base64)
  isPrimary   Boolean  @default(false) // Photo principale
  order       Int      @default(0) // Ordre d'affichage
  caption     String?  // Légende ("Salon", "Cuisine", etc.)
  type        String   @default("ORIGINAL") // "ORIGINAL", "ENHANCED", "STAGED"
  createdAt   DateTime @default(now())

  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  propertyId  Int
}
```

**Champs importants :**
- `isPrimary` : Une seule photo peut être principale (affichée en premier)
- `order` : Position dans la galerie (0 = première, 1 = deuxième, etc.)
- `caption` : Texte descriptif de la photo
- `type` : Permet de distinguer les photos originales des versions améliorées par IA

---

## 🔌 API Backend

### Routes disponibles

#### 1. Ajouter une photo à un bien
```http
POST /api/properties/:id/images
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://supabase.co/storage/v1/object/public/...",
  "caption": "Cuisine moderne",
  "isPrimary": false
}
```

**Réponse :**
```json
{
  "id": 42,
  "url": "https://...",
  "caption": "Cuisine moderne",
  "isPrimary": false,
  "order": 2,
  "type": "ORIGINAL",
  "propertyId": 15,
  "createdAt": "2025-01-12T..."
}
```

#### 2. Récupérer toutes les photos d'un bien
```http
GET /api/properties/:id/images
Authorization: Bearer {token}
```

**Réponse :**
```json
[
  {
    "id": 1,
    "url": "https://...",
    "caption": "Façade principale",
    "isPrimary": true,
    "order": 0,
    "type": "ORIGINAL"
  },
  {
    "id": 2,
    "url": "https://...",
    "caption": "Cuisine",
    "isPrimary": false,
    "order": 1,
    "type": "ENHANCED"
  }
]
```

#### 3. Supprimer une photo
```http
DELETE /api/properties/:propertyId/images/:imageId
Authorization: Bearer {token}
```

**Réponse :** 204 No Content

#### 4. Définir une photo comme principale
```http
PATCH /api/properties/:propertyId/images/:imageId/set-primary
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "id": 2,
  "isPrimary": true,
  "url": "https://...",
  ...
}
```

#### 5. Réorganiser l'ordre des photos
```http
PUT /api/properties/:id/images/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "imageIds": [3, 1, 2, 5, 4]
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Ordre mis à jour"
}
```

---

## 🎨 Exemple d'interface utilisateur (Frontend)

### Composant React - Galerie de photos

```jsx
import React, { useState, useEffect } from 'react';
import { Box, Image, Grid, IconButton, Input, Badge } from '@chakra-ui/react';
import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import axios from 'axios';

export default function PropertyImageGallery({ propertyId, token }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Charger les images
  useEffect(() => {
    loadImages();
  }, [propertyId]);

  const loadImages = async () => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get(`/api/properties/${propertyId}/images`, config);
    setImages(res.data);
  };

  // Ajouter une photo
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      // 1. Upload sur Supabase
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (error) throw error;

      const publicUrl = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName).data.publicUrl;

      // 2. Enregistrer dans la BDD
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/properties/${propertyId}/images`, {
        url: publicUrl,
        caption: null,
        isPrimary: images.length === 0 // Première photo = principale
      }, config);

      loadImages();
    } catch (error) {
      console.error('Erreur upload:', error);
    } finally {
      setUploading(false);
    }
  };

  // Supprimer une photo
  const handleDelete = async (imageId) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.delete(`/api/properties/${propertyId}/images/${imageId}`, config);
    loadImages();
  };

  // Définir comme principale
  const handleSetPrimary = async (imageId) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.patch(`/api/properties/${propertyId}/images/${imageId}/set-primary`, {}, config);
    loadImages();
  };

  return (
    <Box>
      {/* Bouton d'upload */}
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => handleUpload(e.target.files[0])}
        mb={4}
        isDisabled={uploading}
      />

      {/* Grille de photos */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        {images.map((img) => (
          <Box key={img.id} position="relative" borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Image src={img.url} alt={img.caption} w="100%" h="200px" objectFit="cover" />

            {/* Badge "Principale" */}
            {img.isPrimary && (
              <Badge position="absolute" top={2} left={2} colorScheme="green">
                ⭐ Principale
              </Badge>
            )}

            {/* Badge type */}
            {img.type !== 'ORIGINAL' && (
              <Badge position="absolute" top={2} right={2} colorScheme="purple">
                {img.type === 'ENHANCED' ? '✨ Améliorée' : '🛋️ Staging'}
              </Badge>
            )}

            {/* Actions */}
            <Box position="absolute" bottom={2} right={2} display="flex" gap={2}>
              <IconButton
                icon={<StarIcon />}
                size="sm"
                colorScheme="yellow"
                onClick={() => handleSetPrimary(img.id)}
                title="Définir comme principale"
              />
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => handleDelete(img.id)}
                title="Supprimer"
              />
            </Box>

            {/* Légende */}
            {img.caption && (
              <Box bg="blackAlpha.700" color="white" p={2} fontSize="sm">
                {img.caption}
              </Box>
            )}
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
```

---

## 📝 Migration depuis l'ancien système

Si vous avez déjà des biens avec une seule photo dans le champ `imageUrl`, vous pouvez migrer ces photos vers le nouveau système avec ce script :

```javascript
// Script de migration à exécuter UNE FOIS
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOldImages() {
  console.log('🔄 Migration des anciennes photos...');

  // Récupérer tous les biens avec une photo
  const properties = await prisma.property.findMany({
    where: {
      imageUrl: { not: null }
    }
  });

  console.log(`📊 ${properties.length} bien(s) avec photo à migrer`);

  for (const property of properties) {
    // Créer une entrée PropertyImage pour chaque bien
    await prisma.propertyImage.create({
      data: {
        url: property.imageUrl,
        isPrimary: true,
        order: 0,
        caption: 'Photo principale',
        type: 'ORIGINAL',
        propertyId: property.id
      }
    });

    console.log(`✅ Migré: ${property.address}`);
  }

  console.log('🎉 Migration terminée !');
}

migrateOldImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🚀 Prochaines étapes

### 1. Appliquer la migration Prisma
```bash
cd saas-immo
npx prisma migrate dev --name add_property_images
npx prisma generate
```

### 2. Redémarrer le serveur backend
Le serveur doit être redémarré pour prendre en compte les nouvelles routes.

### 3. Créer l'interface frontend
Créez un composant `PropertyImageGallery.jsx` (exemple ci-dessus) et intégrez-le dans votre formulaire de création/édition de bien.

### 4. Tester l'upload de plusieurs photos
- Créer un nouveau bien
- Uploader 3-4 photos
- Définir une photo comme principale
- Réorganiser l'ordre
- Supprimer une photo

---

## 💡 Cas d'usage réels

### Exemple 1 : Appartement 3 pièces
```
Photo 1 (Principale) : "Façade de l'immeuble" - ORIGINAL
Photo 2 : "Salon lumineux" - ENHANCED (améliorée IA)
Photo 3 : "Cuisine équipée" - ORIGINAL
Photo 4 : "Chambre 1" - STAGED (meublée virtuellement)
Photo 5 : "Chambre 2" - ORIGINAL
Photo 6 : "Salle de bain" - ENHANCED
Photo 7 : "Vue balcon" - ORIGINAL
```

### Exemple 2 : Maison avec jardin
```
Photo 1 (Principale) : "Vue extérieure" - ORIGINAL
Photo 2 : "Entrée" - ORIGINAL
Photo 3 : "Salon/salle à manger" - STAGED
Photo 4 : "Cuisine ouverte" - ENHANCED
Photo 5 : "Chambre parentale" - ORIGINAL
Photo 6 : "Jardin arrière" - ORIGINAL
```

---

## 🎯 Avantages pour votre CRM

### Pour les agents
- ✅ **Présentations plus complètes** : Montrer toutes les pièces
- ✅ **Flexibilité** : Ajouter/supprimer des photos facilement
- ✅ **Organisation** : Réorganiser l'ordre pour mettre en avant les meilleurs atouts
- ✅ **Professionnalisme** : Légendes et photos améliorées par IA

### Pour les acheteurs
- ✅ **Meilleure compréhension** : Voir l'intégralité du bien
- ✅ **Gain de temps** : Éviter les visites inutiles
- ✅ **Confiance** : Plus de transparence

### Pour le business
- ✅ **Taux de conversion** : Plus de demandes de visite
- ✅ **Différenciation** : Fonctionnalité premium par rapport à la concurrence
- ✅ **Valeur ajoutée** : Justifie un abonnement plus cher

---

## 📚 Ressources

- **Stockage des images** : Utilisez Supabase Storage (gratuit jusqu'à 1 GB)
- **Optimisation** : Compressez les images avant upload avec `sharp` ou `imagemin`
- **CDN** : Les URLs Supabase sont automatiquement servies via CDN

---

Créé le 2025-01-12 pour ImmoPro CRM
