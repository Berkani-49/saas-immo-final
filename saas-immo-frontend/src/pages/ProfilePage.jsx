import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Text, VStack, HStack, FormControl, FormLabel, Input, Button,
  Card, CardHeader, CardBody, Alert, AlertIcon, useToast, Icon, Badge, Divider,
  List, ListItem, ListIcon
} from '@chakra-ui/react';
import { FiUser, FiLock, FiMail, FiCheck, FiX, FiBriefcase, FiCalendar } from 'react-icons/fi';
import { API_URL } from '../config';
import { usePlan } from '../contexts/PlanContext';

export default function ProfilePage({ token }) {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const { plan } = usePlan();
  const toast = useToast();

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/me`, config);
        setUser(res.data);
        setFirstName(res.data.firstName);
        setLastName(res.data.lastName);
        setEmail(res.data.email);
      } catch (err) {
        toast({ title: 'Erreur', description: 'Impossible de charger le profil.', status: 'error' });
      }
    };
    fetchUser();
  }, [token]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/me`, { firstName, lastName, email }, config);
      setUser(res.data);
      toast({ title: 'Profil mis à jour', status: 'success', duration: 3000 });
    } catch (err) {
      toast({ title: 'Erreur', description: err.response?.data?.error || 'Erreur serveur.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const passwordChecks = [
    { label: '12 caractères minimum', valid: newPassword.length >= 12 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(newPassword) },
    { label: 'Une minuscule', valid: /[a-z]/.test(newPassword) },
    { label: 'Un chiffre', valid: /\d/.test(newPassword) },
    { label: 'Un caractère spécial (@$!%*?&)', valid: /[@$!%*?&]/.test(newPassword) },
  ];

  const isPasswordValid = passwordChecks.every(c => c.valid);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async () => {
    if (!isPasswordValid || !passwordsMatch) return;
    setIsChangingPwd(true);
    try {
      await axios.put(`${API_URL}/api/me/password`, { currentPassword, newPassword }, config);
      toast({ title: 'Mot de passe modifié', status: 'success', duration: 3000 });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({ title: 'Erreur', description: err.response?.data?.error || 'Erreur serveur.', status: 'error' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <HStack mb={2}>
            <Icon as={FiUser} boxSize={6} color="brand.400" />
            <Heading size="lg" color="gray.800">Mon Profil</Heading>
          </HStack>
          <Text color="gray.400">Gérez vos informations personnelles et votre mot de passe.</Text>
        </Box>

        {/* Infos personnelles */}
        <Card bg="white" borderColor="gray.200" borderWidth="1px">
          <CardHeader pb={2}>
            <HStack>
              <Icon as={FiUser} color="brand.400" />
              <Heading size="md" color="gray.800">Informations personnelles</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} flexDir={{ base: 'column', md: 'row' }}>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Prénom</FormLabel>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} bg="gray.50" borderColor="gray.300" color="gray.800" />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.400" fontSize="sm">Nom</FormLabel>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} bg="gray.50" borderColor="gray.300" color="gray.800" />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} bg="gray.50" borderColor="gray.300" color="gray.800" />
              </FormControl>

              {user && (
                <HStack spacing={4} flexWrap="wrap">
                  <Badge colorScheme={user.role === 'OWNER' ? 'green' : 'blue'}>{user.role}</Badge>
                  {user.agency && <Badge colorScheme="purple">{user.agency.name}</Badge>}
                  <HStack spacing={1} color="gray.500" fontSize="xs">
                    <Icon as={FiCalendar} />
                    <Text>Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</Text>
                  </HStack>
                </HStack>
              )}

              <Button colorScheme="blue" onClick={handleSaveProfile} isLoading={isSaving} alignSelf="flex-start">
                Enregistrer
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Changement de mot de passe */}
        <Card bg="white" borderColor="gray.200" borderWidth="1px">
          <CardHeader pb={2}>
            <HStack>
              <Icon as={FiLock} color="brand.400" />
              <Heading size="md" color="gray.800">Changer le mot de passe</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Mot de passe actuel</FormLabel>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} bg="gray.50" borderColor="gray.300" color="gray.800" />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Nouveau mot de passe</FormLabel>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} bg="gray.50" borderColor="gray.300" color="gray.800" />
              </FormControl>

              {newPassword.length > 0 && (
                <List spacing={1} fontSize="xs">
                  {passwordChecks.map((check, i) => (
                    <ListItem key={i} color={check.valid ? 'green.400' : 'gray.500'}>
                      <ListIcon as={check.valid ? FiCheck : FiX} color={check.valid ? 'green.400' : 'red.400'} />
                      {check.label}
                    </ListItem>
                  ))}
                </List>
              )}

              <FormControl>
                <FormLabel color="gray.400" fontSize="sm">Confirmer le mot de passe</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  bg="gray.50"
                  borderColor={confirmPassword.length > 0 ? (passwordsMatch ? 'green.500' : 'red.500') : 'gray.600'}
                  color="gray.800"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleChangePassword}
                isLoading={isChangingPwd}
                isDisabled={!isPasswordValid || !passwordsMatch || !currentPassword}
                alignSelf="flex-start"
              >
                Modifier le mot de passe
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Plan actuel */}
        <Card bg="white" borderColor="gray.200" borderWidth="1px">
          <CardHeader pb={2}>
            <HStack>
              <Icon as={FiBriefcase} color="brand.400" />
              <Heading size="md" color="gray.800">Plan actuel</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <HStack>
              <Badge colorScheme={plan === 'premium' ? 'purple' : plan === 'pro' ? 'blue' : 'gray'} fontSize="md" px={3} py={1}>
                {(plan || 'free').toUpperCase()}
              </Badge>
              <Button as="a" href="/abonnement" size="sm" variant="outline" colorScheme="blue">
                Gérer l'abonnement
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
