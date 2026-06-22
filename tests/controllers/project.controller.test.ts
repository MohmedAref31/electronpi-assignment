import { Request, Response, NextFunction } from 'express';
import * as projectController from '../../src/controllers/project.controller';
import * as adminProjectController from '../../src/controllers/admin.project.controller';

jest.mock('../../src/services/project.service', () => ({
  createProject: jest.fn(),
  listOwnProjects: jest.fn(),
  getOwnProject: jest.fn(),
  updateOwnProject: jest.fn(),
  deleteOwnProject: jest.fn(),
  listAllProjects: jest.fn(),
  getProjectById: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  serializeProject: jest.fn((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    ownerId: p.ownerId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  })),
}));

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
} from '../../src/services/project.service';

const mockedCreateProject = createProject as jest.MockedFunction<typeof createProject>;
const mockedListOwnProjects = listOwnProjects as jest.MockedFunction<typeof listOwnProjects>;
const mockedGetOwnProject = getOwnProject as jest.MockedFunction<typeof getOwnProject>;
const mockedUpdateOwnProject = updateOwnProject as jest.MockedFunction<typeof updateOwnProject>;
const mockedDeleteOwnProject = deleteOwnProject as jest.MockedFunction<typeof deleteOwnProject>;
const mockedListAllProjects = listAllProjects as jest.MockedFunction<typeof listAllProjects>;
const mockedGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>;
const mockedUpdateProject = updateProject as jest.MockedFunction<typeof updateProject>;
const mockedDeleteProject = deleteProject as jest.MockedFunction<typeof deleteProject>;

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockUser(overrides: Record<string, unknown> = {}) {
  return { id: 2, name: 'Jane', email: 'jane@example.com', role: 'member', ...overrides };
}

const sampleProject = {
  id: 1,
  title: 'Website Redesign',
  description: 'A new site',
  status: 'active',
  ownerId: 2,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

// ---------------------------------------------------------------------------
// Member controller
// ---------------------------------------------------------------------------

describe('project.controller (member)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('responds with 201 and the created project', async () => {
      const res = mockResponse();
      mockedCreateProject.mockResolvedValue(sampleProject as any);

      await projectController.create(
        { user: mockUser(), body: { title: 'Test', description: 'Desc' } } as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedCreateProject).toHaveBeenCalledWith(2, {
        title: 'Test',
        description: 'Desc',
        status: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { project: expect.objectContaining({ id: 1 }) },
      });
    });

    it('passes errors to next', async () => {
      const next = jest.fn() as unknown as NextFunction;
      mockedCreateProject.mockRejectedValue(new Error('fail'));

      await projectController.create(
        { user: mockUser(), body: {} } as Request,
        mockResponse() as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('list', () => {
    it('responds with paginated projects', async () => {
      const res = mockResponse();
      mockedListOwnProjects.mockResolvedValue({
        items: [sampleProject as any],
        total: 1,
        page: 1,
        limit: 20,
      });

      await projectController.list(
        { user: mockUser(), pagination: { page: 1, limit: 20, skip: 0 } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedListOwnProjects).toHaveBeenCalledWith(2, { page: 1, limit: 20, skip: 0 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { projects: [expect.objectContaining({ id: 1 })], total: 1, page: 1, limit: 20 },
      });
    });
  });

  describe('getById', () => {
    it('responds with the project', async () => {
      const res = mockResponse();
      mockedGetOwnProject.mockResolvedValue(sampleProject as any);

      await projectController.getById(
        { user: mockUser(), params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedGetOwnProject).toHaveBeenCalledWith(2, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('passes errors to next when project not found', async () => {
      const next = jest.fn() as unknown as NextFunction;
      mockedGetOwnProject.mockRejectedValue(new Error('not found'));

      await projectController.getById(
        { user: mockUser(), params: { id: '999' } } as unknown as Request,
        mockResponse() as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('responds with the updated project', async () => {
      const res = mockResponse();
      mockedUpdateOwnProject.mockResolvedValue({ ...sampleProject, title: 'Updated' } as any);

      await projectController.update(
        { user: mockUser(), params: { id: '1' }, body: { title: 'Updated' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedUpdateOwnProject).toHaveBeenCalledWith(2, 1, {
        title: 'Updated',
        description: undefined,
        status: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('remove', () => {
    it('responds with 200 and data null', async () => {
      const res = mockResponse();
      mockedDeleteOwnProject.mockResolvedValue(undefined);

      await projectController.remove(
        { user: mockUser(), params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedDeleteOwnProject).toHaveBeenCalledWith(2, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });
  });
});

// ---------------------------------------------------------------------------
// Admin controller
// ---------------------------------------------------------------------------

describe('admin.project.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('responds with all projects paginated', async () => {
      const res = mockResponse();
      mockedListAllProjects.mockResolvedValue({
        items: [sampleProject as any],
        total: 1,
        page: 1,
        limit: 20,
      });

      await adminProjectController.list(
        { pagination: { page: 1, limit: 20, skip: 0 } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedListAllProjects).toHaveBeenCalledWith({ page: 1, limit: 20, skip: 0 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { projects: [expect.objectContaining({ id: 1 })], total: 1, page: 1, limit: 20 },
      });
    });
  });

  describe('getById', () => {
    it('responds with the project', async () => {
      const res = mockResponse();
      mockedGetProjectById.mockResolvedValue(sampleProject as any);

      await adminProjectController.getById(
        { params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedGetProjectById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('update', () => {
    it('responds with the updated project', async () => {
      const res = mockResponse();
      mockedUpdateProject.mockResolvedValue({ ...sampleProject, title: 'Admin Updated' } as any);

      await adminProjectController.update(
        { params: { id: '1' }, body: { title: 'Admin Updated' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedUpdateProject).toHaveBeenCalledWith(1, {
        title: 'Admin Updated',
        description: undefined,
        status: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('remove', () => {
    it('responds with 200 and data null', async () => {
      const res = mockResponse();
      mockedDeleteProject.mockResolvedValue(undefined);

      await adminProjectController.remove(
        { params: { id: '1' } } as unknown as Request,
        res as Response,
        jest.fn() as NextFunction,
      );

      expect(mockedDeleteProject).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
    });
  });
});
