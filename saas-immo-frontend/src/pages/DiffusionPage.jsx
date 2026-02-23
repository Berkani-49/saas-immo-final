import React, { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber,
  Card, CardBody, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td,
  Button, Icon, HStack, Badge, useToast, Flex, IconButton,
  Tooltip, Image, Switch
} from '@chakra-ui/react';
import { FiShare2, FiGlobe, FiCheck, FiX, FiAlertTriangle, FiZap } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from '../config';
import { usePlan } from '../contexts/PlanContext';

const STATUS_CONFIG = {
  PUBLISHED: { color: 'green', label: 'Publié', icon: FiCheck },
  PENDING: { color: 'orange', label: 'En cours', icon: FiAlertTriangle },
  ERROR: { color: 'red', label: 'Erreur', icon: FiX },
  NOT_PUBLISHED: { color: 'gray', label: 'Non publié', icon: FiX },
};

export default function DiffusionPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [publishing, setPublishing] = useState({});
  const toast = useToast();
  const { limits, usage } = usePlan();

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [propsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/diffusion/properties`, config),
        axios.get(`${API_URL}/api/diffusion/stats`, config),
      ]);
      setProperties(propsRes.data.properties);
      setStats(statsRes.data);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger les données', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAll = async (propertyId) => {
    setPublishing((prev) => ({ ...prev, [propertyId]: true }));
    try {
      await axios.post(`${API_URL}/api/diffusion/properties/${propertyId}/publish`, { all: true }, config);
      toast({ title: 'Publié', description: 'Bien publié sur tous les portails', status: 'success', duration: 3000 });
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors de la publication';
      toast({ title: 'Erreur', description: msg, status: 'error', duration: 4000 });
    } finally {
      setPublishing((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  const handleTogglePortal = async (propertyId, portal, currentStatus) => {
    const key = `${propertyId}-${portal}`;
    setPublishing((prev) => ({ ...prev, [key]: true }));
    try {
      if (currentStatus === 'PUBLISHED') {
        await axios.post(`${API_URL}/api/diffusion/properties/${propertyId}/unpublish`, { portals: [portal] }, config);
      } else {
        await axios.post(`${API_URL}/api/diffusion/properties/${propertyId}/publish`, { portals: [portal] }, config);
      }
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur';
      toast({ title: 'Erreur', description: msg, status: 'error', duration: 4000 });
    } finally {
      setPublishing((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleUnpublishAll = async (propertyId) => {
    setPublishing((prev) => ({ ...prev, [`unpub-${propertyId}`]: true }));
    try {
      await axios.post(`${API_URL}/api/diffusion/properties/${propertyId}/unpublish`, { all: true }, config);
      toast({ title: 'Retiré', description: 'Bien retiré de tous les portails', status: 'info', duration: 3000 });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors du retrait', status: 'error', duration: 3000 });
    } finally {
      setPublishing((prev) => ({ ...prev, [`unpub-${propertyId}`]: false }));
    }
  };

  if (loading) return <Flex justify="center" align="center" minH="60vh"><Spinner size="xl" color="brand.400" /></Flex>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">
          <Icon as={FiShare2} mr={3} color="brand.400" />
          Multi-diffusion
        </Heading>
        {limits?.maxDiffusions && (
          <Badge colorScheme={usage?.diffusions >= limits.maxDiffusions ? 'red' : 'blue'} fontSize="sm" px={3} py={1} borderRadius="full">
            {usage?.diffusions || 0} / {limits.maxDiffusions} diffusions actives
          </Badge>
        )}
      </Flex>

      {/* Statistiques */}
      {stats && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
          <Card bg="white" borderColor="gray.200" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Biens publiés</StatLabel>
                <StatNumber color="gray.800">{stats.totalPublished}</StatNumber>
                <Text fontSize="xs" color="gray.500">sur {stats.totalProperties} biens au total</Text>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="white" borderColor="gray.200" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Portails actifs</StatLabel>
                <StatNumber color="gray.800">{stats.portals?.filter((p) => p.count > 0).length || 0}</StatNumber>
                <Text fontSize="xs" color="gray.500">sur {stats.portals?.length || 0} portails disponibles</Text>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="white" borderColor="gray.200" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Publications totales</StatLabel>
                <StatNumber color="gray.800">{stats.portals?.reduce((sum, p) => sum + p.count, 0) || 0}</StatNumber>
                <Text fontSize="xs" color="gray.500">annonces sur l'ensemble des portails</Text>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Répartition par portail */}
      {stats?.portals && (
        <Card bg="white" borderColor="gray.200" borderWidth="1px" mb={6}>
          <CardBody>
            <Text fontWeight="bold" color="gray.800" mb={3}>Répartition par portail</Text>
            <HStack spacing={4} flexWrap="wrap">
              {stats.portals.map((portal) => (
                <HStack key={portal.portal} bg="gray.50" px={3} py={2} borderRadius="lg" borderLeft="3px solid" borderLeftColor={portal.portalColor}>
                  <Icon as={FiGlobe} color={portal.portalColor} />
                  <Text color="gray.800" fontSize="sm" fontWeight="medium">{portal.portalName}</Text>
                  <Badge colorScheme={portal.count > 0 ? 'green' : 'gray'}>{portal.count}</Badge>
                </HStack>
              ))}
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Tableau des biens */}
      {properties.length === 0 ? (
        <Card bg="white" borderColor="gray.200" borderWidth="1px">
          <CardBody textAlign="center" py={10}>
            <Icon as={FiShare2} boxSize={12} color="gray.600" mb={4} />
            <Text color="gray.400" fontSize="lg">Aucun bien à diffuser</Text>
            <Text color="gray.500" fontSize="sm">Ajoutez des biens depuis la page "Mes Biens" pour commencer la diffusion.</Text>
          </CardBody>
        </Card>
      ) : (
        <Card bg="white" borderColor="gray.200" borderWidth="1px" overflow="hidden">
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color="gray.400" borderColor="gray.300">Bien</Th>
                  {properties[0]?.diffusions?.map((d) => (
                    <Th key={d.portal} color="gray.400" borderColor="gray.300" textAlign="center" fontSize="xs">
                      {d.portalName}
                    </Th>
                  ))}
                  <Th color="gray.400" borderColor="gray.300" textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {properties.map((property) => (
                  <Tr key={property.id} _hover={{ bg: 'gray.100' }}>
                    <Td borderColor="gray.300" maxW="250px">
                      <HStack spacing={3}>
                        {property.imageUrl && (
                          <Image src={property.imageUrl} alt="" boxSize="40px" borderRadius="md" objectFit="cover" />
                        )}
                        <Box>
                          <Text color="gray.800" fontSize="sm" fontWeight="medium" noOfLines={1}>{property.address}</Text>
                          <Text color="gray.400" fontSize="xs">
                            {property.city} · {property.price?.toLocaleString('fr-FR')} € · {property.area} m²
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    {property.diffusions.map((diff) => {
                      const cfg = STATUS_CONFIG[diff.status];
                      const key = `${property.id}-${diff.portal}`;
                      return (
                        <Td key={diff.portal} borderColor="gray.300" textAlign="center">
                          <Tooltip label={`${diff.portalName}: ${cfg.label}${diff.publishedAt ? ` (${new Date(diff.publishedAt).toLocaleDateString('fr-FR')})` : ''}`}>
                            <Box display="inline-block">
                              <Switch
                                size="sm"
                                colorScheme="green"
                                isChecked={diff.status === 'PUBLISHED'}
                                isDisabled={publishing[key]}
                                onChange={() => handleTogglePortal(property.id, diff.portal, diff.status)}
                              />
                            </Box>
                          </Tooltip>
                        </Td>
                      );
                    })}
                    <Td borderColor="gray.300" textAlign="center">
                      <HStack spacing={1} justify="center">
                        <Tooltip label="Publier partout">
                          <IconButton
                            icon={<FiZap />}
                            size="xs"
                            colorScheme="green"
                            variant="ghost"
                            isLoading={publishing[property.id]}
                            onClick={() => handlePublishAll(property.id)}
                            aria-label="Publier partout"
                          />
                        </Tooltip>
                        <Tooltip label="Tout retirer">
                          <IconButton
                            icon={<FiX />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            isLoading={publishing[`unpub-${property.id}`]}
                            onClick={() => handleUnpublishAll(property.id)}
                            aria-label="Tout retirer"
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}
    </Box>
  );
}
