// Fichier: src/App.jsx (Version FINALE avec Sidebar)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import du nouveau Layout
import Layout from './Layout.jsx'; 
// Import des Pages
import Dashboard from './Dashboard.jsx'; // C'est devenu notre "BiensPage"
// On aura besoin de créer ces fichiers bientôt, mais on les prépare
// import ContactsPage from './pages/ContactsPage.jsx'; 
// import TachesPage from './pages/TachesPage.jsx';

import PropertyDetail from './pages/PropertyDetail.jsx';
import ContactDetail from './pages/ContactDetail.jsx';
import SecretRegister from './pages/SecretRegister.jsx';
import PriceEstimator from './PriceEstimator.jsx';
import { Box, Heading, FormControl, FormLabel, Input, Button, Alert, Spinner, Center, Flex } from '@chakra-ui/react';
import { AlertIcon } from '@chakra-ui/icons';

export default function App() {
  const [token, setToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  
  // États pour le Login (on les garde ici)
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
    <Routes>
      {/* Si l'utilisateur EST connecté */}
      {token ? (
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          {/* Les pages à l'intérieur de la Sidebar */}
          <Route index element={<Dashboard token={token} />} /> {/* Page d'accueil (Biens) */}
          <Route path="biens" element={<Dashboard token={token} />} />
          
          {/* ON DOIT CRÉER CES PAGES ENSUITE */}
          <Route path="contacts" element={<div>Page Contacts (à faire)</div>} />
          <Route path="taches" element={<div>Page Tâches (à faire)</div>} />
          <Route path="estimate" element={<PriceEstimator token={token} />} />

          {/* Pages de détail (elles s'affichent aussi dans le layout) */}
          <Route path="property/:propertyId" element={<PropertyDetail token={token} />} />
          <Route path="contact/:contactId" element={<ContactDetail token={token} />} />
        </Route>
      ) : (
        /* Si l'utilisateur N'EST PAS connecté */
        <Route path="/" element={
          <Center h="100vh" bg="gray.50">
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
        } />
      )}

      {/* Route secrète (elle est en dehors du layout) */}
      <Route path="/nouveau-membre-agence" element={<SecretRegister />} />
      
      {/* Redirection si on est perdu */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}