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
  serializeTask,
  parseTaskFilters,
} from '../../src/services/task.service';
import { ApiError } from '../../src/utils/ApiError';
import { TaskStatus, TaskPriority } from '../../src/entities/enums';

jest.mock('../../src/entities', () => ({
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

jest.mock('../../src/services/project.service', () => ({
  getOwnProject: jest.fn(),
  getProjectById: jest.fn(),
  serializeProject: jest.fn(),
}));

import { taskRepo } from '../../src/entities';
import { getOwnProject, getProjectById } from '../../src/services/project.service';

const mockedTaskRepo = taskRepo as jest.Mocked<typeof taskRepo>;
const mockedGetOwnProject = getOwnProject as jest.MockedFunction<typeof getOwnProject>;
const mockedGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>;

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Audit current site',
    description: 'Review existing pages',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2026-02-01T00:00:00.000Z'),
    projectId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function mockQueryBuilder(task: any | null) {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(task),
  };
  (mockedTaskRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
  return qb;
}

const pagination = { page: 1, limit: 20, skip: 0, sortBy: undefined, sortOrder: 'DESC' as const };

// ---------------------------------------------------------------------------
// Owner-scoped
// ---------------------------------------------------------------------------

describe('task.service - createTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a task after verifying project ownership', async () => {
    mockedGetOwnProject.mockResolvedValue({} as any);
    mockedTaskRepo.create.mockReturnValue(makeTask());
    mockedTaskRepo.save.mockResolvedValue(makeTask());

    const result = await createTask(2, 1, {
      title: 'New Task',
      description: 'A task',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2026-02-01'),
    });

    expect(result).toMatchObject({ id: 1, title: 'Audit current site' });
    expect(mockedGetOwnProject).toHaveBeenCalledWith(2, 1);
    expect(mockedTaskRepo.create).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'A task',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2026-02-01'),
      projectId: 1,
    });
  });

  it('defaults status, priority, and dueDate when not provided', async () => {
    mockedGetOwnProject.mockResolvedValue({} as any);
    mockedTaskRepo.create.mockReturnValue(makeTask());
    mockedTaskRepo.save.mockResolvedValue(makeTask());

    await createTask(2, 1, { title: 'Simple Task' });

    expect(mockedTaskRepo.create).toHaveBeenCalledWith({
      title: 'Simple Task',
      description: null,
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: null,
      projectId: 1,
    });
  });

  it('throws if the project is not owned by the user', async () => {
    mockedGetOwnProject.mockRejectedValue(ApiError.notFound('Project not found', 'errors.projectNotFound'));

    await expect(createTask(2, 999, { title: 'Task' })).rejects.toThrow(ApiError);
    expect(mockedTaskRepo.create).not.toHaveBeenCalled();
  });
});

describe('task.service - listOwnTasks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated tasks for an owned project', async () => {
    mockedGetOwnProject.mockResolvedValue({} as any);
    mockedTaskRepo.findAndCount.mockResolvedValue([[makeTask()], 1]);

    const result = await listOwnTasks(2, 1, {}, pagination);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockedTaskRepo.findAndCount).toHaveBeenCalledWith({
      where: { projectId: 1 },
      skip: 0,
      take: 20,
      order: { createdAt: 'DESC' },
    });
  });

  it('applies status and priority filters', async () => {
    mockedGetOwnProject.mockResolvedValue({} as any);
    mockedTaskRepo.findAndCount.mockResolvedValue([[], 0]);

    await listOwnTasks(2, 1, { status: TaskStatus.PENDING, priority: TaskPriority.HIGH }, pagination);

    expect(mockedTaskRepo.findAndCount).toHaveBeenCalledWith({
      where: { projectId: 1, status: TaskStatus.PENDING, priority: TaskPriority.HIGH },
      skip: 0,
      take: 20,
      order: { createdAt: 'DESC' },
    });
  });

  it('throws if the project is not owned', async () => {
    mockedGetOwnProject.mockRejectedValue(ApiError.notFound('', 'errors.projectNotFound'));

    await expect(listOwnTasks(2, 999, {}, pagination)).rejects.toThrow(ApiError);
  });
});

describe('task.service - getOwnTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the task when the user owns the project', async () => {
    mockQueryBuilder(makeTask());

    const result = await getOwnTask(2, 1);

    expect(result).toMatchObject({ id: 1 });
  });

  it('throws 404 when the task does not exist or project is not owned', async () => {
    mockQueryBuilder(null);

    await expect(getOwnTask(2, 999)).rejects.toThrow(ApiError);

    try {
      await getOwnTask(2, 999);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe('errors.taskNotFound');
    }
  });
});

describe('task.service - updateOwnTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates and returns the task', async () => {
    const task = makeTask();
    mockQueryBuilder(task);
    mockedTaskRepo.save.mockResolvedValue(task);

    const result = await updateOwnTask(2, 1, { title: 'Updated', status: TaskStatus.DONE });

    expect(result).toEqual(task);
    expect(mockedTaskRepo.merge).toHaveBeenCalledWith(task, {
      title: 'Updated',
      status: TaskStatus.DONE,
    });
  });

  it('throws 404 when task is not found', async () => {
    mockQueryBuilder(null);

    await expect(updateOwnTask(2, 999, { title: 'X' })).rejects.toThrow(ApiError);
  });
});

describe('task.service - deleteOwnTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes the task when found', async () => {
    const task = makeTask();
    mockQueryBuilder(task);

    await deleteOwnTask(2, 1);

    expect(mockedTaskRepo.remove).toHaveBeenCalledWith(task);
  });

  it('throws 404 when task is not found', async () => {
    mockQueryBuilder(null);

    await expect(deleteOwnTask(2, 999)).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// Admin-scoped
// ---------------------------------------------------------------------------

describe('task.service - listAllTasks (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated tasks for any project', async () => {
    mockedGetProjectById.mockResolvedValue({} as any);
    mockedTaskRepo.findAndCount.mockResolvedValue([[makeTask()], 1]);

    const result = await listAllTasks(1, {}, pagination);

    expect(result.items).toHaveLength(1);
    expect(mockedGetProjectById).toHaveBeenCalledWith(1);
  });

  it('throws 404 when the project does not exist', async () => {
    mockedGetProjectById.mockRejectedValue(ApiError.notFound('', 'errors.projectNotFound'));

    await expect(listAllTasks(999, {}, pagination)).rejects.toThrow(ApiError);
  });
});

describe('task.service - getTaskById (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the task when found', async () => {
    mockedTaskRepo.findOneBy.mockResolvedValue(makeTask() as any);

    const result = await getTaskById(1);

    expect(result).toMatchObject({ id: 1 });
    expect(mockedTaskRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('throws 404 when task is not found', async () => {
    mockedTaskRepo.findOneBy.mockResolvedValue(null);

    try {
      await getTaskById(999);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe('errors.taskNotFound');
    }
  });
});

describe('task.service - updateTask (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates and returns any task', async () => {
    const task = makeTask();
    mockedTaskRepo.findOneBy.mockResolvedValue(task as any);
    mockedTaskRepo.save.mockResolvedValue(task as any);

    await updateTask(1, { status: TaskStatus.DONE });

    expect(mockedTaskRepo.merge).toHaveBeenCalledWith(task, { status: TaskStatus.DONE });
  });

  it('throws 404 when task is not found', async () => {
    mockedTaskRepo.findOneBy.mockResolvedValue(null);

    await expect(updateTask(999, { title: 'X' })).rejects.toThrow(ApiError);
  });
});

describe('task.service - deleteTask (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes any task', async () => {
    const task = makeTask();
    mockedTaskRepo.findOneBy.mockResolvedValue(task as any);

    await deleteTask(1);

    expect(mockedTaskRepo.remove).toHaveBeenCalledWith(task);
  });

  it('throws 404 when task is not found', async () => {
    mockedTaskRepo.findOneBy.mockResolvedValue(null);

    await expect(deleteTask(999)).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('serializeTask', () => {
  it('returns a clean JSON-safe task object', () => {
    const task = makeTask({ id: 5, title: 'Test' }) as any;

    const result = serializeTask(task);

    expect(result).toEqual({
      id: 5,
      title: 'Test',
      description: 'Review existing pages',
      status: 'pending',
      priority: 'high',
      dueDate: task.dueDate,
      projectId: 1,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  });
});

describe('parseTaskFilters', () => {
  it('returns empty object when no filters provided', () => {
    expect(parseTaskFilters({})).toEqual({});
  });

  it('parses valid status and priority', () => {
    expect(parseTaskFilters({ status: 'pending', priority: 'high' })).toEqual({
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
    });
  });

  it('ignores invalid status values', () => {
    expect(parseTaskFilters({ status: 'invalid' })).toEqual({});
  });

  it('ignores invalid priority values', () => {
    expect(parseTaskFilters({ priority: 'urgent' })).toEqual({});
  });

  it('ignores non-string values', () => {
    expect(parseTaskFilters({ status: 123, priority: ['high'] })).toEqual({});
  });

  it('parses in_progress status correctly', () => {
    expect(parseTaskFilters({ status: 'in_progress' })).toEqual({
      status: TaskStatus.IN_PROGRESS,
    });
  });
});
