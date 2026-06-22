import { userRepo } from '../entities';
import { UserRole } from '../entities/enums';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';

export interface AdminSeedInput {
  name: string;
  email: string;
  password: string;
}

const DEFAULT_ADMIN: AdminSeedInput = {
  name: 'System Admin',
  email: 'admin@projecttask.com',
  password: 'Admin@12345',
};

/**
 * Seeds the default admin user. Idempotent - skips if the admin email already exists.
 * Override credentials via ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD env vars.
 */
export async function seedAdmin(): Promise<void> {
  const admin: AdminSeedInput = {
    name: process.env.ADMIN_NAME ?? DEFAULT_ADMIN.name,
    email: process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN.email,
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN.password,
  };

  const existing = await userRepo.findOneBy({ email: admin.email });
  if (existing) {
    logger.info('Admin seeder: admin user already exists, skipping', { email: admin.email });
    return;
  }

  const hashedPassword = await hashPassword(admin.password);

  const user = userRepo.create({
    name: admin.name,
    email: admin.email,
    password: hashedPassword,
    role: UserRole.ADMIN,
  });
  await userRepo.save(user);

  logger.info('Admin seeder: created default admin user', {
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
