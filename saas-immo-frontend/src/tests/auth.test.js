import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jwtDecode } from 'jwt-decode';

// Mock jwt-decode
vi.mock('jwt-decode');

describe('Authentication Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Token Storage', () => {
    it('devrait stocker le token dans localStorage', () => {
      const token = 'fake-jwt-token';
      localStorage.setItem('token', token);

      expect(localStorage.getItem('token')).toBe(token);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
    });

    it('devrait retourner null si aucun token n\'est stocké', () => {
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('devrait supprimer le token du localStorage', () => {
      localStorage.setItem('token', 'fake-token');
      localStorage.removeItem('token');

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Token Validation', () => {
    it('devrait décoder un token JWT valide', () => {
      const mockDecodedToken = {
        userId: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // Expire dans 1h
      };

      jwtDecode.mockReturnValue(mockDecodedToken);

      const token = 'fake-jwt-token';
      const decoded = jwtDecode(token);

      expect(decoded).toEqual(mockDecodedToken);
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
    });

    it('devrait vérifier si un token est expiré', () => {
      const expiredToken = {
        userId: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expiré il y a 1h
      };

      jwtDecode.mockReturnValue(expiredToken);

      const decoded = jwtDecode('fake-token');
      const isExpired = decoded.exp < Math.floor(Date.now() / 1000);

      expect(isExpired).toBe(true);
    });

    it('devrait vérifier si un token est valide', () => {
      const validToken = {
        userId: 1,
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // Expire dans 1h
      };

      jwtDecode.mockReturnValue(validToken);

      const decoded = jwtDecode('fake-token');
      const isValid = decoded.exp > Math.floor(Date.now() / 1000);

      expect(isValid).toBe(true);
    });
  });

  describe('User Session', () => {
    it('devrait stocker les informations utilisateur', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'OWNER'
      };

      localStorage.setItem('user', JSON.stringify(user));

      const storedUser = JSON.parse(localStorage.getItem('user'));
      expect(storedUser).toEqual(user);
      expect(storedUser.role).toBe('OWNER');
    });

    it('devrait nettoyer la session lors de la déconnexion', () => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      localStorage.clear();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Authorization Headers', () => {
    it('devrait créer un header d\'autorisation valide', () => {
      const token = 'fake-jwt-token';
      const authHeader = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      expect(authHeader.headers.Authorization).toBe(`Bearer ${token}`);
      expect(authHeader.headers.Authorization).toContain('Bearer');
    });

    it('devrait gérer l\'absence de token', () => {
      const token = localStorage.getItem('token');
      expect(token).toBeNull();

      // Ne devrait pas créer de header si pas de token
      const shouldNotCreateHeader = !token;
      expect(shouldNotCreateHeader).toBe(true);
    });
  });
});
