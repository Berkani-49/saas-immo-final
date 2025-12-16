// Fichier : src/Sidebar.jsx (Version Optimisée Mobile avec sections et Dark Mode)

import React, { useState } from 'react';
import { Box, VStack, Button, Heading, Spacer, CloseButton, Flex, Icon, Text, Divider, Collapse } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';

// UNE SEULE ligne d'import pour toutes les icônes (nettoyée)
import {
  FiHome,
  FiList,
  FiUsers,
  FiCheckSquare,
  FiTrendingUp,
  FiLogOut,
  FiFileText,
  FiActivity,
  FiBriefcase,
  FiCreditCard,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiShield,
  FiBarChart2
} from 'react-icons/fi';

// Navigation organisée par sections (repliables sur mobile)
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
      { name: 'Factures', icon: FiFileText, path: '/factures' },
      { name: 'Activité', icon: FiActivity, path: '/activites' },
      { name: 'Mon Équipe', icon: FiBriefcase, path: '/equipe' },
    ],
    defaultOpen: false
  },
  {
    title: 'Outils',
    items: [
      { name: 'Estimer', icon: FiTrendingUp, path: '/estimate' },
      { name: 'Analytics', icon: FiBarChart2, path: '/analytics' },
      { name: 'Abonnement', icon: FiCreditCard, path: '/abonnement' },
      { name: 'RGPD', icon: FiShield, path: '/rgpd' },
    ],
    defaultOpen: false
  }
];

export default function Sidebar({ onLogout, onClose }) {

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

  const NavItem = ({ icon, children, to, ...rest }) => (
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
          color={isActive ? 'white' : 'gray.200'}
          _hover={{
            bg: isActive ? 'brand.600' : 'whiteAlpha.200',
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
              color={isActive ? 'white' : 'gray.300'}
              _groupHover={{ color: 'white' }}
            />
          )}
          <Text fontSize="sm" fontWeight="medium">{children}</Text>
        </Flex>
      )}
    </RouterNavLink>
  );

  const SectionHeader = ({ title, isOpen, onToggle }) => (
    <Flex
      align="center"
      justify="space-between"
      px="4"
      py="2"
      cursor="pointer"
      onClick={onToggle}
      _hover={{ bg: 'whiteAlpha.200' }}
      borderRadius="md"
      mx="2"
      mt="2"
    >
      <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
        {title}
      </Text>
      <Icon
        as={isOpen ? FiChevronDown : FiChevronRight}
        color="gray.400"
        w={3}
        h={3}
      />
    </Flex>
  );

  return (
    <Box
      bg="brand.900"
      color="white"
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
          <Heading fontSize="xl" fontWeight="bold" letterSpacing="tight">
            IMMO<Text as="span" color="brand.500">PRO</Text>
          </Heading>
          {onClose && <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />}
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
                  {section.items.map((link) => (
                    <NavItem key={link.name} icon={link.icon} to={link.path}>
                      {link.name}
                    </NavItem>
                  ))}
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
        bg="brand.900"
        borderTop="1px"
        borderTopColor="gray.800"
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
    </Box>
  );
}