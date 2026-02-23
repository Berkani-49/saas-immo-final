import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Card, CardBody, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td,
  Button, Icon, HStack, Badge, useToast, Flex, IconButton, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Input, Select, VStack
} from '@chakra-ui/react';
import { FiEdit3, FiPlus, FiSend, FiDownload, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from '../config';
import { usePlan } from '../contexts/PlanContext';

const STATUS_CONFIG = {
  DRAFT: { color: 'gray', label: 'Brouillon' },
  SENT: { color: 'orange', label: 'En attente' },
  SIGNED: { color: 'green', label: 'Signé' },
  EXPIRED: { color: 'red', label: 'Expiré' },
};

const DOCUMENT_TYPES = [
  { id: 'MANDAT_VENTE', name: 'Mandat de vente' },
  { id: 'MANDAT_GESTION', name: 'Mandat de gestion' },
  { id: 'BAIL_HABITATION', name: "Bail d'habitation" },
];

export default function SignaturesPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ title: '', type: 'MANDAT_VENTE', signerName: '', signerEmail: '', propertyId: '' });
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const { limits, usage } = usePlan();

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, propsRes] = await Promise.all([
        axios.get(`${API_URL}/api/documents`, config),
        axios.get(`${API_URL}/api/properties`, config),
      ]);
      setDocuments(docsRes.data.documents);
      setProperties(propsRes.data || []);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger les données', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.signerName || !form.signerEmail) {
      toast({ title: 'Champs requis', description: 'Veuillez remplir tous les champs obligatoires', status: 'warning', duration: 3000 });
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API_URL}/api/documents`, {
        title: form.title,
        type: form.type,
        signerName: form.signerName,
        signerEmail: form.signerEmail,
        propertyId: form.propertyId || undefined,
      }, config);
      toast({ title: 'Document créé', status: 'success', duration: 3000 });
      setForm({ title: '', type: 'MANDAT_VENTE', signerName: '', signerEmail: '', propertyId: '' });
      onClose();
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors de la création';
      toast({ title: 'Erreur', description: msg, status: 'error', duration: 4000 });
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (docId) => {
    setActionLoading((prev) => ({ ...prev, [`send-${docId}`]: true }));
    try {
      await axios.post(`${API_URL}/api/documents/${docId}/send`, {}, config);
      toast({ title: 'Envoyé', description: 'Lien de signature envoyé par email', status: 'success', duration: 3000 });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: "Erreur lors de l'envoi", status: 'error', duration: 3000 });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`send-${docId}`]: false }));
    }
  };

  const handleDownload = async (docId) => {
    setActionLoading((prev) => ({ ...prev, [`dl-${docId}`]: true }));
    try {
      const response = await axios.get(`${API_URL}/api/documents/${docId}/download`, {
        ...config,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document-${docId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors du téléchargement', status: 'error', duration: 3000 });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`dl-${docId}`]: false }));
    }
  };

  const handleDelete = async (docId) => {
    setActionLoading((prev) => ({ ...prev, [`del-${docId}`]: true }));
    try {
      await axios.delete(`${API_URL}/api/documents/${docId}`, config);
      toast({ title: 'Supprimé', status: 'info', duration: 2000 });
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur lors de la suppression';
      toast({ title: 'Erreur', description: msg, status: 'error', duration: 3000 });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`del-${docId}`]: false }));
    }
  };

  if (loading) return <Flex justify="center" align="center" minH="60vh"><Spinner size="xl" color="brand.400" /></Flex>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Heading size="lg" color="gray.800">
          <Icon as={FiEdit3} mr={3} color="brand.400" />
          Signature électronique
        </Heading>
        <HStack spacing={3}>
          {limits?.maxSignatures && (
            <Badge colorScheme={usage?.signatures >= limits.maxSignatures ? 'red' : 'blue'} fontSize="sm" px={3} py={1} borderRadius="full">
              {usage?.signatures || 0} / {limits.maxSignatures} ce mois-ci
            </Badge>
          )}
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen} size="sm">
            Nouveau document
          </Button>
        </HStack>
      </Flex>

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <Card bg="white" borderColor="gray.200" borderWidth="1px">
          <CardBody textAlign="center" py={10}>
            <Icon as={FiFileText} boxSize={12} color="gray.600" mb={4} />
            <Text color="gray.400" fontSize="lg">Aucun document</Text>
            <Text color="gray.500" fontSize="sm" mb={4}>Créez votre premier mandat ou bail à faire signer en ligne.</Text>
            <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>Nouveau document</Button>
          </CardBody>
        </Card>
      ) : (
        <Card bg="white" borderColor="gray.200" borderWidth="1px" overflow="hidden">
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.400" borderColor="gray.300">Document</Th>
                  <Th color="gray.400" borderColor="gray.300">Type</Th>
                  <Th color="gray.400" borderColor="gray.300">Signataire</Th>
                  <Th color="gray.400" borderColor="gray.300">Bien</Th>
                  <Th color="gray.400" borderColor="gray.300">Statut</Th>
                  <Th color="gray.400" borderColor="gray.300">Date</Th>
                  <Th color="gray.400" borderColor="gray.300" textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {documents.map((doc) => {
                  const statusCfg = STATUS_CONFIG[doc.status];
                  const typeName = DOCUMENT_TYPES.find((t) => t.id === doc.type)?.name || doc.type;
                  return (
                    <Tr key={doc.id} _hover={{ bg: 'gray.100' }}>
                      <Td borderColor="gray.300">
                        <Text color="gray.800" fontSize="sm" fontWeight="medium" noOfLines={1}>{doc.title}</Text>
                      </Td>
                      <Td borderColor="gray.300">
                        <Text color="gray.600" fontSize="sm">{typeName}</Text>
                      </Td>
                      <Td borderColor="gray.300">
                        <Box>
                          <Text color="gray.800" fontSize="sm">{doc.signerName}</Text>
                          <Text color="gray.500" fontSize="xs">{doc.signerEmail}</Text>
                        </Box>
                      </Td>
                      <Td borderColor="gray.300">
                        <Text color="gray.400" fontSize="sm" noOfLines={1}>
                          {doc.property ? `${doc.property.address}, ${doc.property.city}` : '—'}
                        </Text>
                      </Td>
                      <Td borderColor="gray.300">
                        <Badge colorScheme={statusCfg.color} fontSize="xs">{statusCfg.label}</Badge>
                      </Td>
                      <Td borderColor="gray.300">
                        <Text color="gray.400" fontSize="xs">
                          {doc.signedAt
                            ? `Signé ${new Date(doc.signedAt).toLocaleDateString('fr-FR')}`
                            : new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </Td>
                      <Td borderColor="gray.300">
                        <HStack spacing={1} justify="center">
                          {(doc.status === 'DRAFT' || doc.status === 'SENT') && (
                            <Tooltip label="Envoyer pour signature">
                              <IconButton
                                icon={<FiSend />} size="xs" colorScheme="blue" variant="ghost"
                                isLoading={actionLoading[`send-${doc.id}`]}
                                onClick={() => handleSend(doc.id)}
                                aria-label="Envoyer"
                              />
                            </Tooltip>
                          )}
                          <Tooltip label="Télécharger PDF">
                            <IconButton
                              icon={<FiDownload />} size="xs" colorScheme="green" variant="ghost"
                              isLoading={actionLoading[`dl-${doc.id}`]}
                              onClick={() => handleDownload(doc.id)}
                              aria-label="Télécharger"
                            />
                          </Tooltip>
                          {doc.status !== 'SIGNED' && (
                            <Tooltip label="Supprimer">
                              <IconButton
                                icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost"
                                isLoading={actionLoading[`del-${doc.id}`]}
                                onClick={() => handleDelete(doc.id)}
                                aria-label="Supprimer"
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}

      {/* Modal création document */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="white" borderColor="gray.300" borderWidth="1px">
          <ModalHeader color="gray.800">Nouveau document</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.600" fontSize="sm">Type de document</FormLabel>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  bg="gray.50" borderColor="gray.300" color="gray.800"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: '#2D3748' }}>{t.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.600" fontSize="sm">Titre</FormLabel>
                <Input
                  placeholder="Ex: Mandat de vente - Appartement Paris 15e"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  bg="gray.50" borderColor="gray.300" color="gray.800"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.600" fontSize="sm">Nom du signataire</FormLabel>
                <Input
                  placeholder="Nom et prénom"
                  value={form.signerName}
                  onChange={(e) => setForm({ ...form, signerName: e.target.value })}
                  bg="gray.50" borderColor="gray.300" color="gray.800"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.600" fontSize="sm">Email du signataire</FormLabel>
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={form.signerEmail}
                  onChange={(e) => setForm({ ...form, signerEmail: e.target.value })}
                  bg="gray.50" borderColor="gray.300" color="gray.800"
                />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.600" fontSize="sm">Bien associé (optionnel)</FormLabel>
                <Select
                  placeholder="Sélectionner un bien..."
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  bg="gray.50" borderColor="gray.300" color="gray.800"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: '#2D3748' }}>
                      {p.address}{p.city ? `, ${p.city}` : ''} — {p.price?.toLocaleString('fr-FR')} €
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="brand" onClick={handleCreate} isLoading={creating}>
              Créer le document
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
