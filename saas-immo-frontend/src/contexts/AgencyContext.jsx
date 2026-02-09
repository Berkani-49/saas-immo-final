// Contexte : AgencyContext - Fournit les infos de l'agence (branding) au frontend
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, getAgencySlug } from '../config';

const AgencyContext = createContext(null);

export function AgencyProvider({ children, token }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencyInfo();
  }, [token]);

  const fetchAgencyInfo = async () => {
    try {
      // Méthode 1 : Depuis le endpoint public /api/agency/info (résolu par sous-domaine)
      const slug = getAgencySlug();
      const headers = {};
      if (slug) headers['X-Tenant-Slug'] = slug;

      const response = await axios.get(`${API_URL}/api/agency/info`, { headers });
      setAgency(response.data.agency);

      // Méthode 2 : Si pas d'info depuis le sous-domaine, essayer via /api/me
      if (!response.data.agency && token) {
        const meResponse = await axios.get(`${API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meResponse.data.agency) {
          setAgency(meResponse.data.agency);
        }
      }
    } catch (error) {
      console.error('Erreur chargement infos agence:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgencyContext.Provider value={{ agency, loading }}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  return useContext(AgencyContext);
}
