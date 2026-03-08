// Fichier : src/components/SuiviPanel.jsx
// Suivi commercial : lier un acheteur à un bien et suivre l'avancement

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Text, Button, VStack, HStack, Badge, Select, Textarea, Input,
  Flex, Icon, Spinner, useToast, IconButton, Collapse, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, useDisclosure, Divider, Tooltip
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FiHome, FiCheckCircle, FiXCircle, FiEye, FiFileText, FiStar, FiClock } from 'react-icons/fi';
import { API_URL } from '../config';

const STATUSES = [
  { value: 'INTEREST',   label: 'Intéressé',       color: 'blue',   icon: FiStar },
  { value: 'VISIT',      label: 'Visite faite',     color: 'purple', icon: FiEye },
  { value: 'OFFER',      label: 'Offre soumise',    color: 'orange', icon: FiFileText },
  { value: 'SOLD',       label: 'Vendu',            color: 'green',  icon: FiCheckCircle },
  { value: 'REJECTED',   label: 'Refusé',           color: 'red',    icon: FiXCircle },
  { value: 'WITHDRAWN',  label: 'S\'est retiré',    color: 'gray',   icon: FiClock },
];

const REJECTION_REASONS = [
  { value: 'PRICE',           label: 'Prix trop élevé' },
  { value: 'FOUND_ELSEWHERE', label: 'A trouvé ailleurs' },
  { value: 'FINANCING',       label: 'Problème de financement' },
  { value: 'NOT_MATCHING',    label: 'Ne correspond pas aux critères' },
  { value: 'OTHER',           label: 'Autre raison' },
];

const PIPELINE = ['INTEREST', 'VISIT', 'OFFER'];
const TERMINAL = ['SOLD', 'REJECTED', 'WITHDRAWN'];

function StatusBadge({ status }) {
  const s = STATUSES.find(s => s.value === status) || STATUSES[0];
  return (
    <Badge colorScheme={s.color} variant="subtle" borderRadius="full" px={2} fontSize="xs">
      {s.label}
    </Badge>
  );
}

function PipelineSteps({ status, onStep }) {
  const currentIdx = PIPELINE.indexOf(status);
  const isTerminal = TERMINAL.includes(status);

  return (
    <HStack spacing={0} w="full" mb={3}>
      {PIPELINE.map((step, i) => {
        const s = STATUSES.find(x => x.value === step);
        const isActive   = step === status;
        const isPassed   = !isTerminal && i < currentIdx;
        const isDisabled = isTerminal;
        return (
          <React.Fragment key={step}>
            <Tooltip label={s.label}>
              <Box
                flex={1} textAlign="center" py={1} px={2}
                borderRadius={i === 0 ? 'full 0 0 full' : i === PIPELINE.length - 1 ? '0 full full 0' : '0'}
                bg={isActive ? `${s.color}.100` : isPassed ? 'green.50' : 'gray.100'}
                borderWidth="1px"
                borderColor={isActive ? `${s.color}.300` : isPassed ? 'green.200' : 'gray.200'}
                cursor={isDisabled ? 'default' : 'pointer'}
                onClick={() => !isDisabled && onStep(step)}
                _hover={!isDisabled ? { opacity: 0.8 } : {}}
                transition="all 0.15s"
              >
                <Text fontSize="xs" fontWeight={isActive ? 'bold' : 'normal'}
                  color={isActive ? `${s.color}.700` : isPassed ? 'green.600' : 'gray.500'}>
                  {s.label}
                </Text>
              </Box>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </HStack>
  );
}

function SuiviCard({ suivi, onUpdate, onDelete }) {
  const [expanded, setExpanded]   = useState(false);
  const [notes, setNotes]         = useState(suivi.notes || '');
  const [rejReason, setRejReason] = useState(suivi.rejectionReason || '');
  const [saving, setSaving]       = useState(false);
  const toast = useToast();
  const property = suivi.property;

  const handleStep = async (newStatus) => {
    setSaving(true);
    try {
      const updated = await onUpdate(suivi.id, { status: newStatus, rejectionReason: null });
      if (newStatus !== 'REJECTED') setRejReason('');
    } finally {
      setSaving(false);
    }
  };

  const handleTerminal = async (status) => {
    setSaving(true);
    try {
      await onUpdate(suivi.id, { status, rejectionReason: status === 'REJECTED' ? rejReason || null : null });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onUpdate(suivi.id, { notes });
      toast({ title: 'Notes sauvegardées', status: 'success', duration: 1500 });
    } finally {
      setSaving(false);
    }
  };

  const isTerminal = TERMINAL.includes(suivi.status);
  const currentStatus = STATUSES.find(s => s.value === suivi.status) || STATUSES[0];

  return (
    <Box
      borderWidth="1px" borderColor="gray.200" borderRadius="xl"
      bg="white" shadow="sm" overflow="hidden"
      transition="box-shadow 0.2s"
      _hover={{ shadow: 'md' }}
    >
      {/* Header */}
      <Flex px={4} py={3} align="center" justify="space-between"
        borderLeftWidth="3px" borderLeftColor={`${currentStatus.color}.400`}
      >
        <HStack spacing={3} flex={1} minW={0}>
          <Icon as={FiHome} color="gray.400" flexShrink={0} />
          <Box minW={0}>
            <Text fontWeight="600" fontSize="sm" color="gray.800" noOfLines={1}>
              {property?.address}
            </Text>
            <Text fontSize="xs" color="gray.500">{property?.city} · {property?.price?.toLocaleString()}€</Text>
          </Box>
        </HStack>
        <HStack spacing={2}>
          <StatusBadge status={suivi.status} />
          <IconButton
            icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="xs" variant="ghost" colorScheme="gray"
            aria-label="Détails"
            onClick={() => setExpanded(v => !v)}
          />
          <IconButton
            icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red"
            aria-label="Supprimer" onClick={() => onDelete(suivi.id)}
          />
        </HStack>
      </Flex>

      {/* Expanded content */}
      <Collapse in={expanded} animateOpacity>
        <Box px={4} pb={4} pt={2} bg="gray.50" borderTopWidth="1px" borderColor="gray.100">
          {/* Pipeline steps */}
          {!isTerminal && (
            <PipelineSteps status={suivi.status} onStep={handleStep} />
          )}

          {/* Terminal actions */}
          {!isTerminal && (
            <SimpleGrid columns={2} spacing={2} mb={3}>
              <Button size="xs" colorScheme="green" variant="outline" leftIcon={<Icon as={FiCheckCircle} />}
                onClick={() => handleTerminal('SOLD')} isLoading={saving}>
                Marquer vendu
              </Button>
              <Button size="xs" colorScheme="red" variant="outline" leftIcon={<Icon as={FiXCircle} />}
                onClick={() => handleTerminal('REJECTED')} isLoading={saving}>
                Marquer refusé
              </Button>
            </SimpleGrid>
          )}

          {/* If REJECTED, show reason */}
          {suivi.status === 'REJECTED' && (
            <Box mb={3}>
              <Text fontSize="xs" color="gray.500" mb={1} fontWeight="600">RAISON DU REFUS</Text>
              <Select
                size="sm" value={rejReason} borderRadius="lg"
                onChange={(e) => {
                  setRejReason(e.target.value);
                  onUpdate(suivi.id, { rejectionReason: e.target.value });
                }}
                placeholder="Sélectionner une raison"
              >
                {REJECTION_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Box>
          )}

          {/* Si terminal, bouton réactiver */}
          {isTerminal && (
            <Button size="xs" variant="outline" colorScheme="blue" mb={3}
              onClick={() => handleStep('INTEREST')} isLoading={saving}>
              Réactiver ce suivi
            </Button>
          )}

          {/* Notes */}
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="600">NOTES</Text>
          <Textarea
            size="sm" value={notes} rows={3} borderRadius="lg" bg="white"
            placeholder="Ex: Visite positive, hésite sur le prix demandé..."
            onChange={(e) => setNotes(e.target.value)}
            fontSize="sm"
          />
          <Button size="xs" colorScheme="brand" mt={2} onClick={handleSaveNotes} isLoading={saving}>
            Enregistrer les notes
          </Button>

          <Text fontSize="10px" color="gray.400" mt={2}>
            Créé le {new Date(suivi.createdAt).toLocaleDateString('fr-FR')} · Modifié le {new Date(suivi.updatedAt).toLocaleDateString('fr-FR')}
          </Text>
        </Box>
      </Collapse>
    </Box>
  );
}

export default function SuiviPanel({ contactId, token }) {
  const [suivis, setSuivis]         = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedProp, setSelectedProp] = useState('');
  const [adding, setAdding]         = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadSuivis();
    loadProperties();
  }, [contactId]);

  const loadSuivis = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/suivis?contactId=${contactId}`, config);
      setSuivis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/properties`, config);
      setProperties(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!selectedProp) return;
    setAdding(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_URL}/api/suivis`, {
        contactId, propertyId: parseInt(selectedProp),
      }, config);
      setSuivis(prev => [res.data, ...prev]);
      setSelectedProp('');
      onClose();
      toast({ title: 'Suivi créé', status: 'success', duration: 2000 });
    } catch (e) {
      const msg = e.response?.data?.error || 'Erreur';
      toast({ title: msg, status: 'error', duration: 3000 });
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id, data) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.put(`${API_URL}/api/suivis/${id}`, data, config);
    setSuivis(prev => prev.map(s => s.id === id ? res.data : s));
    return res.data;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce suivi ?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/api/suivis/${id}`, config);
      setSuivis(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Suivi supprimé', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Erreur suppression', status: 'error' });
    }
  };

  // Properties not already tracked
  const trackedIds = new Set(suivis.map(s => s.propertyId));
  const available  = properties.filter(p => !trackedIds.has(p.id));

  if (loading) return <Flex justify="center" py={4}><Spinner size="sm" color="brand.500" /></Flex>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontWeight="700" fontSize="sm" color="gray.700">Suivi commercial</Text>
          <Text fontSize="xs" color="gray.400">Biens suivis avec cet acheteur</Text>
        </Box>
        <Button size="sm" colorScheme="brand" leftIcon={<AddIcon />} onClick={onOpen}>
          Ajouter un bien
        </Button>
      </Flex>

      {suivis.length === 0 ? (
        <Box p={6} textAlign="center" bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
          <Icon as={FiHome} w={8} h={8} color="gray.300" mb={2} />
          <Text color="gray.500" fontSize="sm">Aucun bien suivi pour ce contact.</Text>
          <Text color="gray.400" fontSize="xs">Ajoutez un bien pour commencer le suivi.</Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {suivis.map(suivi => (
            <SuiviCard
              key={suivi.id}
              suivi={suivi}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </VStack>
      )}

      {/* Modal ajout */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader fontSize="md">Ajouter un bien à suivre</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.500" mb={3}>
              Sélectionnez un bien pour commencer le suivi avec ce contact.
            </Text>
            <Select
              placeholder="Choisir un bien..."
              value={selectedProp}
              onChange={(e) => setSelectedProp(e.target.value)}
              size="sm"
              borderRadius="lg"
            >
              {available.map(p => (
                <option key={p.id} value={p.id}>
                  {p.address} — {p.city} ({p.price?.toLocaleString()}€)
                </option>
              ))}
            </Select>
            {available.length === 0 && (
              <Text fontSize="xs" color="gray.400" mt={2}>
                Tous vos biens sont déjà suivis pour ce contact.
              </Text>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button size="sm" colorScheme="brand" isLoading={adding}
              isDisabled={!selectedProp} onClick={handleAdd}>
              Commencer le suivi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
