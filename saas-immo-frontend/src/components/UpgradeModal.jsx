import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  ModalFooter, Button, Text, VStack, Icon, Badge, HStack
} from '@chakra-ui/react';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ isOpen, onClose, requiredPlan = 'pro', featureName = '' }) {
  const navigate = useNavigate();

  const planLabels = {
    pro: { name: 'Pro', color: 'blue', price: '39' },
    premium: { name: 'Premium', color: 'purple', price: '79' }
  };

  const planInfo = planLabels[requiredPlan] || planLabels.pro;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="white" borderColor="gray.200" borderWidth="1px">
        <ModalHeader>
          <HStack>
            <Icon as={FiLock} color={`${planInfo.color}.400`} />
            <Text>Fonctionnalité verrouillée</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Badge
              colorScheme={planInfo.color}
              fontSize="md"
              px={3}
              py={1}
              alignSelf="center"
              borderRadius="full"
            >
              Plan {planInfo.name} requis
            </Badge>

            <Text color="gray.600" textAlign="center">
              {featureName
                ? `La fonctionnalité "${featureName}" est réservée au plan ${planInfo.name} (${planInfo.price}€/mois) et supérieur.`
                : `Cette fonctionnalité nécessite le plan ${planInfo.name} (${planInfo.price}€/mois) ou supérieur.`
              }
            </Text>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              Passez à un plan supérieur pour débloquer toutes les fonctionnalités avancées et booster votre activité immobilière.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} color="gray.400">
            Plus tard
          </Button>
          <Button
            colorScheme={planInfo.color}
            rightIcon={<Icon as={FiArrowRight} />}
            onClick={() => {
              onClose();
              navigate('/abonnement');
            }}
          >
            Voir les plans
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
