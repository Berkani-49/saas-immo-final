// Fichier: src/App.jsx (Version finale avec TOUS les imports)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './Dashboard.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import PropertyDetail from './pages/PropertyDetail.jsx';
import ContactDetail from './pages/ContactDetail.jsx';
import PriceEstimator from './PriceEstimator.jsx'; // <-- L'IMPORT MANQUANT !

// ---- IMPORTS CHAKRA UI ----
import {
  Box, Heading, FormControl, FormLabel, Input, Button, Alert,
  Spinner, Center
} from '@chakra-ui/react';
import { AlertIcon } from '@chakra-ui/icons';
// ----------------------------

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Vérifie le token au chargement
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoadingToken(false);
  }, []);

  // Fonction de connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoggingIn(true);
    try {
      const response = await axios.post('https://saas-immo.onrender.com/api/auth/login', {
        email: email,
        password: password
      });
      const receivedToken = response.data.token;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
    } catch (error) {
      console.error('Échec de la connexion:', error.response?.data?.error || error.message);
      setMessage(`Erreur : ${error.response?.data?.error || 'Impossible de se connecter.'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setMessage('');
  };

  if (isLoadingToken) {
    return <Center h="100vh"><Spinner size="xl" /></Center>;
  }

  // --- Le Routage ---
  return (
    <Box maxWidth="960px" margin="40px auto" p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
      <Routes>
        {/* Route pour la page d'accueil ("/") */}
        <Route
          path="/"
          element={
            token ? (
              <Dashboard token={token} onLogout={handleLogout} />
            ) : (
              // Le formulaire de Login
              <Box maxWidth="400px" margin="0 auto">
                <Heading as="h2" size="lg" mb={6} textAlign="center">Connexion Agent</Heading>
                <form onSubmit={handleLogin}>
                  <FormControl id="email-login" mb={4} isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </FormControl>
                  <FormControl id="password-login" mb={6} isRequired>
                    <FormLabel>Mot de passe</FormLabel>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </FormControl>
                  {message && (
                    <Alert status={message.startsWith('Erreur') ? 'error' : 'success'} mb={4} borderRadius="md">
                      <AlertIcon />
                      {message}
                    </Alert>
                  )}
                  <Button type="submit" colorScheme="blue" width="full" isLoading={isLoggingIn} loadingText="Connexion...">
                    Se connecter
                  </Button>
                </form>
              </Box>
            )
          }
        />

        {/* Route pour la page de détail d'un bien */}
        <Route
          path="/property/:propertyId"
          element={
            token ? (
              <PropertyDetail token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Route pour la page de détail d'un contact */}
        <Route
          path="/contact/:contactId"
          element={
            token ? (
              <ContactDetail token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        {/* Route pour l'Estimation */}
        <Route 
          path="/estimate"
          element={
            token ? (
              <PriceEstimator token={token} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
      </Routes>
    </Box>
  );
}