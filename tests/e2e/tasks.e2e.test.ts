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
  taskRepo: {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
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

import { taskRepo, projectRepo, userRepo } from '../../src/entities';
import { verifyToken } from '../../src/utils/jwt';

const mockedTaskRepo = taskRepo as jest.Mocked<typeof taskRepo>;
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

function makeTask(overrides: Record<string, unknown> = {}): any {
  return {
    id: 1,
    title: 'Audit site',
    description: 'Review pages',
    status: 'pending',
    priority: 'high',
    dueDate: new Date('2026-02-01T00:00:00.000Z'),
    projectId: 1,
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

function mockTaskQueryBuilder(task: any | null) {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(task),
  };
  (mockedTaskRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
  return qb;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Tasks E2E', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(() => jest.clearAllMocks());

  // ------------------- Member routes -------------------

  describe('Member - Tasks', () => {
    beforeEach(() => setupAuth(UserRole.MEMBER, 2));

    describe('POST /api/v1/projects/:projectId/tasks', () => {
      it('returns 201 with the created task', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject());
        mockedTaskRepo.create.mockReturnValue(makeTask());
        mockedTaskRepo.save.mockResolvedValue(makeTask());

        const res = await request(app)
          .post('/api/v1/projects/1/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'New Task', description: 'A task', priority: 'high' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.task).toMatchObject({ title: 'Audit site', projectId: 1 });
      });

      it('returns 404 when the project is not owned', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .post('/api/v1/projects/999/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Task' });

        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe('errors.projectNotFound');
      });

      it('returns 400 when title is missing', async () => {
        const res = await request(app)
          .post('/api/v1/projects/1/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({ description: 'no title' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when status is invalid', async () => {
        const res = await request(app)
          .post('/api/v1/projects/1/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Valid', status: 'invalid' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when priority is invalid', async () => {
        const res = await request(app)
          .post('/api/v1/projects/1/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Valid', priority: 'urgent' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when dueDate is not a valid ISO date', async () => {
        const res = await request(app)
          .post('/api/v1/projects/1/tasks')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Valid', dueDate: 'not-a-date' });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/v1/projects/:projectId/tasks', () => {
      it('returns paginated tasks for an owned project', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject());
        mockedTaskRepo.findAndCount.mockResolvedValue([[makeTask()], 1]);

        const res = await request(app)
          .get('/api/v1/projects/1/tasks?page=1&limit=20')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data.tasks).toHaveLength(1);
        expect(res.body.data.total).toBe(1);
      });

      it('applies status and priority filters', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject());
        mockedTaskRepo.findAndCount.mockResolvedValue([[], 0]);

        await request(app)
          .get('/api/v1/projects/1/tasks?status=pending&priority=high')
          .set('Authorization', 'Bearer mock-token');

        expect(mockedTaskRepo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { projectId: 1, status: 'pending', priority: 'high' },
          }),
        );
      });

      it('returns 404 when project is not owned', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/v1/projects/999/tasks')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
      });
    });

    describe('GET /api/v1/tasks/:id', () => {
      it('returns the task when owned via project', async () => {
        mockTaskQueryBuilder(makeTask());

        const res = await request(app)
          .get('/api/v1/tasks/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data.task).toMatchObject({ id: 1 });
      });

      it('returns 404 when task is not owned', async () => {
        mockTaskQueryBuilder(null);

        const res = await request(app)
          .get('/api/v1/tasks/999')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe('errors.taskNotFound');
      });
    });

    describe('PUT /api/v1/tasks/:id', () => {
      it('updates and returns the task', async () => {
        const task = makeTask();
        mockTaskQueryBuilder(task);
        mockedTaskRepo.save.mockResolvedValue(task);

        const res = await request(app)
          .put('/api/v1/tasks/1')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Updated', status: 'done' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('returns 404 when task is not owned', async () => {
        mockTaskQueryBuilder(null);

        const res = await request(app)
          .put('/api/v1/tasks/999')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Updated' });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/v1/tasks/:id', () => {
      it('deletes the task and returns data null', async () => {
        mockTaskQueryBuilder(makeTask());

        const res = await request(app)
          .delete('/api/v1/tasks/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
        expect(mockedTaskRepo.remove).toHaveBeenCalled();
      });

      it('returns 404 when task is not owned', async () => {
        mockTaskQueryBuilder(null);

        const res = await request(app)
          .delete('/api/v1/tasks/999')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
      });
    });
  });

  // ------------------- Admin routes -------------------

  describe('Admin - Tasks', () => {
    beforeEach(() => setupAuth(UserRole.ADMIN, 1));

    describe('GET /api/v1/admin/projects/:projectId/tasks', () => {
      it('returns all tasks for any project', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(makeProject({ ownerId: 99 }));
        mockedTaskRepo.findAndCount.mockResolvedValue([[makeTask(), makeTask({ id: 2 })], 2]);

        const res = await request(app)
          .get('/api/v1/admin/projects/1/tasks?page=1&limit=20')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data.tasks).toHaveLength(2);
        expect(res.body.data.total).toBe(2);
      });

      it('returns 404 when project does not exist', async () => {
        mockedProjectRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/v1/admin/projects/999/tasks')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
      });
    });

    describe('GET /api/v1/admin/tasks/:id', () => {
      it('returns any task by ID', async () => {
        mockedTaskRepo.findOneBy.mockResolvedValue(makeTask({ projectId: 99 }));

        const res = await request(app)
          .get('/api/v1/admin/tasks/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(mockedTaskRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      });

      it('returns 404 when task does not exist', async () => {
        mockedTaskRepo.findOneBy.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/v1/admin/tasks/999')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(404);
      });
    });

    describe('PUT /api/v1/admin/tasks/:id', () => {
      it('updates any task', async () => {
        const task = makeTask({ projectId: 99 });
        mockedTaskRepo.findOneBy.mockResolvedValue(task);
        mockedTaskRepo.save.mockResolvedValue(task);

        const res = await request(app)
          .put('/api/v1/admin/tasks/1')
          .set('Authorization', 'Bearer mock-token')
          .send({ title: 'Admin Override' });

        expect(res.status).toBe(200);
      });
    });

    describe('DELETE /api/v1/admin/tasks/:id', () => {
      it('deletes any task', async () => {
        mockedTaskRepo.findOneBy.mockResolvedValue(makeTask({ projectId: 99 }));

        const res = await request(app)
          .delete('/api/v1/admin/tasks/1')
          .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
      });
    });

    it('returns 403 when a member tries to access admin task routes', async () => {
      setupAuth(UserRole.MEMBER, 2);

      const res = await request(app)
        .get('/api/v1/admin/tasks/1')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(403);
    });
  });

  // ------------------- Auth required -------------------

  describe('Auth required', () => {
    it('returns 401 for POST /projects/1/tasks without token', async () => {
      const res = await request(app).post('/api/v1/projects/1/tasks').send({ title: 'Test' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for GET /tasks/1 without token', async () => {
      const res = await request(app).get('/api/v1/tasks/1');

      expect(res.status).toBe(401);
    });

    it('returns 401 for GET /admin/tasks/1 without token', async () => {
      const res = await request(app).get('/api/v1/admin/tasks/1');

      expect(res.status).toBe(401);
    });
  });
});
