// Configuration centralisée de l'application
export const API_URL = import.meta.env.VITE_API_URL || 'https://saas-immo.onrender.com';

export function getAgencySlug() {
  const host = window.location.hostname;
  const appDomain = import.meta.env.VITE_APP_DOMAIN;
  if (!appDomain) return null;
  const suffix = '.' + appDomain;
  if (host.endsWith(suffix)) {
    return host.slice(0, -suffix.length);
  }
  return localStorage.getItem('dev-tenant-slug') || null;
}
