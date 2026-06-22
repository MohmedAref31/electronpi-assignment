import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
} from '../controllers/project.controller';
import { createProjectRules, updateProjectRules, projectIdParam } from '../validators/project.validator';
import { protect } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { paginationMiddleware } from '../middlewares/pagination';
import { projectTasksRouter } from './task.routes';

export const projectRouter = Router();

projectRouter.use(protect);

/**
 * POST /api/v1/projects
 * Create a new project owned by the authenticated user.
 */
projectRouter.post('/', createProjectRules, validateRequest, create);

/**
 * GET /api/v1/projects?page=1&limit=20
 * List the authenticated user's projects (paginated).
 */
projectRouter.get('/', paginationMiddleware, list);

/**
 * GET /api/v1/projects/:id
 * Get a single project owned by the authenticated user.
 */
projectRouter.get('/:id', projectIdParam, validateRequest, getById);

/**
 * PUT /api/v1/projects/:id
 * Update a project owned by the authenticated user.
 */
projectRouter.put('/:id', projectIdParam, updateProjectRules, validateRequest, update);

/**
 * DELETE /api/v1/projects/:id
 * Delete a project owned by the authenticated user.
 */
projectRouter.delete('/:id', projectIdParam, validateRequest, remove);

// Nested task routes under projects
projectRouter.use('/:projectId/tasks', projectTasksRouter);
