// Configuration globale pour Jest
require('dotenv').config({ path: '.env.test' });

// Mock des services externes pour éviter les appels réels pendant les tests
jest.mock('openai');
jest.mock('resend');
jest.mock('@supabase/supabase-js');
jest.mock('web-push');
jest.mock('stripe');

// Timeout global pour les tests
jest.setTimeout(10000);

// Cleanup après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
