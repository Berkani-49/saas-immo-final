// Fichier : src/Sidebar.jsx (Version avec verrous plan et badges PRO/PREMIUM)

import React, { useState } from 'react';
import { Box, VStack, Button, Heading, Spacer, CloseButton, Flex, Icon, Text, Divider, Collapse, Badge, useDisclosure } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { usePlan } from './contexts/PlanContext';
import UpgradeModal from './components/UpgradeModal';

import {
  FiHome,
  FiList,
  FiUsers,
  FiCheckSquare,
  FiLogOut,
  FiFileText,
  FiActivity,
  FiBriefcase,
  FiCreditCard,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiShield,
  FiBarChart2,
  FiBell,
  FiLock
} from 'react-icons/fi';

// Navigation organisée par sections avec plan requis
const navSections = [
  {
    title: 'Principal',
    items: [
      { name: 'Accueil', icon: FiHome, path: '/' },
      { name: 'Mes Biens', icon: FiList, path: '/biens' },
      { name: 'Mes Contacts', icon: FiUsers, path: '/contacts' },
      { name: 'Mes Tâches', icon: FiCheckSquare, path: '/taches' },
      { name: 'Rendez-vous', icon: FiCalendar, path: '/rendez-vous' },
    ],
    defaultOpen: true
  },
  {
    title: 'Gestion',
    items: [
      { name: 'Factures', icon: FiFileText, path: '/factures', requiredPlan: 'pro' },
      { name: 'Activité', icon: FiActivity, path: '/activites', requiredPlan: 'pro' },
      { name: 'Mon Équipe', icon: FiBriefcase, path: '/equipe', requiredPlan: 'pro' },
    ],
    defaultOpen: false
  },
  {
    title: 'Outils',
    items: [
      { name: 'Analytics', icon: FiBarChart2, path: '/analytics', requiredPlan: 'pro' },
      { name: 'Notifications', icon: FiBell, path: '/notifications', requiredPlan: 'pro' },
      { name: 'Abonnement', icon: FiCreditCard, path: '/abonnement' },
      { name: 'RGPD', icon: FiShield, path: '/rgpd' },
    ],
    defaultOpen: false
  }
];

export default function Sidebar({ onLogout, onClose }) {
  const { hasPlan } = usePlan();
  const { isOpen: isUpgradeOpen, onOpen: onUpgradeOpen, onClose: onUpgradeClose } = useDisclosure();
  const [upgradeTarget, setUpgradeTarget] = useState({ requiredPlan: 'pro', featureName: '' });

  // État pour gérer l'ouverture/fermeture des sections
  const [openSections, setOpenSections] = useState(
    navSections.reduce((acc, section) => {
      acc[section.title] = section.defaultOpen;
      return acc;
    }, {})
  );

  const toggleSection = (title) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLockedClick = (item) => {
    setUpgradeTarget({ requiredPlan: item.requiredPlan, featureName: item.name });
    onUpgradeOpen();
  };

  const NavItem = ({ icon, children, to, locked, requiredPlan: itemPlan, itemName, ...rest }) => {
    if (locked) {
      return (
        <Flex
          align="center"
          p="3"
          mx="3"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          color="gray.500"
          _hover={{ bg: 'whiteAlpha.50' }}
          transition="all 0.2s"
          onClick={() => handleLockedClick({ requiredPlan: itemPlan, name: itemName })}
          {...rest}
        >
          {icon && (
            <Icon mr="3" fontSize="16" as={icon} color="gray.600" />
          )}
          <Text fontSize="sm" fontWeight="medium" flex={1}>{children}</Text>
          <Badge
            colorScheme={itemPlan === 'premium' ? 'purple' : 'blue'}
            fontSize="2xs"
            variant="subtle"
            mr={1}
          >
            {itemPlan === 'premium' ? 'PREMIUM' : 'PRO'}
          </Badge>
          <Icon as={FiLock} fontSize="12" color="gray.600" />
        </Flex>
      );
    }

    return (
      <RouterNavLink to={to} onClick={onClose} style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <Flex
            align="center"
            p="3"
            mx="3"
            borderRadius="lg"
            role="group"
            cursor="pointer"
            bg={isActive ? 'brand.500' : 'transparent'}
            color={isActive ? 'white' : 'gray.300'}
            _hover={{
              bg: isActive ? 'brand.600' : 'whiteAlpha.100',
              color: 'white',
            }}
            transition="all 0.2s"
            {...rest}
          >
            {icon && (
              <Icon
                mr="3"
                fontSize="16"
                as={icon}
                color={isActive ? 'white' : 'gray.400'}
                _groupHover={{ color: 'white' }}
              />
            )}
            <Text fontSize="sm" fontWeight="medium">{children}</Text>
          </Flex>
        )}
      </RouterNavLink>
    );
  };

  const SectionHeader = ({ title, isOpen, onToggle }) => (
    <Flex
      align="center"
      justify="space-between"
      px="4"
      py="2"
      cursor="pointer"
      onClick={onToggle}
      _hover={{ bg: 'whiteAlpha.100' }}
      borderRadius="md"
      mx="2"
      mt="2"
    >
      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        {title}
      </Text>
      <Icon
        as={isOpen ? FiChevronDown : FiChevronRight}
        color="gray.500"
        w={3}
        h={3}
      />
    </Flex>
  );

  return (
    <Box
      bg="gray.800"
      color="gray.100"
      h="100vh"
      w="100%"
      pos="relative"
      display="flex"
      flexDirection="column"
      borderRight="1px"
      borderRightColor="gray.700"
    >
      {/* Partie scrollable */}
      <Box flex="1" overflowY="auto" pb={32}>
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Heading fontSize="xl" fontWeight="bold" letterSpacing="tight" color="white">
            IMMO<Text as="span" color="brand.400">FLOW</Text>
          </Heading>
          {onClose && <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} color="gray.400" />}
        </Flex>

        <Divider borderColor="gray.700" mb={2} />

        <VStack align="stretch" spacing={0}>
          {navSections.map((section) => (
            <Box key={section.title}>
              <SectionHeader
                title={section.title}
                isOpen={openSections[section.title]}
                onToggle={() => toggleSection(section.title)}
              />
              <Collapse in={openSections[section.title]} animateOpacity>
                <VStack align="stretch" spacing={0} pb={2}>
                  {section.items.map((link) => {
                    const isLocked = link.requiredPlan && !hasPlan(link.requiredPlan);
                    return (
                      <NavItem
                        key={link.name}
                        icon={link.icon}
                        to={link.path}
                        locked={isLocked}
                        requiredPlan={link.requiredPlan}
                        itemName={link.name}
                      >
                        {link.name}
                      </NavItem>
                    );
                  })}
                </VStack>
              </Collapse>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Boutons fixes en bas */}
      <Box
        position="sticky"
        bottom="0"
        p={6}
        bg="gray.800"
        borderTop="1px"
        borderTopColor="gray.700"
      >
        <Button
          onClick={onLogout}
          width="full"
          variant="outline"
          colorScheme="red"
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{ bg: 'red.500', color: 'white', borderColor: 'red.500' }}
        >
          Déconnexion
        </Button>
      </Box>

      {/* Modal d'upgrade */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={onUpgradeClose}
        requiredPlan={upgradeTarget.requiredPlan}
        featureName={upgradeTarget.featureName}
      />
    </Box>
  );
}
