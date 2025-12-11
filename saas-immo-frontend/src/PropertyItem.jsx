// Fichier : src/PropertyItem.jsx (Version Finale avec Partage + Documents PDF)

import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Text, Button, IconButton, Flex, Badge, Image, VStack, HStack, useToast,
  FormControl, FormLabel, Input, Textarea, Spacer, useDisclosure
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaShareAlt } from 'react-icons/fa';
import { FiFileText, FiZap, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import DocumentGenerator from './components/DocumentGenerator';
import StagingModal from './components/StagingModal';

export default function PropertyItem({ property, token, onPropertyDeleted, onPropertyUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...property });
  const [newImageFile, setNewImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [showStaged, setShowStaged] = useState(false);
  const toast = useToast();

  // Modal de génération de documents
  const { isOpen: isDocGenOpen, onOpen: onDocGenOpen, onClose: onDocGenClose } = useDisclosure();

  // Modal de home staging virtuel
  const { isOpen: isStagingOpen, onOpen: onStagingOpen, onClose: onStagingClose } = useDisclosure();

  // --- ENHANCE PHOTO (Nouvelle fonction IA) ---
  const handleEnhancePhoto = async () => {
    if (!property.imageUrl) {
      toast({ title: "Pas de photo", description: "Ce bien n'a pas de photo à améliorer.", status: "warning" });
      return;
    }

    setIsEnhancing(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.post(
        `https://saas-immo.onrender.com/api/properties/${property.id}/enhance-photo`,
        {},
        config
      );

      // Mettre à jour le bien avec la nouvelle photo améliorée
      onPropertyUpdated({ ...property, imageUrlEnhanced: response.data.enhancedUrl });
      setShowEnhanced(true);

      toast({
        title: "✨ Photo améliorée !",
        description: response.data.improvements.join(' • '),
        status: "success",
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error("Erreur amélioration photo:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'améliorer la photo.",
        status: "error"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // --- SHARE (Nouvelle fonction) ---
  const handleShare = () => {
    // On construit l'URL publique
    const url = `${window.location.origin}/share/${property.id}`;
    // On copie dans le presse-papier
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié !", description: "Envoyez-le au client.", status: "success", duration: 2000 });
  };

  // --- DELETE ---
  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce bien ?")) return;
    setIsLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`https://saas-immo.onrender.com/api/properties/${property.id}`, config);
      onPropertyDeleted(property.id);
      toast({ title: "Bien supprimé.", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Erreur suppression", status: "error" });
      setIsLoading(false);
    }
  };

  // --- SAVE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let finalImageUrl = editData.imageUrl;

    try {
      if (newImageFile) {
        setIsUploading(true);
        const fileExt = newImageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, newImageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const payload = { ...editData, imageUrl: finalImageUrl };
      const response = await axios.put(`https://saas-immo.onrender.com/api/properties/${property.id}`, payload, config);
      
      onPropertyUpdated(response.data);
      setIsEditing(false);
      setNewImageFile(null);
      toast({ title: "Bien mis à jour.", status: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur modification", status: "error" });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(current => ({ ...current, [name]: value }));
  };

  // --- MODE ÉDITION ---
  if (isEditing) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg" bg="white" shadow="md">
        <form onSubmit={handleSave}>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold" color="blue.600">Modifier le bien</Text>
            <FormControl><FormLabel fontSize="sm">Nouvelle photo</FormLabel><Input type="file" accept="image/*" p={1} onChange={(e) => setNewImageFile(e.target.files[0])} /></FormControl>
            <Input name="address" value={editData.address} onChange={handleChange} placeholder="Adresse" />
            <HStack>
                <Input name="city" value={editData.city} onChange={handleChange} placeholder="Ville" />
                <Input name="price" type="number" value={editData.price} onChange={handleChange} placeholder="Prix" />
            </HStack>
            <HStack>
                <Input name="area" type="number" value={editData.area} onChange={handleChange} placeholder="m²" />
                <Input name="rooms" type="number" value={editData.rooms} onChange={handleChange} placeholder="Pièces" />
            </HStack>
            <Flex mt={2} gap={2}>
              <Button type="submit" colorScheme="green" size="sm" isLoading={isLoading || isUploading}>Sauvegarder</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    );
  }

  // --- MODE VUE (CARTE) ---
  return (
    <Box 
      borderWidth="1px" borderRadius="2xl" overflow="hidden" bg="white" 
      transition="all 0.3s" _hover={{ transform: 'translateY(-5px)', shadow: 'xl' }}
      position="relative"
    >
      <Box h="200px" w="100%" position="relative" overflow="hidden">
        <Image
          src={
            (showStaged && property.imageUrlStaged) ? property.imageUrlStaged :
            (showEnhanced && property.imageUrlEnhanced) ? property.imageUrlEnhanced :
            (property.imageUrl || "https://via.placeholder.com/400x300?text=Pas+de+photo")
          }
          alt="Bien"
          w="100%" h="100%" objectFit="cover"
          transition="0.3s"
          _hover={{ transform: 'scale(1.05)' }}
        />
        <Badge
            position="absolute" top={3} right={3}
            colorScheme="green" fontSize="0.9em" px={2} py={1} borderRadius="md" shadow="md"
        >
            {property.price.toLocaleString()} €
        </Badge>

        {/* Badge Home Staging Virtuel */}
        {property.imageUrlStaged && (
          <Badge
            position="absolute" top={3} left={3}
            colorScheme="purple" fontSize="0.8em" px={2} py={1} borderRadius="md" shadow="md"
            cursor="pointer"
            onClick={() => setShowStaged(!showStaged)}
            title={showStaged ? "Voir photo originale" : `Voir version ${property.stagingStyle}`}
          >
            🛋️ {showStaged ? property.stagingStyle : "Original"}
          </Badge>
        )}

        {/* Badge Photo Améliorée */}
        {property.imageUrlEnhanced && !property.imageUrlStaged && (
          <Badge
            position="absolute" top={3} left={3}
            colorScheme="yellow" fontSize="0.8em" px={2} py={1} borderRadius="md" shadow="md"
            cursor="pointer"
            onClick={() => setShowEnhanced(!showEnhanced)}
            title={showEnhanced ? "Voir photo originale" : "Voir photo améliorée"}
          >
            ✨ {showEnhanced ? "Améliorée" : "Original"}
          </Badge>
        )}
      </Box>

      <Box p={5}>
        <Flex alignItems="center" color="gray.500" fontSize="sm" mb={2}>
            <FaMapMarkerAlt style={{ marginRight: '5px' }} />
            <Text textTransform="uppercase" fontWeight="bold" letterSpacing="wide">
                {property.city}
            </Text>
        </Flex>

        <Link to={`/property/${property.id}`}>
            <Text fontWeight="bold" fontSize="xl" lineHeight="tight" noOfLines={1} mb={2} _hover={{ color: 'blue.500' }}>
                {property.address}
            </Text>
        </Link>

        <HStack spacing={4} color="gray.600" fontSize="sm" mb={4}>
            <Flex align="center"><FaRulerCombined /><Text ml={1}>{property.area} m²</Text></Flex>
            <Flex align="center"><FaBed /><Text ml={1}>{property.bedrooms} ch.</Text></Flex>
            <Flex align="center"><FaBath /><Text ml={1}>{property.rooms} p.</Text></Flex>
        </HStack>

        {/* CONTACTS LIÉS */}
        {property.owners && property.owners.length > 0 && (
            <Box mb={3}>
                <Text fontSize="xs" color="gray.500" mb={1}>Contacts:</Text>
                <HStack spacing={1} flexWrap="wrap">
                    {property.owners.map(owner => (
                        <Badge
                            key={owner.id}
                            colorScheme={owner.type === 'OWNER' ? 'blue' : 'green'}
                            fontSize="xs"
                        >
                            {owner.contact.firstName} {owner.contact.lastName} ({owner.type === 'OWNER' ? 'P' : 'I'})
                        </Badge>
                    ))}
                </HStack>
            </Box>
        )}

        <Flex pt={3} borderTopWidth={1} borderColor="gray.100" justify="space-between" align="center">
            {property.agent ? (
                <Text fontSize="xs" color="gray.400">Agent: {property.agent.firstName}</Text>
            ) : <Spacer />}

            <HStack spacing={1}>
                {/* BOUTON HOME STAGING 🛋️ */}
                {!property.imageUrlStaged && property.imageUrl && (
                  <IconButton
                    icon={<FiHome />}
                    size="sm"
                    variant="ghost"
                    colorScheme="purple"
                    onClick={onStagingOpen}
                    aria-label="Home Staging Virtuel"
                    title="Meubler la pièce avec IA"
                  />
                )}

                {/* BOUTON AMÉLIORER PHOTO ✨ */}
                {!property.imageUrlEnhanced && property.imageUrl && (
                  <IconButton
                    icon={<FiZap />}
                    size="sm"
                    variant="ghost"
                    colorScheme="yellow"
                    onClick={handleEnhancePhoto}
                    isLoading={isEnhancing}
                    aria-label="Améliorer la photo"
                    title="Améliorer la photo avec IA"
                  />
                )}

                {/* BOUTON DOCUMENTS PDF 📄 */}
                <IconButton
                  icon={<FiFileText />}
                  size="sm"
                  variant="ghost"
                  colorScheme="orange"
                  onClick={onDocGenOpen}
                  aria-label="Générer Documents"
                  title="Générer des documents PDF"
                />

                {/* LE BOUTON PARTAGER */}
                <IconButton icon={<FaShareAlt />} size="sm" variant="ghost" colorScheme="purple" onClick={handleShare} aria-label="Partager" />

                <IconButton icon={<EditIcon />} size="sm" variant="ghost" colorScheme="blue" onClick={() => setIsEditing(true)} aria-label="Modifier" />
                <IconButton icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={isLoading} aria-label="Supprimer" />
            </HStack>
        </Flex>
      </Box>

      {/* MODAL DE GÉNÉRATION DE DOCUMENTS */}
      <DocumentGenerator
        isOpen={isDocGenOpen}
        onClose={onDocGenClose}
        property={property}
        token={token}
      />

      {/* MODAL DE HOME STAGING VIRTUEL */}
      <StagingModal
        isOpen={isStagingOpen}
        onClose={onStagingClose}
        property={property}
        token={token}
        onPropertyUpdated={onPropertyUpdated}
      />
    </Box>
  );
}