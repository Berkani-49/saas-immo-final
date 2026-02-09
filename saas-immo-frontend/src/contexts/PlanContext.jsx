import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const PlanContext = createContext(null);

// Hiérarchie des plans
const PLAN_HIERARCHY = { free: 0, pro: 1, premium: 2 };

export function PlanProvider({ token, children }) {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!token) {
      setPlanData(null);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/billing/my-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlanData(res.data);
    } catch (error) {
      console.error('Erreur récupération plan:', error);
      // Fallback plan gratuit
      setPlanData({
        plan: 'free',
        limits: { maxProperties: 3, maxContacts: 5, maxEmployees: 1 },
        usage: { properties: 0, contacts: 0, employees: 0 },
        features: {
          invoices: false, analytics: false, team: false,
          notifications: false, documents: false,
          ai_staging: false, ai_enhancement: false, matching: false
        },
        subscription: null
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Vérifie si le plan actuel est suffisant pour un plan requis
  const hasPlan = useCallback((requiredPlan) => {
    if (!planData) return false;
    const currentLevel = PLAN_HIERARCHY[planData.plan] ?? 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 0;
    return currentLevel >= requiredLevel;
  }, [planData]);

  // Vérifie si une feature spécifique est disponible
  const isFeatureAvailable = useCallback((featureName) => {
    if (!planData || !planData.features) return false;
    return planData.features[featureName] === true;
  }, [planData]);

  const value = {
    plan: planData?.plan || 'free',
    limits: planData?.limits || {},
    usage: planData?.usage || {},
    features: planData?.features || {},
    subscription: planData?.subscription || null,
    loading,
    hasPlan,
    isFeatureAvailable,
    refreshPlan: fetchPlan
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan doit être utilisé dans un PlanProvider');
  }
  return context;
}
