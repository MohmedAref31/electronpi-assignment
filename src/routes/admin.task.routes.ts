import { Router } from 'express';
import { list, getById, update, remove } from '../controllers/admin.task.controller';
import { updateTaskRules, taskIdParam, projectIdParam } from '../validators/task.validator';
import { protect, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { paginationMiddleware } from '../middlewares/pagination';
import { UserRole } from '../entities/enums';

// Nested under /admin/projects/:projectId for list
// (protect + authorize are already applied by the parent adminProjectRouter)
// mergeParams: true is required to access :projectId from the parent router
export const adminProjectTasksRouter = Router({ mergeParams: true });

/**
 * GET /api/v1/admin/projects/:projectId/tasks?status=pending&priority=high&page=1&limit=20
 * List tasks for any project (admin only, filtered + paginated).
 */
adminProjectTasksRouter.get(
  '/',
  projectIdParam,
  validateRequest,
  paginationMiddleware,
  list,
);

// Flat routes for single-task admin operations
export const adminTaskRouter = Router();
adminTaskRouter.use(protect, authorize(UserRole.ADMIN));

/**
 * GET /api/v1/admin/tasks/:id
 * Get any task by ID (admin only).
 */
adminTaskRouter.get('/:id', taskIdParam, validateRequest, getById);

/**
 * PUT /api/v1/admin/tasks/:id
 * Update any task by ID (admin only).
 */
adminTaskRouter.put('/:id', taskIdParam, updateTaskRules, validateRequest, update);

/**
 * DELETE /api/v1/admin/tasks/:id
 * Delete any task by ID (admin only).
 */
adminTaskRouter.delete('/:id', taskIdParam, validateRequest, remove);
