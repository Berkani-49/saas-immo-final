// Fichier: src/App.jsx (Version Plein Écran - Layout corrigé)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import du Layout
import Layout from './Layout.jsx'; 

// Import des Pages
import HomePage from './pages/HomePage.jsx';
import Dashboard from './Dashboard.jsx';
import ContactsPage from './pages/ContactsPage.jsx'; 
import TachesPage from './pages/TachesPage.jsx';
import PublicPropertyPage from './pages/PublicPropertyPage.jsx';

import PropertyDetail from './pages/PropertyDetail.jsx';
import ContactDetail from './pages/ContactDetail.jsx';
import SecretRegister from './pages/SecretRegister.jsx';
import PriceEstimator from './PriceEstimator.jsx';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, Spinner, Center } from '@chakra-ui/react';
import { AlertIcon } from '@chakra-ui/icons';

export default function App() {
  const [token, setToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) { setToken(storedToken); }
    setIsLoadingToken(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoggingIn(true);
    try {
      const response = await axios.post('https://api-immo-final.onrender.com/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
    } catch (error) {
      setMessage('Email ou mot de passe incorrect.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); };

  if (isLoadingToken) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;

  return (
    // J'ai enlevé le "maxWidth" et les "margins". Maintenant ça prend tout l'écran.
    <Box minH="100vh" bg="gray.50"> 
      <Routes>
        
        {/* 1. ROUTE PUBLIQUE */}
        <Route path="/share/:id" element={<PublicPropertyPage />} />

        {/* 2. ROUTE SECRÈTE */}
        <Route path="/nouveau-membre-agence" element={<SecretRegister />} />

        {/* 3. ROUTES PRIVÉES (Avec Sidebar) */}
        {token ? (
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            <Route index element={<HomePage token={token} />} />
            <Route path="biens" element={<Dashboard token={token} />} />
            <Route path="contacts" element={<ContactsPage token={token} />} /> 
            <Route path="taches" element={<TachesPage token={token} />} />
            <Route path="estimate" element={<PriceEstimator token={token} />} />
            
            <Route path="property/:propertyId" element={<PropertyDetail token={token} />} />
            <Route path="contact/:contactId" element={<ContactDetail token={token} />} />
          </Route>
        ) : (
          // PAGE DE CONNEXION (Elle reste centrée grâce au composant Center)
          <Route path="/" element={
            <Center h="100vh">
              <Box p={8} maxWidth="400px" w="100%" borderWidth={1} borderRadius="lg" boxShadow="xl" bg="white">
                <Heading as="h2" size="lg" mb={6} textAlign="center">Connexion Agence</Heading>
                <form onSubmit={handleLogin}>
                  <FormControl id="email-login" mb={4} isRequired><FormLabel>Email</FormLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormControl>
                  <FormControl id="password-login" mb={6} isRequired><FormLabel>Mot de passe</FormLabel><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></FormControl>
                  {message && <Alert status="error" mb={4} borderRadius="md"><AlertIcon />{message}</Alert>}
                  <Button type="submit" colorScheme="blue" width="full" isLoading={isLoggingIn}>Se connecter</Button>
                </form>
              </Box>
            </Center>
          } />
        )}

        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </Box>
  );
}