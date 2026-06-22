import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRole } from '../../src/entities/enums';
import type { Application } from 'express';

// ---------------------------------------------------------------------------
// Mocks - avoid real DB / bcrypt / jwt for fast deterministic e2e tests
// ---------------------------------------------------------------------------

jest.mock('../../src/entities', () => ({
  userRepo: {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
  projectRepo: {},
  taskRepo: {},
}));

jest.mock('../../src/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn(),
}));

jest.mock('../../src/middlewares/i18n', () => ({
  i18nMiddleware: (req: any, _res: any, next: any) => {
    req.language = 'en';
    req.t = (key: string) => key;
    next();
  },
}));

// Import after mocks are set up
import { userRepo } from '../../src/entities';
import { hashPassword, comparePassword } from '../../src/utils/password';
import { signToken } from '../../src/utils/jwt';

const mockedUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockedSignToken = signToken as jest.MockedFunction<typeof signToken>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<{ id: number; name: string; email: string; role: UserRole }> = {}) {
  return {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    role: UserRole.MEMBER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function mockQueryBuilder(user: any | null) {
  const qb = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(user),
  };
  (mockedUserRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
  return qb;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth E2E', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------- REGISTER -------------------------

  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    };

    it('returns 201 with user and token on successful registration', async () => {
      mockedUserRepo.findOneBy.mockResolvedValue(null);
      mockedUserRepo.create.mockReturnValue(makeUser());
      mockedUserRepo.save.mockResolvedValue(makeUser());
      mockedSignToken.mockReturnValue('mock-jwt-token');

      const res = await request(app).post('/api/v1/auth/register').send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'member',
      });
      expect(res.body.data.token).toBe('mock-jwt-token');

      expect(mockedUserRepo.findOneBy).toHaveBeenCalledWith({ email: 'jane@example.com' });
      expect(mockedHashPassword).toHaveBeenCalledWith('password123');
      expect(mockedUserRepo.save).toHaveBeenCalled();
      expect(mockedSignToken).toHaveBeenCalledWith({
        id: 1,
        email: 'jane@example.com',
        role: UserRole.MEMBER,
      });
    });

    it('returns 409 when email is already registered', async () => {
      mockedUserRepo.findOneBy.mockResolvedValue(makeUser());

      const res = await request(app).post('/api/v1/auth/register').send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('errors.emailInUse');
      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(mockedUserRepo.save).not.toHaveBeenCalled();
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'jane@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('errors.badRequest');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
      );
    });

    it('returns 400 when name is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'J', email: 'jane@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
      );
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Jane Doe', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })]),
      );
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toHaveLength(6);
    });
  });

  // ------------------------- LOGIN -------------------------

  describe('POST /api/v1/auth/login', () => {
    const validPayload = {
      email: 'jane@example.com',
      password: 'password123',
    };

    it('returns 200 with user and token on successful login', async () => {
      const user = makeUser();
      mockQueryBuilder(user);
      mockedComparePassword.mockResolvedValue(true);
      mockedSignToken.mockReturnValue('mock-jwt-token');

      const res = await request(app).post('/api/v1/auth/login').send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'member',
      });
      expect(res.body.data.token).toBe('mock-jwt-token');
      expect(mockedSignToken).toHaveBeenCalledWith({
        id: 1,
        email: 'jane@example.com',
        role: UserRole.MEMBER,
      });
    });

    it('returns 401 when user does not exist', async () => {
      mockQueryBuilder(null);

      const res = await request(app).post('/api/v1/auth/login').send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('errors.invalidCredentials');
      expect(mockedComparePassword).not.toHaveBeenCalled();
    });

    it('returns 401 when password does not match', async () => {
      mockQueryBuilder(makeUser());
      mockedComparePassword.mockResolvedValue(false);

      const res = await request(app).post('/api/v1/auth/login').send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('errors.invalidCredentials');
    });

    it('returns the same error for wrong email and wrong password (anti-enumeration)', async () => {
      // Wrong email (user not found)
      mockQueryBuilder(null);
      const resWrongEmail = await request(app).post('/api/v1/auth/login').send(validPayload);

      // Wrong password (user found, password mismatch)
      mockQueryBuilder(makeUser());
      mockedComparePassword.mockResolvedValue(false);
      const resWrongPassword = await request(app).post('/api/v1/auth/login').send(validPayload);

      expect(resWrongEmail.status).toBe(resWrongPassword.status);
      expect(resWrongEmail.body.error.message).toBe(resWrongPassword.body.error.message);
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })]),
      );
    });

    it('returns 400 when email is invalid format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });
  });

  // ------------------------- UNKNOWN ROUTE -------------------------

  describe('Unknown auth routes', () => {
    it('returns 404 for GET /api/v1/auth/register', async () => {
      const res = await request(app).get('/api/v1/auth/register');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('errors.resourceNotFound');
    });
  });
});
