// Fichier: src/App.jsx (Version avec Lazy Loading + Warmup Backend)
import React, { useState, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import './App.css';

// Imports essentiels (non lazy - chargés immédiatement)
import Layout from './Layout.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import PWAPrompt from './components/PWAPrompt.jsx';
import PageLoader from './components/PageLoader.jsx';

// Lazy loading des pages (chargées à la demande)
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const Dashboard = lazy(() => import('./Dashboard.jsx'));
const ContactsPage = lazy(() => import('./pages/ContactsPage.jsx'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage.jsx'));
const TachesPage = lazy(() => import('./pages/TachesPage.jsx'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage.jsx'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage.jsx'));
const TeamPage = lazy(() => import('./pages/TeamPage.jsx'));
const PriceEstimator = lazy(() => import('./PriceEstimator.jsx'));
const PublicPropertyPage = lazy(() => import('./pages/PublicPropertyPage.jsx'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail.jsx'));
const ContactDetail = lazy(() => import('./pages/ContactDetail.jsx'));
const SecretRegister = lazy(() => import('./pages/SecretRegister.jsx'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const RGPDPage = lazy(() => import('./pages/RGPDPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));

const API_URL = 'https://saas-immo.onrender.com';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'ready', 'waking'

  // Vérifier le token stocké au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) { setToken(storedToken); }
    setIsLoadingToken(false);
  }, []);

  // Préchauffer le backend dès que la page de login s'affiche
  useEffect(() => {
    if (!token) {
      warmupBackend();
    }
  }, [token]);

  // Keep-alive : ping toutes les 4 minutes quand connecté
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        axios.get(`${API_URL}/health`).catch(() => {});
      }, 4 * 60 * 1000); // 4 minutes
      return () => clearInterval(interval);
    }
  }, [token]);

  // Fonction pour réveiller le backend
  const warmupBackend = async () => {
    setBackendStatus('checking');
    const startTime = Date.now();

    try {
      await axios.get(`${API_URL}/health`, { timeout: 60000 });
      const elapsed = Date.now() - startTime;

      // Si ça a pris plus de 5 secondes, le serveur était endormi
      if (elapsed > 5000) {
        setBackendStatus('ready');
      } else {
        setBackendStatus('ready');
      }
    } catch (error) {
      // En cas d'erreur, on réessaie
      setBackendStatus('waking');
      setTimeout(warmupBackend, 3000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoggingIn(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
    } catch (error) {
      console.error("Erreur login:", error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setMessage('Le serveur met du temps à répondre. Veuillez réessayer.');
      } else {
        setMessage('Email ou mot de passe incorrect.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); };

  if (isLoadingToken) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;

  return (
    <Box w="100%" minH="100vh">
      {/* Bannière de consentement des conditions d'utilisation */}
      <CookieConsent />

      {/* Prompt PWA pour installer l'app et activer les notifications */}
      {token && <PWAPrompt token={token} />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/share/:id" element={<PublicPropertyPage />} />
          <Route path="/nouveau-membre-agence" element={<SecretRegister token={token} />} />

          {token ? (
            <Route path="/" element={<Layout onLogout={handleLogout} />}>
              <Route index element={<HomePage token={token} />} />
              <Route path="biens" element={<Dashboard token={token} />} />
              <Route path="contacts" element={<ContactsPage token={token} />} />
              <Route path="abonnement" element={<SubscriptionPage token={token} />} />
              <Route path="taches" element={<TachesPage token={token} />} />
              <Route path="rendez-vous" element={<AppointmentsPage token={token} />} />
              <Route path="factures" element={<InvoicesPage token={token} />} />
              <Route path="activites" element={<ActivitiesPage token={token} />} />
              <Route path="equipe" element={<TeamPage token={token} />} />
              <Route path="estimate" element={<PriceEstimator token={token} />} />
              <Route path="analytics" element={<AnalyticsPage token={token} />} />
              <Route path="notifications" element={<NotificationsPage token={token} />} />
              <Route path="rgpd" element={<RGPDPage token={token} />} />
              <Route path="property/:propertyId" element={<PropertyDetail token={token} />} />
              <Route path="contact/:contactId" element={<ContactDetail token={token} />} />
            </Route>
          ) : (
            // PAGE DE CONNEXION MODERNE
            <Route path="/" element={
              <LoginPage
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                handleLogin={handleLogin}
                message={message}
                isLoggingIn={isLoggingIn}
                backendStatus={backendStatus}
              />
            } />
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Box>
  );
}
