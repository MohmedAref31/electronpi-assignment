import { Router } from 'express';
import { create, list, getById, update, remove } from '../controllers/task.controller';
import { createTaskRules, updateTaskRules, taskIdParam, projectIdParam } from '../validators/task.validator';
import { protect } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { paginationMiddleware } from '../middlewares/pagination';

// Nested under /projects/:projectId for create + list
// (protect is already applied by the parent projectRouter)
// mergeParams: true is required to access :projectId from the parent router
export const projectTasksRouter = Router({ mergeParams: true });

/**
 * POST /api/v1/projects/:projectId/tasks
 * Create a task under a project owned by the authenticated user.
 */
projectTasksRouter.post(
  '/',
  projectIdParam,
  createTaskRules,
  validateRequest,
  create,
);

/**
 * GET /api/v1/projects/:projectId/tasks?status=pending&priority=high&page=1&limit=20
 * List tasks for a project owned by the authenticated user (filtered + paginated).
 */
projectTasksRouter.get(
  '/',
  projectIdParam,
  validateRequest,
  paginationMiddleware,
  list,
);

// Flat routes for single-task operations
export const taskRouter = Router();
taskRouter.use(protect);

/**
 * GET /api/v1/tasks/:id
 * Get a single task owned by the authenticated user (via project ownership).
 */
taskRouter.get('/:id', taskIdParam, validateRequest, getById);

/**
 * PUT /api/v1/tasks/:id
 * Update a task owned by the authenticated user.
 */
taskRouter.put('/:id', taskIdParam, updateTaskRules, validateRequest, update);

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task owned by the authenticated user.
 */
taskRouter.delete('/:id', taskIdParam, validateRequest, remove);
