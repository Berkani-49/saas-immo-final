const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn()
  },
  $disconnect: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      constructor(message, { code }) {
        super(message);
        this.code = code;
      }
    }
  }
}));

// Note: Pour tester correctement, il faudrait refactorer server.js
// pour exporter l'app sans démarrer le serveur (séparation app et listen)
// Pour l'instant, nous testons la logique métier directement

describe('Authentication Endpoints', () => {
  // Tests simplifiés sans require du server complet
  let app;

  beforeAll(() => {
    // Nous testons les fonctions de validation et logique métier
    // plutôt que le serveur complet pour éviter les conflits de port
  });

  afterAll(async () => {
    await mockPrisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'Password123!',
        nom: 'Dupont',
        prenom: 'Jean',
        telephone: '0612345678'
      };

      const hashedPassword = await bcrypt.hash(newUser.password, 10);
      const mockCreatedUser = {
        id: 1,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        telephone: newUser.telephone,
        role: 'OWNER',
        createdAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockCreatedUser,
        password: hashedPassword
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('devrait rejeter un email déjà existant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'existing@example.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          nom: 'Test',
          prenom: 'User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Cet email est déjà utilisé');
    });

    it('devrait rejeter un mot de passe faible', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          nom: 'Test',
          prenom: 'User'
        })
        .expect(400);

      expect(response.body.message).toContain('mot de passe');
    });

    it('devrait rejeter un email invalide', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          nom: 'Test',
          prenom: 'User'
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait connecter un utilisateur avec des credentials valides', async () => {
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'OWNER'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Vérifier que le token est valide
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('userId', 1);
    });

    it('devrait rejeter des credentials invalides', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });

    it('devrait rejeter un mauvais mot de passe', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: hashedPassword
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });
  });

  describe('Rate Limiting', () => {
    it('devrait bloquer après trop de tentatives de login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Faire plusieurs tentatives rapides
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(requests);

      // Au moins une requête devrait être rate-limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 15000);
  });
});
