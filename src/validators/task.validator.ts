import { body, param } from 'express-validator';

export const createTaskRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),

  body('status')
    .optional()
    .trim()
    .isIn(['pending', 'in_progress', 'done'])
    .withMessage('Status must be one of: pending, in_progress, done'),

  body('priority')
    .optional()
    .trim()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
];

export const updateTaskRules = [
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),

  body('status')
    .optional()
    .trim()
    .isIn(['pending', 'in_progress', 'done'])
    .withMessage('Status must be one of: pending, in_progress, done'),

  body('priority')
    .optional()
    .trim()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),

  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
];

export const taskIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
];

export const projectIdParam = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
];
