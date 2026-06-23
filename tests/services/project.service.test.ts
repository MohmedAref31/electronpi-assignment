import {
  createProject,
  listOwnProjects,
  getOwnProject,
  updateOwnProject,
  deleteOwnProject,
  listAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  serializeProject,
} from '../../src/services/project.service';
import { ApiError } from '../../src/utils/ApiError';
import { ProjectStatus } from '../../src/entities/enums';

jest.mock('../../src/entities', () => ({
  projectRepo: {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  },
}));

import { projectRepo } from '../../src/entities';

const mockedProjectRepo = projectRepo as jest.Mocked<typeof projectRepo>;

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Website Redesign',
    description: 'A new site',
    status: ProjectStatus.ACTIVE,
    ownerId: 2,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('project.service - createProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a project with the given ownerId', async () => {
    const project = makeProject();
    mockedProjectRepo.create.mockReturnValue(project);
    mockedProjectRepo.save.mockResolvedValue(project);

    const result = await createProject(2, {
      title: 'Website Redesign',
      description: 'A new site',
      status: ProjectStatus.ACTIVE,
    });

    expect(result).toEqual(project);
    expect(mockedProjectRepo.create).toHaveBeenCalledWith({
      title: 'Website Redesign',
      description: 'A new site',
      status: ProjectStatus.ACTIVE,
      ownerId: 2,
    });
    expect(mockedProjectRepo.save).toHaveBeenCalledWith(project);
  });

  it('defaults status to active and description to null when not provided', async () => {
    const project = makeProject();
    mockedProjectRepo.create.mockReturnValue(project);
    mockedProjectRepo.save.mockResolvedValue(project);

    await createProject(2, { title: 'New Project' });

    expect(mockedProjectRepo.create).toHaveBeenCalledWith({
      title: 'New Project',
      description: null,
      status: ProjectStatus.ACTIVE,
      ownerId: 2,
    });
  });
});

describe('project.service - listOwnProjects', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated projects for the given owner', async () => {
    const projects = [makeProject(), makeProject({ id: 2 })];
    mockedProjectRepo.findAndCount.mockResolvedValue([projects, 2]);

    const result = await listOwnProjects(2, { page: 1, limit: 20, skip: 0, sortBy: undefined, sortOrder: 'DESC' as const });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(mockedProjectRepo.findAndCount).toHaveBeenCalledWith({
      where: { ownerId: 2 },
      skip: 0,
      take: 20,
      order: { createdAt: 'DESC' },
    });
  });

  it('uses skip from the pagination object for page 2', async () => {
    mockedProjectRepo.findAndCount.mockResolvedValue([[], 0]);

    await listOwnProjects(2, { page: 2, limit: 10, skip: 10, sortBy: undefined, sortOrder: 'DESC' as const });

    expect(mockedProjectRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

describe('project.service - getOwnProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the project when found for the owner', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);

    const result = await getOwnProject(2, 1);

    expect(result).toEqual(project);
    expect(mockedProjectRepo.findOneBy).toHaveBeenCalledWith({ id: 1, ownerId: 2 });
  });

  it('throws ApiError 404 when project is not found (or not owned)', async () => {
    mockedProjectRepo.findOneBy.mockResolvedValue(null);

    await expect(getOwnProject(2, 999)).rejects.toThrow(ApiError);

    try {
      await getOwnProject(2, 999);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe('errors.projectNotFound');
    }
  });
});

describe('project.service - updateOwnProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates and returns the project', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);
    mockedProjectRepo.save.mockResolvedValue(project);

    const result = await updateOwnProject(2, 1, { title: 'Updated Title' });

    expect(result).toEqual(project);
    expect(mockedProjectRepo.merge).toHaveBeenCalledWith(project, { title: 'Updated Title' });
    expect(mockedProjectRepo.save).toHaveBeenCalledWith(project);
  });

  it('only passes provided fields to merge', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);
    mockedProjectRepo.save.mockResolvedValue(project);

    await updateOwnProject(2, 1, { status: ProjectStatus.COMPLETED });

    expect(mockedProjectRepo.merge).toHaveBeenCalledWith(project, {
      status: ProjectStatus.COMPLETED,
    });
  });

  it('throws 404 when project is not found', async () => {
    mockedProjectRepo.findOneBy.mockResolvedValue(null);

    await expect(updateOwnProject(2, 999, { title: 'X' })).rejects.toThrow(ApiError);
  });
});

describe('project.service - deleteOwnProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes the project when found', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);

    await deleteOwnProject(2, 1);

    expect(mockedProjectRepo.remove).toHaveBeenCalledWith(project);
  });

  it('throws 404 when project is not found', async () => {
    mockedProjectRepo.findOneBy.mockResolvedValue(null);

    await expect(deleteOwnProject(2, 999)).rejects.toThrow(ApiError);
  });
});

// --- Admin-scoped ---

describe('project.service - listAllProjects', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all projects without owner filter', async () => {
    const projects = [makeProject(), makeProject({ id: 2, ownerId: 3 })];
    mockedProjectRepo.findAndCount.mockResolvedValue([projects, 2]);

    const result = await listAllProjects({ page: 1, limit: 20, skip: 0, sortBy: undefined, sortOrder: 'DESC' as const });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockedProjectRepo.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      order: { createdAt: 'DESC' },
    });
  });
});

describe('project.service - getProjectById (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the project when found', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);

    const result = await getProjectById(1);

    expect(result).toEqual(project);
    expect(mockedProjectRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('throws ApiError 404 when project is not found', async () => {
    mockedProjectRepo.findOneBy.mockResolvedValue(null);

    await expect(getProjectById(999)).rejects.toThrow(ApiError);

    try {
      await getProjectById(999);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe('errors.projectNotFound');
    }
  });
});

describe('project.service - updateProject (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates and returns the project', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);
    mockedProjectRepo.save.mockResolvedValue(project);

    const result = await updateProject(1, { title: 'Admin Updated' });

    expect(result).toEqual(project);
    expect(mockedProjectRepo.merge).toHaveBeenCalledWith(project, { title: 'Admin Updated' });
  });

  it('throws 404 when project is not found', async () => {
    mockedProjectRepo.findOneBy.mockResolvedValue(null);

    await expect(updateProject(999, { title: 'X' })).rejects.toThrow(ApiError);
  });
});

describe('project.service - deleteProject (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes the project when found', async () => {
    const project = makeProject();
    mockedProjectRepo.findOneBy.mockResolvedValue(project);

    await deleteProject(1);

    expect(mockedProjectRepo.remove).toHaveBeenCalledWith(project);
  });

  it('throws 404 when project is not found', async () => {
    mockedProjectRepo.findOneBy.mockResolvedValue(null);

    await expect(deleteProject(999)).rejects.toThrow(ApiError);
  });
});

describe('serializeProject', () => {
  it('returns a clean JSON-safe project object', () => {
    const project = makeProject({ id: 5, title: 'Test', ownerId: 10 }) as any;

    const result = serializeProject(project);

    expect(result).toEqual({
      id: 5,
      title: 'Test',
      description: 'A new site',
      status: 'active',
      ownerId: 10,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  });
});
