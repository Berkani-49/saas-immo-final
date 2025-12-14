import { useState, useEffect } from 'react';
import {
  Box, Image, Grid, IconButton, Input, Badge, Text, HStack,
  useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, useDisclosure, Spinner, FormControl, FormLabel, Button,
  VStack, SimpleGrid
} from '@chakra-ui/react';
import { DeleteIcon, StarIcon, ViewIcon } from '@chakra-ui/icons';
import { FiHome } from 'react-icons/fi';
import axios from 'axios';

export default function PropertyImageGallery({ propertyId, token, onImagesChange }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stagingImageId, setStagingImageId] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [isStaging, setIsStaging] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isStagingOpen, onOpen: onStagingOpen, onClose: onStagingClose } = useDisclosure();

  // Styles disponibles pour le staging
  const stagingStyles = [
    { id: 'modern', name: 'Moderne', emoji: '🏠', color: 'blue' },
    { id: 'scandinavian', name: 'Scandinave', emoji: '🌿', color: 'teal' },
    { id: 'industrial', name: 'Industriel', emoji: '🏭', color: 'orange' },
    { id: 'classic', name: 'Classique', emoji: '👑', color: 'purple' },
    { id: 'bohemian', name: 'Bohème', emoji: '🎨', color: 'pink' }
  ];

  // Charger les images au montage du composant
  useEffect(() => {
    if (propertyId) {
      loadImages();
    }
  }, [propertyId]);

  // Fonction pour charger toutes les images
  const loadImages = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `https://saas-immo.onrender.com/api/properties/${propertyId}/images`,
        config
      );
      setImages(res.data);

      // Notifier le parent si une callback est fournie
      if (onImagesChange) {
        onImagesChange(res.data);
      }
    } catch (error) {
      console.error('Erreur chargement images:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les images',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour uploader une nouvelle photo
  const handleUpload = async (file) => {
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'Image trop volumineuse (max 5MB)',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload via le backend (qui upload vers Supabase avec service_role pour bypass RLS)
      const formData = new FormData();
      formData.append('image', file);

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      const uploadResponse = await axios.post(
        'https://saas-immo.onrender.com/api/upload-image',
        formData,
        config
      );

      const publicUrl = uploadResponse.data.url;

      // 2. Enregistrer dans la base de données via l'API
      const jsonConfig = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.post(
        `https://saas-immo.onrender.com/api/properties/${propertyId}/images`,
        {
          url: publicUrl,
          caption: null,
          isPrimary: images.length === 0 // Première photo = principale
        },
        jsonConfig
      );

      toast({
        title: 'Photo ajoutée !',
        description: 'La photo a été uploadée avec succès',
        status: 'success',
        duration: 3000,
      });

      // Recharger les images
      loadImages();
    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || error.message || 'Impossible d\'uploader la photo',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour supprimer une photo
  const handleDelete = async (imageId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette photo ?')) {
      return;
    }

    try {
      // Supprimer de la base de données (le backend s'occupe aussi de supprimer du storage)
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `https://saas-immo.onrender.com/api/properties/${propertyId}/images/${imageId}`,
        config
      );

      toast({
        title: 'Photo supprimée',
        description: 'La photo a été supprimée avec succès',
        status: 'success',
        duration: 3000,
      });

      // Recharger les images
      loadImages();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la photo',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Fonction pour définir une photo comme principale
  const handleSetPrimary = async (imageId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(
        `https://saas-immo.onrender.com/api/properties/${propertyId}/images/${imageId}/set-primary`,
        {},
        config
      );

      toast({
        title: 'Photo principale définie',
        description: 'Cette photo sera affichée en premier',
        status: 'success',
        duration: 3000,
      });

      // Recharger les images
      loadImages();
    } catch (error) {
      console.error('Erreur définir principale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de définir la photo principale',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Fonction pour afficher l'image en grand
  const handleViewImage = (image) => {
    setSelectedImage(image);
    onOpen();
  };

  // Fonction pour ouvrir le modal de staging pour une photo
  const handleOpenStaging = (imageId) => {
    setStagingImageId(imageId);
    onStagingOpen();
  };

  // Fonction pour appliquer le staging IA à une photo
  const handleStagePhoto = async () => {
    if (!stagingImageId) return;

    setIsStaging(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const imageToStage = images.find(img => img.id === stagingImageId);

      // Appeler l'API de staging avec l'URL de l'image spécifique
      const response = await axios.post(
        `https://saas-immo.onrender.com/api/properties/${propertyId}/stage-image`,
        {
          imageUrl: imageToStage.url,
          imageId: stagingImageId,
          style: selectedStyle
        },
        config
      );

      const predictionId = response.data.predictionId;

      toast({
        title: "⏳ Génération lancée !",
        description: "Cela prendra 60-90 secondes. Veuillez patienter...",
        status: "info",
        duration: 3000,
        isClosable: true
      });

      // Polling pour vérifier le statut
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(
            `https://saas-immo.onrender.com/api/properties/${propertyId}/stage-status/${predictionId}?style=${selectedStyle}&imageId=${stagingImageId}`,
            config
          );

          if (statusResponse.data.status === 'succeeded') {
            clearInterval(pollInterval);
            setIsStaging(false);
            onStagingClose();

            toast({
              title: "✨ Photo meublée générée !",
              description: "La photo avec meubles virtuels a été ajoutée à la galerie",
              status: "success",
              duration: 5000,
              isClosable: true
            });

            // Recharger les images
            loadImages();
          } else if (statusResponse.data.status === 'failed') {
            clearInterval(pollInterval);
            setIsStaging(false);
            toast({
              title: "❌ Échec de la génération",
              description: "Une erreur est survenue lors de la génération",
              status: "error",
              duration: 5000,
              isClosable: true
            });
          }
        } catch (error) {
          console.error('Erreur polling:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('Erreur staging:', error);
      setIsStaging(false);
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de démarrer le staging',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.500">Chargement des photos...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Bouton d'upload */}
      <FormControl mb={6}>
        <FormLabel fontWeight="bold" fontSize="lg">
          Photos du bien ({images.length})
        </FormLabel>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files[0])}
          isDisabled={uploading}
          p={1}
          border="2px dashed"
          borderColor="blue.300"
          _hover={{ borderColor: 'blue.500' }}
          cursor="pointer"
        />
        <Text fontSize="xs" color="gray.500" mt={2}>
          Formats acceptés: JPG, PNG, WebP (max 5MB)
        </Text>
      </FormControl>

      {/* Message si aucune photo */}
      {images.length === 0 && !uploading && (
        <Box
          textAlign="center"
          py={10}
          bg="gray.50"
          borderRadius="lg"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="gray.300"
        >
          <Text fontSize="lg" color="gray.500">
            📸 Aucune photo pour ce bien
          </Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            Uploadez des photos pour présenter le bien
          </Text>
        </Box>
      )}

      {/* Spinner pendant l'upload */}
      {uploading && (
        <Box textAlign="center" py={6} bg="blue.50" borderRadius="lg" mb={4}>
          <Spinner size="lg" color="blue.500" />
          <Text mt={3} color="blue.600" fontWeight="medium">
            Upload en cours...
          </Text>
        </Box>
      )}

      {/* Grille de photos */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
        {images.map((img, index) => (
          <Box
            key={img.id}
            position="relative"
            borderWidth="1px"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="md"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
            bg="white"
          >
            {/* Image */}
            <Box
              position="relative"
              h="200px"
              bg="gray.100"
              cursor="pointer"
              onClick={() => handleViewImage(img)}
            >
              <Image
                src={img.url}
                alt={img.caption || `Photo ${index + 1}`}
                w="100%"
                h="100%"
                objectFit="cover"
              />

              {/* Badge "Principale" */}
              {img.isPrimary && (
                <Badge
                  position="absolute"
                  top={2}
                  left={2}
                  colorScheme="green"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  ⭐ Principale
                </Badge>
              )}

              {/* Badge type */}
              {img.type !== 'ORIGINAL' && (
                <Badge
                  position="absolute"
                  top={2}
                  right={2}
                  colorScheme="purple"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {img.type === 'ENHANCED' ? '✨ Améliorée' : '🛋️ Staging'}
                </Badge>
              )}

              {/* Overlay avec icône de zoom */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="blackAlpha.600"
                opacity={0}
                transition="opacity 0.3s"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{ opacity: 1 }}
              >
                <ViewIcon boxSize={8} color="white" />
              </Box>
            </Box>

            {/* Actions */}
            <Box p={3} bg="white">
              <HStack spacing={2} justify="space-between">
                <Text fontSize="sm" fontWeight="medium" color="gray.700" flex={1} noOfLines={1}>
                  {img.caption || `Photo ${index + 1}`}
                </Text>

                <HStack spacing={1}>
                  {/* Bouton définir comme principale */}
                  {!img.isPrimary && (
                    <IconButton
                      icon={<StarIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="yellow"
                      onClick={() => handleSetPrimary(img.id)}
                      aria-label="Définir comme principale"
                      title="Définir comme principale"
                    />
                  )}

                  {/* Bouton ajouter meubles IA - seulement pour les photos ORIGINAL */}
                  {img.type === 'ORIGINAL' && (
                    <IconButton
                      icon={<FiHome />}
                      size="sm"
                      variant="ghost"
                      colorScheme="purple"
                      onClick={() => handleOpenStaging(img.id)}
                      aria-label="Ajouter meubles IA"
                      title="Ajouter meubles IA"
                    />
                  )}

                  {/* Bouton supprimer */}
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(img.id)}
                    aria-label="Supprimer"
                    title="Supprimer"
                  />
                </HStack>
              </HStack>
            </Box>
          </Box>
        ))}
      </Grid>

      {/* Modal pour afficher l'image en grand */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedImage?.caption || 'Photo'}
            {selectedImage?.isPrimary && (
              <Badge ml={2} colorScheme="green">⭐ Principale</Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedImage && (
              <Image
                src={selectedImage.url}
                alt={selectedImage.caption || 'Photo'}
                w="100%"
                maxH="70vh"
                objectFit="contain"
                borderRadius="lg"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal pour choisir le style de staging IA */}
      <Modal isOpen={isStagingOpen} onClose={onStagingClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🎨 Ajouter des meubles avec l'IA</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Choisissez un style de décoration pour cette photo :
              </Text>

              {/* Grille des styles */}
              <SimpleGrid columns={2} spacing={3}>
                {stagingStyles.map((style) => (
                  <Box
                    key={style.id}
                    p={4}
                    borderWidth="2px"
                    borderRadius="lg"
                    borderColor={selectedStyle === style.id ? `${style.color}.500` : 'gray.200'}
                    bg={selectedStyle === style.id ? `${style.color}.50` : 'white'}
                    cursor="pointer"
                    onClick={() => setSelectedStyle(style.id)}
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.02)', shadow: 'md' }}
                  >
                    <VStack spacing={2}>
                      <Text fontSize="3xl">{style.emoji}</Text>
                      <Text fontWeight="bold" color={selectedStyle === style.id ? `${style.color}.700` : 'gray.700'}>
                        {style.name}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>

              <Button
                colorScheme="purple"
                size="lg"
                onClick={handleStagePhoto}
                isLoading={isStaging}
                loadingText="Génération en cours..."
                leftIcon={<FiHome />}
              >
                Générer la photo meublée
              </Button>

              <Text fontSize="xs" color="gray.500" textAlign="center">
                ⏱️ La génération prend environ 60-90 secondes
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
