// Composant : DocumentGenerator - Génération de documents PDF (Bon de visite, Offre d'achat)
import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, Button, VStack, HStack, Text, FormControl, FormLabel, Input,
  useToast, Icon, Tabs, TabList, Tab, TabPanels, TabPanel, Badge, Select
} from '@chakra-ui/react';

const PHONE_PREFIXES = [
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+32', label: '🇧🇪 +32' },
  { code: '+41', label: '🇨🇭 +41' },
  { code: '+352', label: '🇱🇺 +352' },
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+213', label: '🇩🇿 +213' },
  { code: '+216', label: '🇹🇳 +216' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+31', label: '🇳🇱 +31' },
  { code: '+351', label: '🇵🇹 +351' },
  { code: '+1', label: '🇺🇸 +1' },
];
import { FiFileText, FiDownload } from 'react-icons/fi';
import { API_URL } from '../config';

export default function DocumentGenerator({ isOpen, onClose, property, token }) {
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // États pour Bon de Visite
  const [clientName, setClientName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  // États pour Offre d'Achat
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhonePrefix, setBuyerPhonePrefix] = useState('+33');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [offerAmount, setOfferAmount] = useState(property?.price || '');

  const generateDocument = async (type) => {
    if (!property) return;

    setIsGenerating(true);

    try {
      let url = '';
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob' // Important pour télécharger le PDF
      };

      if (type === 'bon-visite') {
        url = `${API_URL}/api/properties/${property.id}/documents/bon-de-visite?clientName=${encodeURIComponent(clientName)}&visitDate=${visitDate}`;
      } else if (type === 'offre-achat') {
        url = `${API_URL}/api/properties/${property.id}/documents/offre-achat?buyerName=${encodeURIComponent(buyerName)}&buyerEmail=${encodeURIComponent(buyerEmail)}&buyerPhone=${encodeURIComponent(buyerPhonePrefix + buyerPhone)}&offerAmount=${offerAmount}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();

      // Créer un lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = type === 'bon-visite'
        ? `bon-de-visite-${property.id}.pdf`
        : `offre-achat-${property.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "PDF généré !",
        description: "Le document a été téléchargé avec succès.",
        status: "success",
        duration: 3000
      });

      // Réinitialiser les champs
      if (type === 'bon-visite') {
        setClientName('');
        setVisitDate(new Date().toISOString().split('T')[0]);
      } else {
        setBuyerName('');
        setBuyerEmail('');
        setBuyerPhonePrefix('+33');
        setBuyerPhone('');
        setOfferAmount(property.price);
      }

    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le document.",
        status: "error"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!property) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiFileText} color="blue.500" />
            <Text>Générer un Document</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Bien : <strong>{property.address}</strong> - {property.price.toLocaleString()} €
            </Text>

            <Tabs colorScheme="blue" variant="enclosed">
              <TabList>
                <Tab>📋 Bon de Visite</Tab>
                <Tab>💼 Offre d'Achat</Tab>
              </TabList>

              <TabPanels>
                {/* ONGLET 1 : BON DE VISITE */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Document officiel prouvant qu'une visite a été effectuée.
                    </Text>

                    <FormControl isRequired>
                      <FormLabel>Nom du client</FormLabel>
                      <Input
                        placeholder="Ex: Jean Dupont"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Date de la visite</FormLabel>
                      <Input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                      />
                    </FormControl>

                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FiDownload} />}
                      onClick={() => generateDocument('bon-visite')}
                      isLoading={isGenerating}
                      isDisabled={!clientName}
                      size="lg"
                      width="full"
                    >
                      Générer le Bon de Visite (PDF)
                    </Button>
                  </VStack>
                </TabPanel>

                {/* ONGLET 2 : OFFRE D'ACHAT */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Modèle pré-rempli pour formaliser une offre d'achat.
                    </Text>

                    <FormControl isRequired>
                      <FormLabel>Nom de l'acquéreur</FormLabel>
                      <Input
                        placeholder="Ex: Marie Martin"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                      />
                    </FormControl>

                    <HStack>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Téléphone</FormLabel>
                        <HStack spacing={0}>
                          <Select
                            value={buyerPhonePrefix}
                            onChange={(e) => setBuyerPhonePrefix(e.target.value)}
                            w="120px"
                            borderRightRadius={0}
                            flexShrink={0}
                          >
                            {PHONE_PREFIXES.map(p => (
                              <option key={p.code} value={p.code}>{p.label}</option>
                            ))}
                          </Select>
                          <Input
                            type="tel"
                            placeholder="6 12 34 56 78"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            borderLeftRadius={0}
                          />
                        </HStack>
                      </FormControl>
                    </HStack>

                    <FormControl isRequired>
                      <FormLabel>Montant de l'offre (€)</FormLabel>
                      <Input
                        type="number"
                        placeholder="250000"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Prix demandé : {property.price.toLocaleString()} €
                      </Text>
                    </FormControl>

                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FiDownload} />}
                      onClick={() => generateDocument('offre-achat')}
                      isLoading={isGenerating}
                      isDisabled={!buyerName || !buyerEmail || !offerAmount}
                      size="lg"
                      width="full"
                    >
                      Générer l'Offre d'Achat (PDF)
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} variant="ghost">Fermer</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
