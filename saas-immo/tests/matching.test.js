const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Prisma
const mockPrisma = {
  user: { findUnique: jest.fn() },
  property: { findUnique: jest.fn() },
  contact: { findMany: jest.fn() },
  $disconnect: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

let app;

describe('Matching Algorithm', () => {
  let authToken;
  const mockUser = {
    id: 1,
    email: 'agent@example.com',
    role: 'OWNER'
  };

  beforeAll(() => {
    app = require('../server');
    authToken = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mockPrisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('GET /api/properties/:id/matches', () => {
    it('devrait retourner les contacts matchés avec un score élevé', async () => {
      const mockProperty = {
        id: 1,
        titre: 'Appartement Paris',
        type: 'APPARTEMENT',
        transaction: 'VENTE',
        prix: 300000,
        ville: 'Paris',
        chambres: 3,
        surface: 75,
        userId: mockUser.id
      };

      const mockContacts = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean@example.com',
          type: 'ACHETEUR',
          budgetMin: 250000,
          budgetMax: 350000,
          villesRecherchees: ['Paris', 'Lyon'],
          chambresMin: 2,
          chambresMax: 4,
          surfaceMin: 60,
          surfaceMax: 100,
          notificationEmail: true,
          notificationPush: false,
          userId: mockUser.id
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Marie',
          email: 'marie@example.com',
          type: 'ACHETEUR',
          budgetMin: 100000,
          budgetMax: 200000, // Hors budget
          villesRecherchees: ['Marseille'], // Mauvaise ville
          chambresMin: 1,
          chambresMax: 2,
          surfaceMin: 30,
          surfaceMax: 50,
          notificationEmail: true,
          notificationPush: false,
          userId: mockUser.id
        }
      ];

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.contact.findMany.mockResolvedValue(mockContacts);

      const response = await request(app)
        .get('/api/properties/1/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Le premier contact devrait avoir un meilleur score
      const firstMatch = response.body[0];
      expect(firstMatch).toHaveProperty('score');
      expect(firstMatch.score).toBeGreaterThan(50); // Score élevé car critères matchent

      // Vérifier que les contacts sont triés par score décroissant
      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].score).toBeGreaterThanOrEqual(response.body[i + 1].score);
      }
    });

    it('devrait calculer correctement le score de matching', async () => {
      const mockProperty = {
        id: 1,
        prix: 300000,
        ville: 'Paris',
        chambres: 3,
        surface: 75,
        userId: mockUser.id
      };

      // Contact parfaitement matché
      const perfectMatch = {
        id: 1,
        nom: 'Perfect',
        type: 'ACHETEUR',
        budgetMin: 300000,
        budgetMax: 300000,
        villesRecherchees: ['Paris'],
        chambresMin: 3,
        chambresMax: 3,
        surfaceMin: 75,
        surfaceMax: 75,
        userId: mockUser.id
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.contact.findMany.mockResolvedValue([perfectMatch]);

      const response = await request(app)
        .get('/api/properties/1/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0].score).toBe(100); // Score parfait
    });

    it('devrait retourner 404 si la propriété n\'existe pas', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/properties/999/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('devrait exclure les vendeurs du matching', async () => {
      const mockProperty = {
        id: 1,
        prix: 300000,
        ville: 'Paris',
        userId: mockUser.id
      };

      const contacts = [
        {
          id: 1,
          type: 'ACHETEUR',
          budgetMin: 250000,
          budgetMax: 350000,
          villesRecherchees: ['Paris'],
          userId: mockUser.id
        },
        {
          id: 2,
          type: 'VENDEUR', // Ne devrait pas matcher
          budgetMin: 250000,
          budgetMax: 350000,
          villesRecherchees: ['Paris'],
          userId: mockUser.id
        }
      ];

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.contact.findMany.mockResolvedValue(contacts);

      const response = await request(app)
        .get('/api/properties/1/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Seul l'acheteur devrait être retourné
      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe('ACHETEUR');
    });
  });

  describe('Score Calculation Logic', () => {
    it('devrait donner 40 points max pour le budget', async () => {
      const mockProperty = {
        id: 1,
        prix: 300000,
        ville: 'Paris',
        chambres: 2,
        surface: 70,
        userId: mockUser.id
      };

      const contactInBudget = {
        id: 1,
        type: 'ACHETEUR',
        budgetMin: 200000,
        budgetMax: 400000, // Prix dans le budget
        villesRecherchees: [],
        userId: mockUser.id
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.contact.findMany.mockResolvedValue([contactInBudget]);

      const response = await request(app)
        .get('/api/properties/1/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Devrait avoir au moins les 40 points du budget
      expect(response.body[0].score).toBeGreaterThanOrEqual(40);
    });

    it('devrait donner 30 points pour la ville correspondante', async () => {
      const mockProperty = {
        id: 1,
        prix: 500000,
        ville: 'Lyon',
        chambres: 3,
        surface: 80,
        userId: mockUser.id
      };

      const contactWithCity = {
        id: 1,
        type: 'ACHETEUR',
        budgetMin: 0,
        budgetMax: 100000, // Budget ne match pas (0 points)
        villesRecherchees: ['Lyon'], // Ville match (30 points)
        chambresMin: 1,
        chambresMax: 2, // Chambres ne matchent pas (0 points)
        surfaceMin: 20,
        surfaceMax: 50, // Surface ne match pas (0 points)
        userId: mockUser.id
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.contact.findMany.mockResolvedValue([contactWithCity]);

      const response = await request(app)
        .get('/api/properties/1/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Devrait avoir 30 points pour la ville
      expect(response.body[0].score).toBe(30);
    });
  });
});
