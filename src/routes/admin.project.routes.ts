import { Router } from 'express';
import {
  list,
  getById,
  update,
  remove,
} from '../controllers/admin.project.controller';
import { updateProjectRules, projectIdParam } from '../validators/project.validator';
import { protect, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { UserRole } from '../entities/enums';

export const adminProjectRouter = Router();

adminProjectRouter.use(protect, authorize(UserRole.ADMIN));

/**
 * GET /api/v1/admin/projects?page=1&limit=20
 * List all projects across all users (admin only, paginated).
 */
adminProjectRouter.get('/', list);

/**
 * GET /api/v1/admin/projects/:id
 * Get any project by ID (admin only).
 */
adminProjectRouter.get('/:id', projectIdParam, validateRequest, getById);

/**
 * PUT /api/v1/admin/projects/:id
 * Update any project by ID (admin only).
 */
adminProjectRouter.put('/:id', projectIdParam, updateProjectRules, validateRequest, update);

/**
 * DELETE /api/v1/admin/projects/:id
 * Delete any project by ID (admin only).
 */
adminProjectRouter.delete('/:id', projectIdParam, validateRequest, remove);
