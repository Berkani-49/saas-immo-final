const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Tests unitaires de la logique métier
// Ces tests ne nécessitent pas de démarrer le serveur

describe('Authentication Logic', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  describe('Password Hashing', () => {
    it('devrait hasher un mot de passe', async () => {
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeTruthy();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('devrait vérifier un mot de passe correct', async () => {
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('devrait rejeter un mauvais mot de passe', async () => {
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    it('devrait créer un token JWT valide', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'OWNER'
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // Header.Payload.Signature
    });

    it('devrait décoder un token JWT valide', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'OWNER'
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('OWNER');
    });

    it('devrait rejeter un token invalide', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });

    it('devrait rejeter un token avec une mauvaise signature', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, JWT_SECRET);

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });
  });

  describe('Email Validation', () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('devrait valider un email correct', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    const isStrongPassword = (password) => {
      if (password.length < 8) return false;
      if (!/[A-Z]/.test(password)) return false; // Au moins une majuscule
      if (!/[a-z]/.test(password)) return false; // Au moins une minuscule
      if (!/[0-9]/.test(password)) return false; // Au moins un chiffre
      return true;
    };

    it('devrait valider un mot de passe fort', () => {
      expect(isStrongPassword('Password123')).toBe(true);
      expect(isStrongPassword('SecurePass1')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
    });

    it('devrait rejeter un mot de passe faible', () => {
      expect(isStrongPassword('short1A')).toBe(false); // Trop court
      expect(isStrongPassword('nouppercase1')).toBe(false); // Pas de majuscule
      expect(isStrongPassword('NOLOWERCASE1')).toBe(false); // Pas de minuscule
      expect(isStrongPassword('NoNumbers')).toBe(false); // Pas de chiffre
    });
  });
});

describe('Property Matching Algorithm', () => {
  const calculateMatchScore = (property, contact) => {
    let score = 0;

    // Budget (40 points max)
    if (contact.budgetMin !== null && contact.budgetMax !== null) {
      if (property.prix >= contact.budgetMin && property.prix <= contact.budgetMax) {
        score += 40;
      }
    }

    // Ville (30 points)
    if (contact.villesRecherchees && contact.villesRecherchees.includes(property.ville)) {
      score += 30;
    }

    // Chambres (15 points)
    if (contact.chambresMin !== null && contact.chambresMax !== null) {
      if (property.chambres >= contact.chambresMin && property.chambres <= contact.chambresMax) {
        score += 15;
      }
    }

    // Surface (15 points)
    if (contact.surfaceMin !== null && contact.surfaceMax !== null) {
      if (property.surface >= contact.surfaceMin && property.surface <= contact.surfaceMax) {
        score += 15;
      }
    }

    return score;
  };

  describe('Score Calculation', () => {
    it('devrait donner un score parfait pour un match exact', () => {
      const property = {
        prix: 300000,
        ville: 'Paris',
        chambres: 3,
        surface: 75
      };

      const contact = {
        budgetMin: 300000,
        budgetMax: 300000,
        villesRecherchees: ['Paris'],
        chambresMin: 3,
        chambresMax: 3,
        surfaceMin: 75,
        surfaceMax: 75
      };

      const score = calculateMatchScore(property, contact);
      expect(score).toBe(100);
    });

    it('devrait donner 40 points pour le budget seul', () => {
      const property = {
        prix: 300000,
        ville: 'Lyon',
        chambres: 2,
        surface: 60
      };

      const contact = {
        budgetMin: 250000,
        budgetMax: 350000,
        villesRecherchees: ['Paris'], // Ne match pas
        chambresMin: 4, // Ne match pas
        chambresMax: 5,
        surfaceMin: 100, // Ne match pas
        surfaceMax: 150
      };

      const score = calculateMatchScore(property, contact);
      expect(score).toBe(40);
    });

    it('devrait donner 30 points pour la ville seule', () => {
      const property = {
        prix: 500000,
        ville: 'Lyon',
        chambres: 1,
        surface: 30
      };

      const contact = {
        budgetMin: 100000,
        budgetMax: 200000, // Ne match pas
        villesRecherchees: ['Lyon'],
        chambresMin: 3, // Ne match pas
        chambresMax: 4,
        surfaceMin: 80, // Ne match pas
        surfaceMax: 120
      };

      const score = calculateMatchScore(property, contact);
      expect(score).toBe(30);
    });

    it('devrait donner 0 si rien ne match', () => {
      const property = {
        prix: 500000,
        ville: 'Marseille',
        chambres: 1,
        surface: 30
      };

      const contact = {
        budgetMin: 100000,
        budgetMax: 200000,
        villesRecherchees: ['Paris'],
        chambresMin: 3,
        chambresMax: 4,
        surfaceMin: 80,
        surfaceMax: 120
      };

      const score = calculateMatchScore(property, contact);
      expect(score).toBe(0);
    });

    it('devrait gérer les critères partiels', () => {
      const property = {
        prix: 300000,
        ville: 'Paris',
        chambres: 3,
        surface: 75
      };

      const contact = {
        budgetMin: 250000,
        budgetMax: 350000,
        villesRecherchees: ['Paris'],
        chambresMin: null, // Pas de critère
        chambresMax: null,
        surfaceMin: null, // Pas de critère
        surfaceMax: null
      };

      const score = calculateMatchScore(property, contact);
      expect(score).toBe(70); // Budget + Ville
    });
  });
});

describe('Utility Functions', () => {
  describe('Price Formatting', () => {
    const formatPrice = (price) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(price);
    };

    it('devrait formater un prix correctement', () => {
      const price1 = formatPrice(300000);
      const price2 = formatPrice(1500000);
      const price3 = formatPrice(250000);

      expect(price1).toContain('300');
      expect(price1).toContain('€');
      expect(price2).toContain('500');
      expect(price2).toContain('€');
      expect(price3).toContain('250');
      expect(price3).toContain('€');
    });
  });

  describe('Date Formatting', () => {
    it('devrait créer une date valide', () => {
      const date = new Date('2026-01-19');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // Janvier = 0
      expect(date.getDate()).toBe(19);
    });
  });
});
