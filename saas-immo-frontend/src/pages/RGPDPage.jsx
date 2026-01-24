// Fichier : src/pages/RGPDPage.jsx
// Page de gestion RGPD : Export données, Suppression compte, Consentement cookies

import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Divider,
  HStack,
  Icon,
  Badge
} from '@chakra-ui/react';
import { FiDownload, FiTrash2, FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RGPDPage({ token }) {
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  const navigate = useNavigate();

  // Export de toutes les données utilisateur (format JSON)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('https://saas-immo.onrender.com/api/rgpd/export-data', config);

      // Créer un fichier JSON téléchargeable
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: 'Vos données ont été téléchargées avec succès',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter vos données',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Suppression définitive du compte
  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'supprimer mon compte') {
      toast({
        title: 'Confirmation incorrecte',
        description: 'Veuillez taper exactement "supprimer mon compte"',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete('https://saas-immo.onrender.com/api/rgpd/delete-account', config);

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte et toutes vos données ont été supprimés définitivement',
        status: 'success',
        duration: 5000,
      });

      // Déconnexion et redirection
      localStorage.removeItem('token');
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer votre compte',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            <Icon as={FiShield} mr={2} color="brand.500" />
            RGPD & Confidentialité
          </Heading>
          <Text color="gray.600">
            Gérez vos données personnelles conformément au Règlement Général sur la Protection des Données
          </Text>
        </Box>

        {/* Info RGPD */}
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Vos droits RGPD</Text>
            <Text fontSize="sm">
              Vous avez le droit d'accéder, rectifier, exporter et supprimer vos données personnelles à tout moment.
            </Text>
          </Box>
        </Alert>

        {/* Export des données */}
        <Card>
          <CardHeader>
            <HStack>
              <Icon as={FiDownload} color="blue.500" boxSize={5} />
              <Heading size="md">Exporter mes données</Heading>
              <Badge colorScheme="blue">Droit d'accès</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Text color="gray.600">
                Téléchargez une copie complète de toutes vos données personnelles stockées dans notre système
                (profil, biens, contacts, tâches, factures, etc.) au format JSON.
              </Text>
              <Text fontSize="sm" color="gray.500">
                <Icon as={FiCheckCircle} color="green.500" mr={1} />
                Inclut : profil utilisateur, propriétés, contacts, tâches, rendez-vous, factures, activités
              </Text>
              <Button
                leftIcon={<Icon as={FiDownload} />}
                colorScheme="blue"
                onClick={handleExportData}
                isLoading={isExporting}
                loadingText="Export en cours..."
                size="lg"
              >
                Télécharger mes données
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Zone danger : Suppression de compte */}
        <Card borderColor="red.300" borderWidth="2px">
          <CardHeader bg="red.50">
            <HStack>
              <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
              <Heading size="md" color="red.700">Zone de danger</Heading>
              <Badge colorScheme="red">Droit à l'oubli</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Action irréversible</Text>
                  <Text fontSize="sm">
                    La suppression de votre compte entraînera la suppression définitive de toutes vos données
                    (profil, biens, contacts, factures, etc.). Cette action ne peut pas être annulée.
                  </Text>
                </Box>
              </Alert>

              <Text color="gray.600" fontWeight="bold">
                Cette action supprimera :
              </Text>
              <VStack align="start" pl={4} spacing={1}>
                <Text fontSize="sm" color="gray.600">• Votre profil et informations personnelles</Text>
                <Text fontSize="sm" color="gray.600">• Tous vos biens immobiliers</Text>
                <Text fontSize="sm" color="gray.600">• Tous vos contacts</Text>
                <Text fontSize="sm" color="gray.600">• Toutes vos tâches et rendez-vous</Text>
                <Text fontSize="sm" color="gray.600">• Toutes vos factures et activités</Text>
                <Text fontSize="sm" color="gray.600">• Votre abonnement en cours</Text>
              </VStack>

              <Button
                leftIcon={<Icon as={FiTrash2} />}
                colorScheme="red"
                variant="outline"
                onClick={onOpen}
                size="lg"
              >
                Supprimer définitivement mon compte
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Informations légales */}
        <Card bg="gray.50">
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Heading size="sm">Informations légales</Heading>
              <Text fontSize="sm" color="gray.600">
                Conformément au RGPD (Règlement UE 2016/679), vous disposez d'un droit d'accès, de rectification,
                d'effacement, de limitation du traitement, de portabilité et d'opposition concernant vos données personnelles.
              </Text>
              <Text fontSize="sm" color="gray.600">
                Pour toute question concernant vos données personnelles, contactez-nous à : <strong>rgpd@immoflow.fr</strong>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        size="xl"
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              ⚠️ Confirmer la suppression définitive
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="stretch" spacing={4}>
                <Alert status="error">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Cette action est <strong>IRRÉVERSIBLE</strong>. Toutes vos données seront supprimées définitivement.
                  </Text>
                </Alert>

                <Text fontWeight="bold">
                  Pour confirmer, tapez exactement :
                </Text>
                <Text fontWeight="bold" color="red.500" fontSize="lg" textAlign="center" bg="red.50" p={3} borderRadius="md">
                  supprimer mon compte
                </Text>

                <FormControl>
                  <FormLabel fontSize="sm">Confirmation</FormLabel>
                  <Input
                    placeholder="Tapez le texte ci-dessus"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    autoFocus
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Annuler
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                ml={3}
                isDisabled={deleteConfirmation.toLowerCase() !== 'supprimer mon compte'}
              >
                Supprimer définitivement
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
