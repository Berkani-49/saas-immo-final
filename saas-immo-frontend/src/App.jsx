// Fichier: src/App.jsx (Version Design Réparé - Fond Blanc & Large)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './Dashboard.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import PropertyDetail from './pages/PropertyDetail.jsx';
import ContactDetail from './pages/ContactDetail.jsx';
import SecretRegister from './pages/SecretRegister.jsx';
import PriceEstimator from './PriceEstimator.jsx';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, Spinner, Center, Container } from '@chakra-ui/react';
import { AlertIcon } from '@chakra-ui/icons';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);
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
      // Connexion au serveur Render
      const response = await axios.post('https://saas-immo-complet.onrender.com/api/auth/login', { email, password });
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
    // 1. LE CONTENEUR PRINCIPAL (La mise en page)
    <Box minH="100vh" bg="gray.50" py={10} px={4}> {/* py=padding vertical, px=padding horizontal */}
      
      <Box 
        maxWidth="1200px"     /* Largeur demandée */
        margin="0 auto"       /* Centré */
        bg="white"            /* Fond BLANC (pour voir le texte) */
        borderRadius="xl"     /* Coins arrondis */
        boxShadow="xl"        /* Belle ombre */
        borderWidth="1px"
        borderColor="gray.200"
        p={[4, 8]}            /* Espace intérieur (petit sur mobile, grand sur ordi) */
        minH="80vh"           /* Hauteur minimum pour que ça fasse "pro" */
      >
        
        <Routes>
          {/* ROUTE D'ACCUEIL (Dashboard ou Login) */}
          <Route path="/" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : (
            <Center h="60vh">
              <Box w="100%" maxWidth="400px">
                <Heading as="h2" size="xl" mb={8} textAlign="center" color="blue.600">
                  Connexion Agence
                </Heading>
                <form onSubmit={handleLogin}>
                  <FormControl id="email-login" mb={4} isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      size="lg" 
                      bg="gray.50"
                    />
                  </FormControl>
                  <FormControl id="password-login" mb={6} isRequired>
                    <FormLabel>Mot de passe</FormLabel>
                    <Input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      size="lg"
                      bg="gray.50"
                    />
                  </FormControl>
                  {message && (
                    <Alert status="error" mb={4} borderRadius="md">
                      <AlertIcon />{message}
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    colorScheme="blue" 
                    size="lg" 
                    width="full" 
                    isLoading={isLoggingIn}
                    loadingText="Connexion..."
                  >
                    Se connecter
                  </Button>
                </form>
              </Box>
            </Center>
          )} />
          
          {/* AUTRES ROUTES */}
          <Route path="/property/:propertyId" element={token ? <PropertyDetail token={token} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/contact/:contactId" element={token ? <ContactDetail token={token} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/estimate" element={token ? <PriceEstimator token={token} /> : <Navigate to="/" />} />
          <Route path="/nouveau-membre-agence" element={<SecretRegister />} />
        </Routes>

      </Box>
    </Box>
  );
}