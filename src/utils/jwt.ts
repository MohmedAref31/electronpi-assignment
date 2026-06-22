import jwt from 'jsonwebtoken';
import { envVars } from '../config/env';
import { ApiError } from './ApiError';
import { UserRole } from '../entities/enums';

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, envVars.jwtSecret, {
    expiresIn: envVars.jwtExpiresIn as unknown as number,
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, envVars.jwtSecret) as JwtPayload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired token', 'errors.invalidToken');
  }
}
