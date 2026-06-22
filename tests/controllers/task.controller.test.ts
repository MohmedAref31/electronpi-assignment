import { Request, Response, NextFunction } from 'express';
import * as taskController from '../../src/controllers/task.controller';
import * as adminTaskController from '../../src/controllers/admin.task.controller';

jest.mock('../../src/services/task.service', () => ({
  createTask: jest.fn(),
  listOwnTasks: jest.fn(),
  getOwnTask: jest.fn(),
  updateOwnTask: jest.fn(),
  deleteOwnTask: jest.fn(),
  listAllTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  serializeTask: jest.fn((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    projectId: t.projectId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  })),
  parseTaskFilters: jest.fn(() => ({})),
}));

import {
  createTask,
  listOwnTasks,
  getOwnTask,
  updateOwnTask,
  deleteOwnTask,
  listAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../../src/services/task.service';

const mockedCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockedListOwnTasks = listOwnTasks as jest.MockedFunction<typeof listOwnTasks>;
const mockedGetOwnTask = getOwnTask as jest.MockedFunction<typeof getOwnTask>;
const mockedUpdateOwnTask = updateOwnTask as jest.MockedFunction<typeof updateOwnTask>;
const mockedDeleteOwnTask = deleteOwnTask as jest.MockedFunction<typeof deleteOwnTask>;
const mockedListAllTasks = listAllTasks as jest.MockedFunction<typeof listAllTasks>;
const mockedGetTaskById = getTaskById as jest.MockedFunction<typeof getTaskById>;
const mockedUpdateTask = updateTask as jest.MockedFunction<typeof updateTask>;
const mockedDeleteTask = deleteTask as jest.MockedFunction<typeof deleteTask>;

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockUser() {
  return { id: 2, name: 'Jane', email: 'jane@example.com', role: 'member' };
}

const sampleTask = {
  id: 1,
  title: 'Audit site',
  description: 'Review pages',
  status: 'pending',
  priority: 'high',
  dueDate: new Date('2026-02-01T00:00:00.000Z'),
  projectId: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

// ---------------------------------------------------------------------------
// Member controller
// ---------------------------------------------------------------------------

describe('task.controller (member)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('responds with 201 and the created task', async () => {
      const res = mockResponse();
      mockedCreateTask.mockResolvedValue(sampleTask as any);

      await taskController.create(
        {
          user: mockUser(),
          params: { projectId: '1' },
          body: { title: 'New Task', description: 'A task', status: 'pending', priority: 'high', dueDate: '2026-02-01' },
        } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedCreateTask).toHaveBeenCalledWith(2, 1, {
        title: 'New Task',
        description: 'A task',
        status: 'pending',
        priority: 'high',
        dueDate: new Date('2026-02-01'),
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('passes undefined dueDate when not provided', async () => {
      const res = mockResponse();
      mockedCreateTask.mockResolvedValue(sampleTask as any);

      await taskController.create(
        {
          user: mockUser(),
          params: { projectId: '1' },
          body: { title: 'Task' },
        } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedCreateTask).toHaveBeenCalledWith(2, 1, expect.objectContaining({ dueDate: undefined }));
    });

    it('passes errors to next', async () => {
      const next = jest.fn() as unknown as NextFunction;
      mockedCreateTask.mockRejectedValue(new Error('fail'));

      await taskController.create(
        { user: mockUser(), params: { projectId: '1' }, body: {} } as unknown as Request,
        mockResponse() as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('list', () => {
    it('responds with paginated filtered tasks', async () => {
      const res = mockResponse();
      mockedListOwnTasks.mockResolvedValue({ items: [sampleTask as any], total: 1, page: 1, limit: 20 });

      await taskController.list(
        {
          user: mockUser(),
          params: { projectId: '1' },
          query: { status: 'pending', priority: 'high' },
          pagination: { page: 1, limit: 20, skip: 0 },
        } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedListOwnTasks).toHaveBeenCalledWith(2, 1, {}, { page: 1, limit: 20, skip: 0 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { tasks: [expect.objectContaining({ id: 1 })], total: 1, page: 1, limit: 20 },
      });
    });
  });

  describe('getById', () => {
    it('responds with the task', async () => {
      const res = mockResponse();
      mockedGetOwnTask.mockResolvedValue(sampleTask as any);

      await taskController.getById(
        { user: mockUser(), params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedGetOwnTask).toHaveBeenCalledWith(2, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('passes errors to next', async () => {
      const next = jest.fn() as unknown as NextFunction;
      mockedGetOwnTask.mockRejectedValue(new Error('not found'));

      await taskController.getById(
        { user: mockUser(), params: { id: '999' } } as unknown as Request,
        mockResponse() as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('responds with the updated task', async () => {
      const res = mockResponse();
      mockedUpdateOwnTask.mockResolvedValue({ ...sampleTask, title: 'Updated' } as any);

      await taskController.update(
        { user: mockUser(), params: { id: '1' }, body: { title: 'Updated', status: 'done' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedUpdateOwnTask).toHaveBeenCalledWith(2, 1, {
        title: 'Updated',
        description: undefined,
        status: 'done',
        priority: undefined,
        dueDate: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('remove', () => {
    it('responds with 200 and data null', async () => {
      const res = mockResponse();
      mockedDeleteOwnTask.mockResolvedValue(undefined);

      await taskController.remove(
        { user: mockUser(), params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedDeleteOwnTask).toHaveBeenCalledWith(2, 1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });
  });
});

// ---------------------------------------------------------------------------
// Admin controller
// ---------------------------------------------------------------------------

describe('admin.task.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('responds with all tasks for the project paginated', async () => {
      const res = mockResponse();
      mockedListAllTasks.mockResolvedValue({ items: [sampleTask as any], total: 1, page: 1, limit: 20 });

      await adminTaskController.list(
        {
          params: { projectId: '1' },
          query: {},
          pagination: { page: 1, limit: 20, skip: 0 },
        } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedListAllTasks).toHaveBeenCalledWith(1, {}, { page: 1, limit: 20, skip: 0 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById', () => {
    it('responds with the task', async () => {
      const res = mockResponse();
      mockedGetTaskById.mockResolvedValue(sampleTask as any);

      await adminTaskController.getById(
        { params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedGetTaskById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('update', () => {
    it('responds with the updated task', async () => {
      const res = mockResponse();
      mockedUpdateTask.mockResolvedValue({ ...sampleTask, title: 'Admin Updated' } as any);

      await adminTaskController.update(
        { params: { id: '1' }, body: { title: 'Admin Updated' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedUpdateTask).toHaveBeenCalledWith(1, {
        title: 'Admin Updated',
        description: undefined,
        status: undefined,
        priority: undefined,
        dueDate: undefined,
      });
    });
  });

  describe('remove', () => {
    it('responds with 200 and data null', async () => {
      const res = mockResponse();
      mockedDeleteTask.mockResolvedValue(undefined);

      await adminTaskController.remove(
        { params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedDeleteTask).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });
  });
});
