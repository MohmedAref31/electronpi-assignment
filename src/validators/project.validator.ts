import { body, param } from 'express-validator';

export const createProjectRules = [
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
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived'),
];

export const updateProjectRules = [
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
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived'),
];

export const projectIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
];
