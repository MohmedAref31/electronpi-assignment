import { Request, Response, NextFunction } from 'express';
import { protect, authorize } from '../../src/middlewares/auth';
import { ApiError } from '../../src/utils/ApiError';
import { UserRole } from '../../src/entities/enums';

jest.mock('../../src/entities', () => ({
  userRepo: {
    findOneBy: jest.fn(),
  },
}));

jest.mock('../../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

import { userRepo } from '../../src/entities';
import { verifyToken } from '../../src/utils/jwt';

const mockedUserRepo = userRepo as jest.Mocked<typeof userRepo>;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

function mockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: {},
    ...overrides,
  } as Partial<Request>;
}

function mockResponse(): Partial<Response> {
  return {} as Partial<Response>;
}

function mockNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Jane',
    email: 'jane@example.com',
    password: 'hashed',
    role: UserRole.MEMBER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('protect middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next with ApiError 401 when no Authorization header is present', async () => {
    const req = mockRequest() as Request;
    const next = mockNext();

    await protect(req, mockResponse() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('errors.missingToken');
  });

  it('calls next with ApiError 401 when header does not start with Bearer', async () => {
    const req = mockRequest({ headers: { authorization: 'Basic abc' } } as Partial<Request>) as Request;
    const next = mockNext();

    await protect(req, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('errors.missingToken');
  });

  it('calls next with error when verifyToken throws', async () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer invalid-token' },
    } as Partial<Request>) as Request;
    const next = mockNext();

    mockedVerifyToken.mockImplementation(() => {
      throw ApiError.unauthorized('Invalid or expired token', 'errors.invalidToken');
    });

    await protect(req, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('errors.invalidToken');
  });

  it('calls next with ApiError 401 when user is not found in DB', async () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer valid-token' },
    } as Partial<Request>) as Request;
    const next = mockNext();

    mockedVerifyToken.mockReturnValue({ id: 999, email: 'ghost@example.com', role: UserRole.MEMBER });
    mockedUserRepo.findOneBy.mockResolvedValue(null);

    await protect(req, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('errors.invalidToken');
    expect(mockedUserRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
  });

  it('attaches user to req.user and calls next with no args when valid', async () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer valid-token' },
    } as Partial<Request>) as Request;
    const next = mockNext();
    const user = makeUser();

    mockedVerifyToken.mockReturnValue({ id: 1, email: 'jane@example.com', role: UserRole.MEMBER });
    mockedUserRepo.findOneBy.mockResolvedValue(user);

    await protect(req, mockResponse() as Response, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('extracts token correctly when it has extra whitespace', async () => {
    const req = mockRequest({
      headers: { authorization: 'Bearer   spaced-token   ' },
    } as Partial<Request>) as Request;
    const next = mockNext();

    mockedVerifyToken.mockReturnValue({ id: 1, email: 'jane@example.com', role: UserRole.MEMBER });
    mockedUserRepo.findOneBy.mockResolvedValue(makeUser());

    await protect(req, mockResponse() as Response, next);

    expect(mockedVerifyToken).toHaveBeenCalledWith('spaced-token');
  });
});

describe('authorize middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next with ApiError 401 when req.user is not set', () => {
    const req = mockRequest() as Request;
    const next = mockNext();

    const middleware = authorize(UserRole.ADMIN);
    middleware(req, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('errors.missingToken');
  });

  it('calls next with ApiError 403 when user role is not in allowed roles', () => {
    const req = mockRequest({ user: makeUser({ role: UserRole.MEMBER }) } as Partial<Request>) as Request;
    const next = mockNext();

    const middleware = authorize(UserRole.ADMIN);
    middleware(req, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('errors.accessDenied');
  });

  it('calls next with no args when user role is allowed', () => {
    const req = mockRequest({ user: makeUser({ role: UserRole.ADMIN }) } as Partial<Request>) as Request;
    const next = mockNext();

    const middleware = authorize(UserRole.ADMIN, UserRole.MEMBER);
    middleware(req, mockResponse() as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows access when user has one of the multiple allowed roles', () => {
    const req = mockRequest({ user: makeUser({ role: UserRole.MEMBER }) } as Partial<Request>) as Request;
    const next = mockNext();

    const middleware = authorize(UserRole.ADMIN, UserRole.MEMBER);
    middleware(req, mockResponse() as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
