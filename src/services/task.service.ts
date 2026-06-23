import { taskRepo } from '../entities';
import { Task } from '../entities/Task';
import { TaskStatus, TaskPriority } from '../entities/enums';
import { ApiError } from '../utils/ApiError';
import { buildOrderClause } from '../utils/sort';
import { getOwnProject, getProjectById } from './project.service';
import type { Pagination } from '../middlewares/pagination';
import type { PaginatedResult } from './project.service';

const TASK_SORT_FIELDS = ['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'];

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
}

function serializeTask(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    projectId: task.projectId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export { serializeTask };

function buildWhereClause(projectId: number, filters: TaskFilters) {
  return {
    projectId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
  };
}

function parseTaskFilters(query: { status?: unknown; priority?: unknown }): TaskFilters {
  const filters: TaskFilters = {};
  if (typeof query.status === 'string' && ['pending', 'in_progress', 'done'].includes(query.status)) {
    filters.status = query.status as TaskStatus;
  }
  if (typeof query.priority === 'string' && ['low', 'medium', 'high'].includes(query.priority)) {
    filters.priority = query.priority as TaskPriority;
  }
  return filters;
}

export { parseTaskFilters };

// ---------------------------------------------------------------------------
// Owner-scoped methods (used by /projects/:projectId/tasks and /tasks routes)
// ---------------------------------------------------------------------------

export async function createTask(
  ownerId: number,
  projectId: number,
  input: CreateTaskInput,
): Promise<Task> {
  await getOwnProject(ownerId, projectId);

  const task = taskRepo.create({
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? TaskStatus.PENDING,
    priority: input.priority ?? TaskPriority.MEDIUM,
    dueDate: input.dueDate ?? null,
    projectId,
  });
  await taskRepo.save(task);
  return task;
}

export async function listOwnTasks(
  ownerId: number,
  projectId: number,
  filters: TaskFilters,
  pagination: Pagination,
): Promise<PaginatedResult<Task>> {
  await getOwnProject(ownerId, projectId);

  const { page, limit, skip } = pagination;
  const [items, total] = await taskRepo.findAndCount({
    where: buildWhereClause(projectId, filters),
    skip,
    take: limit,
    order: buildOrderClause(pagination, TASK_SORT_FIELDS),
  });
  return { items, total, page, limit };
}

export async function getOwnTask(ownerId: number, taskId: number): Promise<Task> {
  const task = await taskRepo
    .createQueryBuilder('task')
    .innerJoin('task.project', 'project', 'project.ownerId = :ownerId', { ownerId })
    .where('task.id = :id', { id: taskId })
    .getOne();

  if (!task) {
    throw ApiError.notFound('Task not found', 'errors.taskNotFound');
  }
  return task;
}

export async function updateOwnTask(
  ownerId: number,
  taskId: number,
  input: UpdateTaskInput,
): Promise<Task> {
  const task = await getOwnTask(ownerId, taskId);
  taskRepo.merge(task, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
  });
  await taskRepo.save(task);
  return task;
}

export async function deleteOwnTask(ownerId: number, taskId: number): Promise<void> {
  const task = await getOwnTask(ownerId, taskId);
  await taskRepo.remove(task);
}

// ---------------------------------------------------------------------------
// Admin-scoped methods (used by /admin/projects/:projectId/tasks and /admin/tasks)
// ---------------------------------------------------------------------------

export async function listAllTasks(
  projectId: number,
  filters: TaskFilters,
  pagination: Pagination,
): Promise<PaginatedResult<Task>> {
  await getProjectById(projectId);

  const { page, limit, skip } = pagination;
  const [items, total] = await taskRepo.findAndCount({
    where: buildWhereClause(projectId, filters),
    skip,
    take: limit,
    order: buildOrderClause(pagination, TASK_SORT_FIELDS),
  });
  return { items, total, page, limit };
}

export async function getTaskById(taskId: number): Promise<Task> {
  const task = await taskRepo.findOneBy({ id: taskId });
  if (!task) {
    throw ApiError.notFound('Task not found', 'errors.taskNotFound');
  }
  return task;
}

export async function updateTask(taskId: number, input: UpdateTaskInput): Promise<Task> {
  const task = await getTaskById(taskId);
  taskRepo.merge(task, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
  });
  await taskRepo.save(task);
  return task;
}

export async function deleteTask(taskId: number): Promise<void> {
  const task = await getTaskById(taskId);
  await taskRepo.remove(task);
}
