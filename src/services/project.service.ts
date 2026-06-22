import { projectRepo } from '../entities';
import { Project } from '../entities/Project';
import { ProjectStatus } from '../entities/enums';
import { ApiError } from '../utils/ApiError';

export interface CreateProjectInput {
  title: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

function parsePagination(query: { page?: unknown; limit?: unknown }): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const rawLimit = parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

function serializeProject(project: Project) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export { serializeProject };

// ---------------------------------------------------------------------------
// Owner-scoped methods (used by /projects routes)
// ---------------------------------------------------------------------------

export async function createProject(ownerId: number, input: CreateProjectInput): Promise<Project> {
  const project = projectRepo.create({
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? ProjectStatus.ACTIVE,
    ownerId,
  });
  await projectRepo.save(project);
  return project;
}

export async function listOwnProjects(
  ownerId: number,
  query: { page?: unknown; limit?: unknown },
): Promise<PaginatedResult<Project>> {
  const { page, limit, skip } = parsePagination(query);
  const [items, total] = await projectRepo.findAndCount({
    where: { ownerId },
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  return { items, total, page, limit };
}

export async function getOwnProject(ownerId: number, id: number): Promise<Project> {
  const project = await projectRepo.findOneBy({ id, ownerId });
  if (!project) {
    throw ApiError.notFound('Project not found', 'errors.projectNotFound');
  }
  return project;
}

export async function updateOwnProject(
  ownerId: number,
  id: number,
  input: UpdateProjectInput,
): Promise<Project> {
  const project = await getOwnProject(ownerId, id);
  projectRepo.merge(project, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  });
  await projectRepo.save(project);
  return project;
}

export async function deleteOwnProject(ownerId: number, id: number): Promise<void> {
  const project = await getOwnProject(ownerId, id);
  await projectRepo.remove(project);
}

// ---------------------------------------------------------------------------
// Admin-scoped methods (used by /admin/projects routes)
// ---------------------------------------------------------------------------

export async function listAllProjects(
  query: { page?: unknown; limit?: unknown },
): Promise<PaginatedResult<Project>> {
  const { page, limit, skip } = parsePagination(query);
  const [items, total] = await projectRepo.findAndCount({
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  return { items, total, page, limit };
}

export async function getProjectById(id: number): Promise<Project> {
  const project = await projectRepo.findOneBy({ id });
  if (!project) {
    throw ApiError.notFound('Project not found', 'errors.projectNotFound');
  }
  return project;
}

export async function updateProject(id: number, input: UpdateProjectInput): Promise<Project> {
  const project = await getProjectById(id);
  projectRepo.merge(project, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  });
  await projectRepo.save(project);
  return project;
}

export async function deleteProject(id: number): Promise<void> {
  const project = await getProjectById(id);
  await projectRepo.remove(project);
}
