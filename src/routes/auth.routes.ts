import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { registerRules, loginRules } from '../validators/auth.validator';
import { validateRequest } from '../middlewares/validateRequest';

export const authRouter = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user (Name, Email, Password). Returns the user and a JWT access token.
 */
authRouter.post('/register', registerRules, validateRequest, register);

/**
 * POST /api/v1/auth/login
 * Authenticate with email + password. Returns the user and a JWT access token.
 */
authRouter.post('/login', loginRules, validateRequest, login);
