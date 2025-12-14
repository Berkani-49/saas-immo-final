// Fichier : src/AddPropertyForm.jsx (Version Finale avec Photos Multiples + Propriétaires + Matching)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, FormControl, FormLabel, Input, Textarea, HStack, VStack, Heading, useToast, Text, Select, Badge, Wrap, IconButton, useDisclosure, Divider } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import MatchingModal from './components/MatchingModal';
import PropertyImageGallery from './components/PropertyImageGallery';

export default function AddPropertyForm({ token, onPropertyAdded }) {
  // État pour le modal de matching
  const { isOpen: isMatchingOpen, onOpen: onMatchingOpen, onClose: onMatchingClose } = useDisclosure();
  const [currentProperty, setCurrentProperty] = useState(null);
  const [createdPropertyId, setCreatedPropertyId] = useState(null); // Pour afficher la galerie après création
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nouveaux états pour les propriétaires
  const [contacts, setContacts] = useState([]);
  const [selectedOwners, setSelectedOwners] = useState([]); // Maintenant contient {contact, type}
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedType, setSelectedType] = useState('OWNER');

  const toast = useToast();

  // Charger la liste des contacts au montage
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get('https://saas-immo.onrender.com/api/contacts', config);
        setContacts(response.data);
      } catch (err) {
        console.error("Erreur chargement contacts:", err);
      }
    };
    if (token) fetchContacts();
  }, [token]);

  // Ajouter un propriétaire à la sélection
  const handleAddOwner = () => {
    if (!selectedContactId) return;
    const contact = contacts.find(c => c.id === parseInt(selectedContactId));
    if (contact && !selectedOwners.find(o => o.contact.id === contact.id && o.type === selectedType)) {
      setSelectedOwners([...selectedOwners, { contact, type: selectedType }]);
      setSelectedContactId('');
      setSelectedType('OWNER');
    }
  };

  // Retirer un propriétaire de la sélection
  const handleRemoveOwner = (index) => {
    setSelectedOwners(selectedOwners.filter((_, i) => i !== index));
  };

  // Générer la description avec l'IA
  const handleGenerateDescription = async () => {
    // Fonctionnalité temporairement désactivée (quota OpenAI dépassé)
    toast({
      title: "Fonctionnalité IA temporairement désactivée",
      description: "La génération automatique de descriptions nécessite un abonnement OpenAI actif. Vous pouvez rédiger la description manuellement.",
      status: "info",
      duration: 5000
    });
    return;

    /* CODE DÉSACTIVÉ - Réactiver quand OpenAI sera rechargé
    if (!address && !city && !price && !area) {
      toast({ title: "Informations manquantes", description: "Remplissez au moins quelques champs (adresse, ville, prix, surface) pour générer une description.", status: "warning" });
      return;
    }

    setIsGenerating(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.post('https://saas-immo.onrender.com/api/generate-description', {
        address, city, price, area, rooms, bedrooms
      }, config);

      setDescription(response.data.description);
      toast({ title: "Description générée ✨", description: "La description a été générée par l'IA !", status: "success", duration: 3000 });
    } catch (error) {
      console.error("Erreur génération:", error);
      toast({ title: "Erreur", description: "Impossible de générer la description. Vérifiez votre clé API OpenAI.", status: "error" });
    } finally {
      setIsGenerating(false);
    }
    */
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address || !price || !area) {
      toast({ title: "Erreur", description: "Adresse, Prix et Surface requis.", status: "warning" });
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = null;

    try {
      // 1. Upload de l'image via le backend (si elle existe)
      if (imageFile) {
        setUploading(true);

        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadConfig = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        };

        const uploadResponse = await axios.post(
          'https://saas-immo.onrender.com/api/upload-image',
          formData,
          uploadConfig
        );

        finalImageUrl = uploadResponse.data.url;
        setUploading(false);
      }

      // 2. Envoi des données au serveur (avec l'URL)
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = {
        address, city, postalCode, 
        price: parseInt(price), area: parseInt(area), 
        rooms: parseInt(rooms) || 0, bedrooms: parseInt(bedrooms) || 0, 
        description,
        imageUrl: finalImageUrl
      };

      const response = await axios.post('https://saas-immo.onrender.com/api/properties', payload, config);
      const newProperty = response.data;

      // 3. Ajouter les propriétaires/intéressés si sélectionnés
      if (selectedOwners.length > 0) {
        for (const item of selectedOwners) {
          try {
            await axios.post(
              `https://saas-immo.onrender.com/api/properties/${newProperty.id}/owners`,
              { contactId: item.contact.id, type: item.type },
              config
            );
          } catch (err) {
            console.error("Erreur ajout relation:", err);
          }
        }
      }

      onPropertyAdded(newProperty);

      // Stocker l'ID du bien créé pour afficher la galerie de photos
      setCreatedPropertyId(newProperty.id);

      // Reset des champs (sauf createdPropertyId)
      setAddress(''); setCity(''); setPostalCode(''); setPrice('');
      setArea(''); setRooms(''); setBedrooms(''); setDescription('');
      setImageFile(null);
      setSelectedOwners([]);
      setSelectedContactId('');
      toast({
        title: "Bien ajouté avec succès !",
        description: "Vous pouvez maintenant ajouter des photos",
        status: "success",
        duration: 4000
      });

      // 🎯 MATCHING AUTOMATIQUE - Ouvrir le modal avec les acheteurs correspondants
      setCurrentProperty(newProperty);
      onMatchingOpen();

    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Problème lors de l'ajout.", status: "error" });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white" mb={6}>
      <Heading size="md" mb={4}>
        {createdPropertyId ? 'Ajouter des photos au bien' : 'Ajouter un nouveau bien'}
      </Heading>

      {/* Afficher le formulaire OU la galerie de photos */}
      {!createdPropertyId ? (
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Adresse</FormLabel>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormControl>
            <HStack width="full">
              <FormControl><FormLabel>Ville</FormLabel><Input value={city} onChange={(e) => setCity(e.target.value)} /></FormControl>
              <FormControl><FormLabel>Code Postal</FormLabel><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></FormControl>
            </HStack>
            <HStack width="full">
              <FormControl isRequired><FormLabel>Prix (€)</FormLabel><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></FormControl>
              <FormControl isRequired><FormLabel>Surface (m²)</FormLabel><Input type="number" value={area} onChange={(e) => setArea(e.target.value)} /></FormControl>
            </HStack>
            <HStack width="full">
              <FormControl><FormLabel>Pièces</FormLabel><Input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} /></FormControl>
              <FormControl><FormLabel>Chambres</FormLabel><Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Photo du bien (optionnel - vous pourrez en ajouter plusieurs après)</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} p={1} />
              {imageFile && <Text fontSize="sm" color="green.500" mt={1}>{imageFile.name}</Text>}
              <Text fontSize="xs" color="gray.500" mt={1}>
                💡 Vous pourrez ajouter plusieurs photos après la création du bien
              </Text>
            </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le bien..."
              rows={5}
            />
            <Button
              mt={2}
              size="sm"
              colorScheme="gray"
              variant="outline"
              onClick={handleGenerateDescription}
              leftIcon={<Text>🔒</Text>}
            >
              Générer avec l'IA (désactivé)
            </Button>
          </FormControl>

          {/* SÉLECTION DES PROPRIÉTAIRES/INTÉRESSÉS */}
          <FormControl>
            <FormLabel>Contacts liés (optionnel)</FormLabel>
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Select
                  placeholder="Choisir un contact"
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  size="sm"
                  flex={2}
                >
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </Select>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  size="sm"
                  flex={1}
                >
                  <option value="OWNER">Propriétaire</option>
                  <option value="INTERESTED">Intéressé</option>
                </Select>
              </HStack>
              <Button size="sm" colorScheme="blue" onClick={handleAddOwner} isDisabled={!selectedContactId} width="full">
                Ajouter
              </Button>
            </VStack>

            {/* Liste des propriétaires/intéressés sélectionnés */}
            {selectedOwners.length > 0 && (
              <Wrap spacing={2} mt={3}>
                {selectedOwners.map((item, index) => (
                  <Badge
                    key={index}
                    colorScheme={item.type === 'OWNER' ? 'blue' : 'green'}
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {item.contact.firstName} {item.contact.lastName} ({item.type === 'OWNER' ? 'Proprio' : 'Intéressé'})
                    <IconButton
                      icon={<CloseIcon />}
                      size="xs"
                      variant="ghost"
                      ml={1}
                      onClick={() => handleRemoveOwner(index)}
                      aria-label="Retirer"
                    />
                  </Badge>
                ))}
              </Wrap>
            )}
          </FormControl>
            <Button type="submit" colorScheme="blue" width="full"
              isLoading={isSubmitting || uploading}
              loadingText={uploading ? "Envoi photo..." : "Enregistrement..."}>
              Ajouter le bien
            </Button>
          </VStack>
        </form>
      ) : (
        /* Galerie de photos après création du bien */
        <VStack spacing={6} align="stretch">
          <PropertyImageGallery
            propertyId={createdPropertyId}
            token={token}
            onImagesChange={(images) => {
              console.log(`${images.length} photo(s) pour ce bien`);
            }}
          />

          <Divider />

          <Button
            colorScheme="green"
            variant="outline"
            onClick={() => {
              setCreatedPropertyId(null);
              toast({
                title: "Prêt pour un nouveau bien",
                description: "Vous pouvez créer un autre bien",
                status: "info",
                duration: 2000
              });
            }}
          >
            ➕ Ajouter un autre bien
          </Button>
        </VStack>
      )}

      {/* 🎯 MODAL DE MATCHING AUTOMATIQUE */}
      <MatchingModal
        isOpen={isMatchingOpen}
        onClose={onMatchingClose}
        property={currentProperty}
        token={token}
      />
    </Box>
  );
}