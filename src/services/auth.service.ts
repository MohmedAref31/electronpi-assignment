import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/enums';
import { ApiError } from '../utils/ApiError';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export interface AuthResult {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

async function emitAuthResult(user: User): Promise<AuthResult> {
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  return { user, token };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const userRepository = AppDataSource.getRepository(User);

  const existing = await userRepository.findOneBy({ email: input.email });
  if (existing) {
    throw ApiError.conflict('Email is already in use', 'errors.emailInUse');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = userRepository.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: UserRole.MEMBER,
  });
  await userRepository.save(user);

  return emitAuthResult(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.email = :email', { email: input.email })
    .getOne();

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', 'errors.invalidCredentials');
  }

  const isMatch = await comparePassword(input.password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password', 'errors.invalidCredentials');
  }

  // Strip the password before returning
  user.password = '';
  return emitAuthResult(user);
}
