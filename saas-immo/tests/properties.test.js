const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn()
  },
  property: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  contact: {
    findMany: jest.fn()
  },
  $disconnect: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

let app;

describe('Properties Endpoints', () => {
  let authToken;
  const mockUser = {
    id: 1,
    email: 'agent@example.com',
    nom: 'Agent',
    prenom: 'Test',
    role: 'OWNER'
  };

  beforeAll(() => {
    app = require('../server');
    // Créer un token valide pour les tests
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

  describe('POST /api/properties', () => {
    it('devrait créer une nouvelle propriété avec succès', async () => {
      const newProperty = {
        titre: 'Appartement T3 Centre Ville',
        description: 'Bel appartement lumineux',
        type: 'APPARTEMENT',
        transaction: 'VENTE',
        prix: 250000,
        surface: 75,
        chambres: 2,
        sallesDeBain: 1,
        adresse: '10 rue de la Paix',
        ville: 'Paris',
        codePostal: '75001',
        latitude: 48.8566,
        longitude: 2.3522
      };

      const mockCreatedProperty = {
        id: 1,
        ...newProperty,
        userId: mockUser.id,
        statut: 'DISPONIBLE',
        createdAt: new Date()
      };

      mockPrisma.property.create.mockResolvedValue(mockCreatedProperty);
      mockPrisma.contact.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProperty)
        .expect(201);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('titre', newProperty.titre);
      expect(response.body).toHaveProperty('prix', newProperty.prix);
      expect(mockPrisma.property.create).toHaveBeenCalledTimes(1);
    });

    it('devrait rejeter une propriété sans authentification', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          titre: 'Test',
          type: 'APPARTEMENT',
          transaction: 'VENTE',
          prix: 100000
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token manquant');
    });

    it('devrait rejeter une propriété avec des champs manquants', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titre: 'Test'
          // Champs obligatoires manquants
        })
        .expect(400);

      expect(response.body.message).toBeTruthy();
    });

    it('devrait rejeter un prix négatif', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titre: 'Test',
          type: 'APPARTEMENT',
          transaction: 'VENTE',
          prix: -1000,
          surface: 50,
          adresse: 'Test',
          ville: 'Paris',
          codePostal: '75001'
        })
        .expect(400);

      expect(response.body.message).toContain('prix');
    });
  });

  describe('GET /api/properties', () => {
    it('devrait retourner la liste des propriétés de l\'utilisateur', async () => {
      const mockProperties = [
        {
          id: 1,
          titre: 'Maison 1',
          prix: 300000,
          userId: mockUser.id
        },
        {
          id: 2,
          titre: 'Appartement 1',
          prix: 200000,
          userId: mockUser.id
        }
      ];

      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('titre', 'Maison 1');
    });

    it('devrait retourner un tableau vide si aucune propriété', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('devrait retourner une propriété spécifique', async () => {
      const mockProperty = {
        id: 1,
        titre: 'Maison Test',
        prix: 300000,
        userId: mockUser.id,
        images: [],
        owners: [],
        interestedContacts: []
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);

      const response = await request(app)
        .get('/api/properties/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('titre', 'Maison Test');
    });

    it('devrait retourner 404 si propriété non trouvée', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/properties/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Propriété non trouvée');
    });
  });

  describe('PUT /api/properties/:id', () => {
    it('devrait mettre à jour une propriété', async () => {
      const existingProperty = {
        id: 1,
        titre: 'Ancien titre',
        userId: mockUser.id
      };

      const updatedData = {
        titre: 'Nouveau titre',
        prix: 350000
      };

      mockPrisma.property.findUnique.mockResolvedValue(existingProperty);
      mockPrisma.property.update.mockResolvedValue({
        ...existingProperty,
        ...updatedData
      });

      const response = await request(app)
        .put('/api/properties/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('titre', 'Nouveau titre');
      expect(mockPrisma.property.update).toHaveBeenCalledTimes(1);
    });

    it('devrait rejeter la mise à jour d\'une propriété d\'un autre utilisateur', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 1,
        userId: 999 // Différent de mockUser.id
      });

      const response = await request(app)
        .put('/api/properties/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ titre: 'Test' })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Non autorisé');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('devrait supprimer une propriété', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 1,
        userId: mockUser.id
      });
      mockPrisma.property.delete.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .delete('/api/properties/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Propriété supprimée avec succès');
      expect(mockPrisma.property.delete).toHaveBeenCalledTimes(1);
    });
  });
});
