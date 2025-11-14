// Fichier: src/App.jsx (Version Finale & Propre)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './Dashboard.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import PropertyDetail from './pages/PropertyDetail.jsx';
import ContactDetail from './pages/ContactDetail.jsx';
import SecretRegister from './pages/SecretRegister.jsx';
import PriceEstimator from './PriceEstimator.jsx';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, Spinner, Center } from '@chakra-ui/react';
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
      // On pointe vers ton serveur Render
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

  if (isLoadingToken) return <Center h="100vh"><Spinner size="xl" /></Center>;

  return (
    <Box maxWidth="1200px" margin="40px auto" p={[3, 6]}> 
      {/* J'ai enlevé le cadre blanc pour la page principale, c'est plus joli si le Dashboard gère son design */}
      <Routes>
        <Route path="/" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : (
          // BOITE DE CONNEXION CENTRÉE
          <Center h="80vh">
            <Box p={8} maxWidth="400px" borderWidth={1} borderRadius="lg" boxShadow="xl" bg="white" width="100%">
              <Heading as="h2" size="lg" mb={6} textAlign="center">Connexion Agence</Heading>
              <form onSubmit={handleLogin}>
                <FormControl id="email-login" mb={4} isRequired><FormLabel>Email</FormLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormControl>
                <FormControl id="password-login" mb={6} isRequired><FormLabel>Mot de passe</FormLabel><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></FormControl>
                {message && <Alert status="error" mb={4} borderRadius="md"><AlertIcon />{message}</Alert>}
                <Button type="submit" colorScheme="blue" width="full" isLoading={isLoggingIn}>Se connecter</Button>
              </form>
            </Box>
          </Center>
        )} />
        
        <Route path="/property/:propertyId" element={token ? <PropertyDetail token={token} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/contact/:contactId" element={token ? <ContactDetail token={token} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/estimate" element={token ? <PriceEstimator token={token} /> : <Navigate to="/" />} />
        <Route path="/nouveau-membre-agence" element={<SecretRegister />} />
      </Routes>
    </Box>
  );
}