import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Heading, Text, Button, Flex, Card, CardBody, VStack, HStack,
  Spinner, Icon, Checkbox, useToast, Badge, Alert, AlertIcon
} from '@chakra-ui/react';
import { FiEdit3, FiCheck, FiRefreshCw, FiFileText, FiUser, FiHome } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from '../config';

export default function PublicSignPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState(null);
  const [error, setError] = useState('');
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const toast = useToast();

  useEffect(() => {
    fetchDocument();
  }, [token]);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/public/sign/${token}`);
      if (res.data.alreadySigned) {
        setAlreadySigned(true);
        setDocData(res.data.document);
      } else {
        setDocData(res.data.document);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Document non trouvé ou lien invalide');
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing logic
  const initCanvas = useCallback((canvas) => {
    if (!canvas) return;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = (e) => {
    e.preventDefault();
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    if (!hasDrawn) {
      toast({ title: 'Signature requise', description: 'Veuillez dessiner votre signature', status: 'warning', duration: 3000 });
      return;
    }
    if (!accepted) {
      toast({ title: 'Acceptation requise', description: 'Veuillez accepter les conditions', status: 'warning', duration: 3000 });
      return;
    }

    setSigning(true);
    try {
      const signatureData = canvasRef.current.toDataURL('image/png');
      await axios.post(`${API_URL}/api/public/sign/${token}`, { signatureData });
      setSuccess(true);
      toast({ title: 'Document signé !', description: 'Votre signature a été enregistrée avec succès.', status: 'success', duration: 5000 });
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la signature';
      toast({ title: 'Erreur', description: msg, status: 'error', duration: 4000 });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="gray.50">
        <Spinner size="xl" color="purple.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="gray.50" p={4}>
        <Card maxW="500px" w="full" shadow="lg">
          <CardBody textAlign="center" py={10}>
            <Icon as={FiFileText} boxSize={12} color="red.400" mb={4} />
            <Heading size="md" mb={2} color="gray.800">Lien invalide</Heading>
            <Text color="gray.600">{error}</Text>
          </CardBody>
        </Card>
      </Flex>
    );
  }

  if (alreadySigned) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="gray.50" p={4}>
        <Card maxW="500px" w="full" shadow="lg">
          <CardBody textAlign="center" py={10}>
            <Icon as={FiCheck} boxSize={12} color="green.400" mb={4} />
            <Heading size="md" mb={2} color="gray.800">Document déjà signé</Heading>
            <Text color="gray.600">
              Ce document a été signé par {docData?.signerName}.
            </Text>
          </CardBody>
        </Card>
      </Flex>
    );
  }

  if (success) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="gray.50" p={4}>
        <Card maxW="500px" w="full" shadow="lg">
          <CardBody textAlign="center" py={10}>
            <Box bg="green.100" borderRadius="full" w="80px" h="80px" display="flex" alignItems="center" justifyContent="center" mx="auto" mb={4}>
              <Icon as={FiCheck} boxSize={10} color="green.500" />
            </Box>
            <Heading size="md" mb={2} color="gray.800">Signature enregistrée !</Heading>
            <Text color="gray.600" mb={4}>
              Merci {docData?.signerName}, votre signature a été enregistrée avec succès. L'agent immobilier sera notifié.
            </Text>
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>Document signé</Badge>
          </CardBody>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex justify="center" minH="100vh" bg="gray.50" p={4} pt={8}>
      <Box maxW="600px" w="full">
        {/* En-tête */}
        <VStack spacing={2} mb={6} textAlign="center">
          <Heading size="lg" color="purple.600">
            <Icon as={FiEdit3} mr={2} />
            Signature électronique
          </Heading>
          <Text color="gray.500">Veuillez lire et signer le document ci-dessous</Text>
        </VStack>

        {/* Infos document */}
        <Card shadow="md" mb={6}>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack>
                <Icon as={FiFileText} color="purple.500" />
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.500">Document</Text>
                  <Text fontWeight="bold" color="gray.800">{docData?.title}</Text>
                </Box>
                <Badge colorScheme="purple">{docData?.typeName}</Badge>
              </HStack>

              <HStack>
                <Icon as={FiUser} color="blue.500" />
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.500">Agent immobilier</Text>
                  <Text fontWeight="medium" color="gray.700">{docData?.agentName}</Text>
                </Box>
              </HStack>

              {docData?.property && (
                <HStack>
                  <Icon as={FiHome} color="green.500" />
                  <Box flex={1}>
                    <Text fontSize="xs" color="gray.500">Bien immobilier</Text>
                    <Text fontWeight="medium" color="gray.700">
                      {docData.property.address}, {docData.property.city}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {docData.property.price?.toLocaleString('fr-FR')} € · {docData.property.area} m² · {docData.property.rooms} pièces
                    </Text>
                  </Box>
                </HStack>
              )}

              <HStack>
                <Icon as={FiUser} color="orange.500" />
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.500">Signataire</Text>
                  <Text fontWeight="medium" color="gray.700">{docData?.signerName}</Text>
                </Box>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Zone de signature */}
        <Card shadow="md" mb={6}>
          <CardBody>
            <Text fontWeight="bold" color="gray.800" mb={3}>Votre signature</Text>
            <Text fontSize="sm" color="gray.500" mb={3}>
              Dessinez votre signature dans le cadre ci-dessous à l'aide de votre souris ou de votre doigt.
            </Text>
            <Box
              border="2px dashed"
              borderColor={hasDrawn ? 'purple.300' : 'gray.300'}
              borderRadius="lg"
              bg="white"
              position="relative"
              mb={3}
            >
              <canvas
                ref={initCanvas}
                style={{
                  width: '100%',
                  height: '200px',
                  cursor: 'crosshair',
                  touchAction: 'none',
                  display: 'block',
                }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasDrawn && (
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  color="gray.400"
                  fontSize="sm"
                  pointerEvents="none"
                >
                  Dessinez ici votre signature
                </Text>
              )}
            </Box>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={clearCanvas}
              colorScheme="gray"
            >
              Effacer
            </Button>
          </CardBody>
        </Card>

        {/* Acceptation et validation */}
        <Card shadow="md" mb={6}>
          <CardBody>
            <Checkbox
              isChecked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              colorScheme="purple"
              mb={4}
            >
              <Text fontSize="sm" color="gray.700">
                J'ai lu le document et j'accepte de le signer électroniquement. Je comprends que cette signature a la même valeur qu'une signature manuscrite.
              </Text>
            </Checkbox>

            <Button
              colorScheme="purple"
              size="lg"
              width="full"
              leftIcon={<FiCheck />}
              isDisabled={!hasDrawn || !accepted}
              isLoading={signing}
              loadingText="Signature en cours..."
              onClick={handleSign}
            >
              Signer le document
            </Button>
          </CardBody>
        </Card>

        {/* Note légale */}
        <Alert status="info" borderRadius="md" mb={8}>
          <AlertIcon />
          <Text fontSize="xs" color="gray.600">
            Votre signature sera horodatée et associée à votre adresse IP pour des raisons de traçabilité.
            Le document signé sera disponible en téléchargement par l'agent immobilier.
          </Text>
        </Alert>
      </Box>
    </Flex>
  );
}
