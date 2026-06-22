import { Request, Response, NextFunction } from 'express';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums';
import { userRepo } from '../entities';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

declare module 'express-serve-static-core' {
  interface Request {
    /** Authenticated user, set by the protect middleware */
    user?: User;
  }
}

/**
 * Protect middleware - requires a valid JWT in the Authorization header.
 * Loads the user from the DB and attaches it to req.user.
 */
export async function protect(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is required', 'errors.missingToken');
    }

    const token = header.slice('Bearer '.length).trim();
    const decoded = verifyToken(token);

    const user = await userRepo.findOneBy({ id: decoded.id });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists', 'errors.invalidToken');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based access control gate.
 * Usage: router.delete('/projects/:id', protect, authorize(UserRole.ADMIN), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required', 'errors.missingToken'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have access to this resource', 'errors.accessDenied'));
      return;
    }
    next();
  };
}
