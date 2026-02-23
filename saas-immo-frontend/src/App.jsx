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
import LoginPage from './pages/LoginPage.jsx';
import { PlanProvider, usePlan } from './contexts/PlanContext';
import { AgencyProvider } from './contexts/AgencyContext';
import { API_URL, getAgencySlug } from './config';

// Composant garde-plan : redirige vers /abonnement si le plan est insuffisant
function PlanGate({ requiredPlan, children }) {
  const { hasPlan, loading } = usePlan();
  if (loading) return <PageLoader />;
  if (!hasPlan(requiredPlan)) return <Navigate to="/abonnement" replace />;
  return children;
}

// Lazy loading des pages (chargées à la demande)
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const Dashboard = lazy(() => import('./Dashboard.jsx'));
const ContactsPage = lazy(() => import('./pages/ContactsPage.jsx'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage.jsx'));
const TachesPage = lazy(() => import('./pages/TachesPage.jsx'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage.jsx'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage.jsx'));
const TeamPage = lazy(() => import('./pages/TeamPage.jsx'));

const PublicPropertyPage = lazy(() => import('./pages/PublicPropertyPage.jsx'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail.jsx'));
const ContactDetail = lazy(() => import('./pages/ContactDetail.jsx'));
const SecretRegister = lazy(() => import('./pages/SecretRegister.jsx'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const RGPDPage = lazy(() => import('./pages/RGPDPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const DiffusionPage = lazy(() => import('./pages/DiffusionPage.jsx'));
const SignaturesPage = lazy(() => import('./pages/SignaturesPage.jsx'));
const PublicSignPage = lazy(() => import('./pages/PublicSignPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const HelpPage = lazy(() => import('./pages/HelpPage.jsx'));

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

  // Préchauffer le backend + précharger la HomePage dès que la page de login s'affiche
  useEffect(() => {
    if (!token) {
      warmupBackend();
      // Précharger la HomePage pour éviter le spinner après le login
      import('./pages/HomePage.jsx');
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

      // Si le backend retourne une agence et qu'un domaine est configuré,
      // rediriger vers le bon sous-domaine
      const agency = response.data.agency;
      const appDomain = import.meta.env.VITE_APP_DOMAIN;
      const currentSlug = getAgencySlug();

      if (agency && appDomain && agency.slug !== currentSlug) {
        // L'utilisateur est sur le mauvais sous-domaine → rediriger
        window.location.href = `${window.location.protocol}//${agency.slug}.${appDomain}`;
        return;
      }

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
          <Route path="/signer/:token" element={<PublicSignPage />} />
          <Route path="/nouveau-membre-agence" element={<SecretRegister token={token} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {token ? (
            <Route path="/" element={<AgencyProvider token={token}><PlanProvider token={token}><Layout onLogout={handleLogout} /></PlanProvider></AgencyProvider>}>
              {/* Routes accessibles à tous les plans */}
              <Route index element={<HomePage token={token} />} />
              <Route path="biens" element={<Dashboard token={token} />} />
              <Route path="contacts" element={<ContactsPage token={token} />} />
              <Route path="abonnement" element={<SubscriptionPage token={token} />} />
              <Route path="taches" element={<TachesPage token={token} />} />
              <Route path="rendez-vous" element={<AppointmentsPage token={token} />} />
              <Route path="rgpd" element={<RGPDPage token={token} />} />
              <Route path="profil" element={<ProfilePage token={token} />} />
              <Route path="aide" element={<HelpPage />} />
              <Route path="property/:propertyId" element={<PropertyDetail token={token} />} />
              <Route path="contact/:contactId" element={<ContactDetail token={token} />} />

              {/* Routes Pro+ */}
              <Route path="factures" element={<PlanGate requiredPlan="pro"><InvoicesPage token={token} /></PlanGate>} />
              <Route path="activites" element={<PlanGate requiredPlan="pro"><ActivitiesPage token={token} /></PlanGate>} />
              <Route path="equipe" element={<PlanGate requiredPlan="pro"><TeamPage token={token} /></PlanGate>} />
              <Route path="analytics" element={<PlanGate requiredPlan="pro"><AnalyticsPage token={token} /></PlanGate>} />
              <Route path="notifications" element={<PlanGate requiredPlan="pro"><NotificationsPage token={token} /></PlanGate>} />
              <Route path="diffusion" element={<PlanGate requiredPlan="pro"><DiffusionPage token={token} /></PlanGate>} />
              <Route path="signatures" element={<PlanGate requiredPlan="pro"><SignaturesPage token={token} /></PlanGate>} />
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
