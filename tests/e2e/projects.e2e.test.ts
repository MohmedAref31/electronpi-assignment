import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRole } from '../../src/entities/enums';
import type { Application } from 'express';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../src/entities', () => ({
  userRepo: { findOneBy: jest.fn() },
  projectRepo: {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  },
  taskRepo: {},
}));

jest.mock('../../src/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock-token'),
  verifyToken: jest.fn(),
}));

jest.mock('../../src/middlewares/i18n', () => ({
  i18nMiddleware: (req: any, _res: any, next: any) => {
    req.language = 'en';
    req.t = (key: string) => key;
    next();
  },
}));

import { projectRepo, userRepo } from '../../src/entities';
import { verifyToken } from '../../src/utils/jwt';

const mockedProjectRepo = projectRepo as jest.Mocked<typeof projectRepo>;
const mockedUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(id: number, role: UserRole) {
  return {
    id,
    name: role === UserRole.ADMIN ? 'Admin' : 'Member',
    email: role === UserRole.ADMIN ? 'admin@example.com' : `user${id}@example.com`,
    password: 'hashed',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeProject(overrides: Record<string, unknown> = {}): any {
  return {
    id: 1,
    title: 'Website Redesign',
    description: 'A new site',
    status: 'active',
    ownerId: 2,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function setupAuth(role: UserRole, id: number = 2) {
  const user = makeUser(id, role);
  mockedVerifyToken.mockReturnValue({ id, email: user.email, role });
  mockedUserRepo.findOneBy.mockResolvedValue(user);
  return user;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Projects E2E', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------- Member routes: /api/v1/projects -------------------

  describe('Member /api/v1/projects', () => {
    beforeEach(() => setupAuth(UserRole.MEMBER, 2));

    describe('POST /api/v1/projects', () => {
      it('returns 201 with the created project', async () => {
        mockedProjectRepo.create.mockReturnValue(makeProject());
        mockedProjectRepo.save.mockResolvedValue(makeProject());

        const res = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Website Redesign', description: 'A new site' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.project).toMatchObject({ title: 'Website Redesign', ownerId: 2 });
      });

      it('returns 400 when title is missing', async () => {
        const res = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer mock-token')
          .send({ description: 'no title' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('returns 400 when title is too short', async () => {
        const res = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'A' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when status is invalid', async () => {
        const res = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Valid Title', status: 'invalid' });

        expect(res.status).toBe(400);
      });

      it('returns 401 when no auth token', async () => {
        const res = await request(app).post('/api/v1/projects').send({ title: 'Test' });

        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/v1/projects', () => {
      it('returns paginated list of own projects', async () => {
        mockedProjectRepo.findAndCount.mockResolvedValue([[makeProject()], 1]);

        const res = await request(app)
          .get('/api/v1/projects?page=1&limit=20')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.projects).toHaveLength(1);
        expect(res.body.data.total).toBe(1);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(20);
        expect(mockedProjectRepo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({ where: { ownerId: 2 } }),
        );
      });
    });

    describe('GET /api/v1/projects/:id', () => {
      it('returns the project when owned by the user', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject());

        const res = await request(app)
          .get('/api/v1/projects/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data.project).toMatchObject({ id: 1 });
        expect(mockedProjectRepo.findOneBy).toHaveBeenCalledWith({ id: 1, ownerId: 2 });
      });

      it('returns 404 when project is not owned by the user', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/v1/projects/999')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe('errors.projectNotFound');
      });

      it('returns 400 when id is not a positive integer', async () => {
        const res = await request(app)
          .get('/api/v1/projects/abc')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(400);
      });
    });

    describe('PUT /api/v1/projects/:id', () => {
      it('updates and returns the project', async () => {
        const project = makeProject();
        mockedProjectRepo.findOneBy.mockResolvedValue(project);
        mockedProjectRepo.save.mockResolvedValue(project);

        const res = await request(app)
          .put('/api/v1/projects/1')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Updated Title' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('returns 404 when project is not owned', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .put('/api/v1/projects/999')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Updated' });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/v1/projects/:id', () => {
      it('deletes the project and returns data null', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject());

        const res = await request(app)
          .delete('/api/v1/projects/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeNull();
        expect(mockedProjectRepo.remove).toHaveBeenCalled();
      });

      it('returns 404 when project is not owned', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .delete('/api/v1/projects/999')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
      });
    });
  });

  // ------------------- Admin routes: /api/v1/admin/projects -------------------

  describe('Admin /api/v1/admin/projects', () => {
    beforeEach(() => setupAuth(UserRole.ADMIN, 1));

    describe('GET /api/v1/admin/projects', () => {
      it('returns all projects paginated (no owner filter)', async () => {
        mockedProjectRepo.findAndCount.mockResolvedValue([
          [makeProject(), makeProject({ id: 2, ownerId: 3 })],
          2,
        ]);

        const res = await request(app)
          .get('/api/v1/admin/projects?page=1&limit=20')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data.projects).toHaveLength(2);
        expect(res.body.data.total).toBe(2);
        expect(mockedProjectRepo.findAndCount).toHaveBeenCalledWith(
          expect.not.objectContaining({ where: expect.anything() }),
        );
      });
    });

    describe('GET /api/v1/admin/projects/:id', () => {
      it('returns any project by ID (no ownership restriction)', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject({ ownerId: 99 }));

        const res = await request(app)
          .get('/api/v1/admin/projects/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(mockedProjectRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      });

      it('returns 404 when project does not exist', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/v1/admin/projects/999')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
      });
    });

    describe('PUT /api/v1/admin/projects/:id', () => {
      it('updates any project', async () => {
        const project = makeProject({ ownerId: 99 });
        mockedProjectRepo.findOneBy.mockResolvedValue(project);
        mockedProjectRepo.save.mockResolvedValue(project);

        const res = await request(app)
          .put('/api/v1/admin/projects/1')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Admin Override' });

        expect(res.status).toBe(200);
        expect(mockedProjectRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      });
    });

    describe('DELETE /api/v1/admin/projects/:id', () => {
      it('deletes any project', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject({ ownerId: 99 }));

        const res = await request(app)
          .delete('/api/v1/admin/projects/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
        expect(mockedProjectRepo.remove).toHaveBeenCalled();
      });
    });

    it('returns 403 when a member tries to access admin routes', async () => {
      setupAuth(UserRole.MEMBER, 2);

      const res = await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('errors.accessDenied');
    });
  });

  // ------------------- Cross-cutting -------------------

  describe('Auth required', () => {
    it('returns 401 for GET /api/v1/projects without token', async () => {
      const res = await request(app).get('/api/v1/projects');

      expect(res.status).toBe(401);
    });

    it('returns 401 for GET /api/v1/admin/projects without token', async () => {
      const res = await request(app).get('/api/v1/admin/projects');

      expect(res.status).toBe(401);
    });
  });
});
