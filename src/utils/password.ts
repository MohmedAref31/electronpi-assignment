import bcrypt from 'bcrypt';
import { envVars } from '../config/env';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, envVars.bcryptSaltRounds);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
