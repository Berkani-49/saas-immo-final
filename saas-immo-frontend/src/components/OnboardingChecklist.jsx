import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Progress, Badge, Collapse, IconButton
} from '@chakra-ui/react';
import { FiCheck, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_STEPS = [
  { key: 'property', label: 'Ajouter votre premier bien', path: '/biens', checkFn: (stats) => stats.properties > 0 },
  { key: 'contact', label: 'Ajouter un contact', path: '/contacts', checkFn: (stats) => stats.contacts > 0 },
  { key: 'task', label: 'Créer une tâche', path: '/taches', checkFn: (stats) => stats.tasks > 0 },
  { key: 'profile', label: 'Compléter votre profil', path: '/profil', checkFn: () => localStorage.getItem('onboarding_profile') === 'true' },
];

export default function OnboardingChecklist({ stats }) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('onboarding_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  if (dismissed) return null;

  const completedSteps = ONBOARDING_STEPS.filter(step => step.checkFn(stats || {}));
  const progress = (completedSteps.length / ONBOARDING_STEPS.length) * 100;
  const allDone = completedSteps.length === ONBOARDING_STEPS.length;

  if (allDone) {
    // Marquer comme terminé après un délai
    setTimeout(() => {
      localStorage.setItem('onboarding_dismissed', 'true');
      setDismissed(true);
    }, 3000);
  }

  const handleDismiss = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <Box bg="gray.800" borderRadius="lg" borderWidth="1px" borderColor="gray.700" p={4} mb={6}>
      <HStack justify="space-between" mb={collapsed ? 0 : 3}>
        <HStack spacing={3} cursor="pointer" onClick={() => setCollapsed(!collapsed)} flex="1">
          <Text fontWeight="bold" color="white" fontSize="sm">
            {allDone ? 'Bravo, tout est configuré !' : 'Premiers pas'}
          </Text>
          <Badge colorScheme={allDone ? 'green' : 'blue'} fontSize="xs">
            {completedSteps.length}/{ONBOARDING_STEPS.length}
          </Badge>
          <Icon as={collapsed ? FiChevronDown : FiChevronUp} color="gray.500" />
        </HStack>
        <IconButton
          icon={<Icon as={FiX} />}
          size="xs"
          variant="ghost"
          color="gray.500"
          onClick={handleDismiss}
          aria-label="Fermer"
        />
      </HStack>

      <Collapse in={!collapsed} animateOpacity>
        <Progress value={progress} size="xs" colorScheme="blue" borderRadius="full" mb={3} />

        <VStack align="stretch" spacing={2}>
          {ONBOARDING_STEPS.map((step) => {
            const isDone = step.checkFn(stats || {});
            return (
              <HStack
                key={step.key}
                px={3} py={2}
                borderRadius="md"
                bg={isDone ? 'whiteAlpha.50' : 'transparent'}
                cursor={isDone ? 'default' : 'pointer'}
                onClick={() => !isDone && navigate(step.path)}
                _hover={!isDone ? { bg: 'whiteAlpha.100' } : {}}
                transition="all 0.2s"
              >
                <Icon
                  as={FiCheck}
                  color={isDone ? 'green.400' : 'gray.600'}
                  boxSize={4}
                />
                <Text
                  fontSize="sm"
                  color={isDone ? 'gray.500' : 'gray.300'}
                  textDecoration={isDone ? 'line-through' : 'none'}
                >
                  {step.label}
                </Text>
              </HStack>
            );
          })}
        </VStack>
      </Collapse>
    </Box>
  );
}
