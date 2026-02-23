// Fichier : src/Sidebar.jsx (Version Light Mode - Style Agence Immobilière)

import React, { useState, useEffect } from 'react';
import { Box, VStack, Button, Heading, Spacer, CloseButton, Flex, Icon, Text, Divider, Collapse, Badge, useDisclosure } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { usePlan } from './contexts/PlanContext';
import { useAgency } from './contexts/AgencyContext';
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
  FiLock,
  FiShare2,
  FiEdit3,
  FiUser,
  FiHelpCircle
} from 'react-icons/fi';
import SearchBar from './components/SearchBar';

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
    title: 'Publication',
    items: [
      { name: 'Multi-diffusion', icon: FiShare2, path: '/diffusion', requiredPlan: 'pro' },
      { name: 'Signatures', icon: FiEdit3, path: '/signatures', requiredPlan: 'pro' },
    ],
    defaultOpen: false
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
      { name: 'Mon Profil', icon: FiUser, path: '/profil' },
      { name: 'Aide', icon: FiHelpCircle, path: '/aide' },
      { name: 'RGPD', icon: FiShield, path: '/rgpd' },
    ],
    defaultOpen: false
  }
];

export default function Sidebar({ onLogout, onClose, token }) {
  const { hasPlan } = usePlan();
  const { agency } = useAgency();
  const { isOpen: isUpgradeOpen, onOpen: onUpgradeOpen, onClose: onUpgradeClose } = useDisclosure();
  const [upgradeTarget, setUpgradeTarget] = useState({ requiredPlan: 'pro', featureName: '' });
  const [notifCount, setNotifCount] = useState(0);

  // Polling notifications non lues
  useEffect(() => {
    if (!token || !hasPlan('pro')) return;
    const API = import.meta.env.VITE_API_URL || 'https://saas-immo.onrender.com';
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setNotifCount(data.count || 0);
      } catch (e) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [token]);

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

  const NavItem = ({ icon, children, to, locked, requiredPlan: itemPlan, itemName, badge: badgeCount, ...rest }) => {
    if (locked) {
      return (
        <Flex
          align="center"
          p="3"
          mx="3"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          color="gray.400"
          _hover={{ bg: 'gray.100' }}
          transition="all 0.2s"
          onClick={() => handleLockedClick({ requiredPlan: itemPlan, name: itemName })}
          {...rest}
        >
          {icon && (
            <Icon mr="3" fontSize="16" as={icon} color="gray.400" />
          )}
          <Text fontSize="sm" fontWeight="medium" flex={1} color="gray.400">{children}</Text>
          <Badge
            colorScheme={itemPlan === 'premium' ? 'purple' : 'blue'}
            fontSize="2xs"
            variant="subtle"
            mr={1}
          >
            {itemPlan === 'premium' ? 'PREMIUM' : 'PRO'}
          </Badge>
          <Icon as={FiLock} fontSize="12" color="gray.400" />
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
            bg={isActive ? 'brand.50' : 'transparent'}
            color={isActive ? 'brand.600' : 'gray.600'}
            borderLeft={isActive ? '3px solid' : '3px solid transparent'}
            borderLeftColor={isActive ? 'brand.500' : 'transparent'}
            _hover={{
              bg: isActive ? 'brand.50' : 'gray.100',
              color: isActive ? 'brand.600' : 'gray.800',
            }}
            transition="all 0.2s"
            {...rest}
          >
            {icon && (
              <Icon
                mr="3"
                fontSize="16"
                as={icon}
                color={isActive ? 'brand.500' : 'gray.400'}
                _groupHover={{ color: isActive ? 'brand.500' : 'gray.600' }}
              />
            )}
            <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'} flex="1" color="inherit">{children}</Text>
            {badgeCount > 0 && (
              <Badge colorScheme="red" borderRadius="full" fontSize="2xs" minW="18px" textAlign="center">
                {badgeCount}
              </Badge>
            )}
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
      _hover={{ bg: 'gray.100' }}
      borderRadius="md"
      mx="2"
      mt="2"
    >
      <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="widest">
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
      bg="white"
      color="gray.700"
      h="100vh"
      w="100%"
      pos="relative"
      display="flex"
      flexDirection="column"
      borderRight="1px solid"
      borderRightColor="gray.200"
      boxShadow="sm"
    >
      {/* Partie scrollable */}
      <Box flex="1" overflowY="auto" pb={32}>
        {/* Logo / Nom agence */}
        <Flex
          h="20"
          alignItems="center"
          px={6}
          justifyContent="space-between"
          borderBottom="1px solid"
          borderBottomColor="gray.100"
        >
          {agency ? (
            <Heading fontSize="lg" fontWeight="bold" letterSpacing="tight" color="gray.800" noOfLines={1}>
              {agency.logoUrl ? (
                <img src={agency.logoUrl} alt={agency.name} style={{ maxHeight: '32px' }} />
              ) : (
                agency.name
              )}
            </Heading>
          ) : (
            <Heading fontSize="xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
              IMMO<Text as="span" color="brand.500">FLOW</Text>
            </Heading>
          )}
          {onClose && <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} color="gray.500" />}
        </Flex>

        <Divider borderColor="gray.100" mb={2} />

        {/* Barre de recherche */}
        {token && <SearchBar token={token} />}

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
                    const badgeCount = link.name === 'Notifications' ? notifCount : 0;
                    return (
                      <NavItem
                        key={link.name}
                        icon={link.icon}
                        to={link.path}
                        locked={isLocked}
                        requiredPlan={link.requiredPlan}
                        itemName={link.name}
                        badge={badgeCount}
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

      {/* Bouton déconnexion fixe en bas */}
      <Box
        position="sticky"
        bottom="0"
        p={4}
        bg="white"
        borderTop="1px solid"
        borderTopColor="gray.100"
      >
        <Button
          onClick={onLogout}
          width="full"
          variant="ghost"
          color="gray.500"
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{ bg: 'red.50', color: 'red.500' }}
          fontSize="sm"
          fontWeight="medium"
          borderRadius="lg"
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
