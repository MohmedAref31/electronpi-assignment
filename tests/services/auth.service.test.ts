import { registerUser, loginUser } from '../../src/services/auth.service';
import { ApiError } from '../../src/utils/ApiError';
import { UserRole } from '../../src/entities/enums';

jest.mock('../../src/entities', () => ({
  userRepo: {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
}));

jest.mock('../../src/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock-token'),
}));

import { userRepo } from '../../src/entities';
import { hashPassword, comparePassword } from '../../src/utils/password';
import { signToken } from '../../src/utils/jwt';

const mockedUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockedSignToken = signToken as jest.MockedFunction<typeof signToken>;

function makeUser() {
  return {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    role: UserRole.MEMBER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function mockQueryBuilder(user: any | null) {
  const qb = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(user),
  };
  (mockedUserRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
  return qb;
}

describe('auth.service - registerUser', () => {
  beforeEach(() => jest.clearAllMocks());

  const input = { name: 'Jane Doe', email: 'jane@example.com', password: 'password123' };

  it('creates a new user and returns user + token', async () => {
    mockedUserRepo.findOneBy.mockResolvedValue(null);
    mockedUserRepo.create.mockReturnValue(makeUser());
    mockedUserRepo.save.mockResolvedValue(makeUser());

    const result = await registerUser(input);

    expect(result.user).toMatchObject({ id: 1, email: 'jane@example.com' });
    expect(result.token).toBe('mock-token');

    expect(mockedUserRepo.findOneBy).toHaveBeenCalledWith({ email: 'jane@example.com' });
    expect(mockedHashPassword).toHaveBeenCalledWith('password123');
    expect(mockedUserRepo.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashed-password',
      role: UserRole.MEMBER,
    });
    expect(mockedUserRepo.save).toHaveBeenCalled();
    expect(mockedSignToken).toHaveBeenCalledWith({
      id: 1,
      email: 'jane@example.com',
      role: UserRole.MEMBER,
    });
  });

  it('throws ApiError 409 when email already exists', async () => {
    mockedUserRepo.findOneBy.mockResolvedValue(makeUser());

    await expect(registerUser(input)).rejects.toThrow(ApiError);

    try {
      await registerUser(input);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(409);
      expect(apiErr.code).toBe('errors.emailInUse');
    }

    expect(mockedHashPassword).not.toHaveBeenCalled();
    expect(mockedUserRepo.save).not.toHaveBeenCalled();
  });

  it('does not hash the password or save if the user already exists', async () => {
    mockedUserRepo.findOneBy.mockResolvedValue(makeUser());

    try {
      await registerUser(input);
    } catch {
      // expected
    }

    expect(mockedHashPassword).not.toHaveBeenCalled();
    expect(mockedUserRepo.create).not.toHaveBeenCalled();
    expect(mockedUserRepo.save).not.toHaveBeenCalled();
  });
});

describe('auth.service - loginUser', () => {
  beforeEach(() => jest.clearAllMocks());

  const input = { email: 'jane@example.com', password: 'password123' };

  it('returns user + token when credentials are valid', async () => {
    const user = makeUser();
    mockQueryBuilder(user);
    mockedComparePassword.mockResolvedValue(true);

    const result = await loginUser(input);

    expect(result.user).toMatchObject({ id: 1, email: 'jane@example.com' });
    expect(result.token).toBe('mock-token');
    expect(mockedComparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(mockedSignToken).toHaveBeenCalledWith({
      id: 1,
      email: 'jane@example.com',
      role: UserRole.MEMBER,
    });
  });

  it('throws ApiError 401 when user is not found', async () => {
    mockQueryBuilder(null);

    await expect(loginUser(input)).rejects.toThrow(ApiError);

    try {
      await loginUser(input);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(401);
      expect(apiErr.code).toBe('errors.invalidCredentials');
    }

    expect(mockedComparePassword).not.toHaveBeenCalled();
  });

  it('throws ApiError 401 when password does not match', async () => {
    mockQueryBuilder(makeUser());
    mockedComparePassword.mockResolvedValue(false);

    await expect(loginUser(input)).rejects.toThrow(ApiError);

    try {
      await loginUser(input);
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(401);
      expect(apiErr.code).toBe('errors.invalidCredentials');
    }
  });

  it('strips the password from the returned user', async () => {
    const user = makeUser();
    mockQueryBuilder(user);
    mockedComparePassword.mockResolvedValue(true);

    const result = await loginUser(input);

    expect(result.user.password).toBe('');
  });

  it('uses query builder with addSelect for the password column', async () => {
    const qb = mockQueryBuilder(makeUser());
    mockedComparePassword.mockResolvedValue(true);

    await loginUser(input);

    expect(qb.addSelect).toHaveBeenCalledWith('user.password');
    expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'jane@example.com' });
    expect(qb.getOne).toHaveBeenCalled();
  });

  it('throws the same error code for user-not-found and wrong-password (anti-enumeration)', async () => {
    // User not found
    mockQueryBuilder(null);
    let notFoundErr: ApiError | null = null;
    try {
      await loginUser(input);
    } catch (err) {
      notFoundErr = err as ApiError;
    }

    // Wrong password
    mockQueryBuilder(makeUser());
    mockedComparePassword.mockResolvedValue(false);
    let wrongPassErr: ApiError | null = null;
    try {
      await loginUser(input);
    } catch (err) {
      wrongPassErr = err as ApiError;
    }

    expect(notFoundErr?.statusCode).toBe(wrongPassErr?.statusCode);
    expect(notFoundErr?.code).toBe(wrongPassErr?.code);
    expect(notFoundErr?.message).toBe(wrongPassErr?.message);
  });
});
