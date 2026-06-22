import { Request, Response, NextFunction } from 'express';
import { register, login } from '../../src/controllers/auth.controller';

jest.mock('../../src/services/auth.service', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

import { registerUser, loginUser } from '../../src/services/auth.service';

const mockedRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
const mockedLoginUser = loginUser as jest.MockedFunction<typeof loginUser>;

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockRequest(body: Record<string, unknown> = {}): Partial<Request> {
  return { body } as Partial<Request>;
}

const sampleUser = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'member',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('auth.controller - register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('responds with 201 and the user + token on success', async () => {
    const res = mockResponse();
    mockedRegisterUser.mockResolvedValue({
      user: sampleUser as any,
      token: 'mock-token',
    });

    await register(
      mockRequest({ name: 'Jane', email: 'jane@example.com', password: 'password123' }) as Request,
      res as Response,
      jest.fn() as NextFunction,
    );

    expect(mockedRegisterUser).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'member',
          createdAt: sampleUser.createdAt,
        },
        token: 'mock-token',
      },
    });
  });

  it('passes errors to next() when registerUser throws', async () => {
    const next = jest.fn() as unknown as NextFunction;
    const error = new Error('Email already in use');
    mockedRegisterUser.mockRejectedValue(error);

    await register(
      mockRequest({ name: 'Jane', email: 'jane@example.com', password: 'password123' }) as Request,
      mockResponse() as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not call res.status or res.json when an error occurs', async () => {
    const res = mockResponse();
    mockedRegisterUser.mockRejectedValue(new Error('fail'));

    await register(
      mockRequest({}) as Request,
      res as Response,
      jest.fn() as NextFunction,
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('auth.controller - login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('responds with 200 and the user + token on success', async () => {
    const res = mockResponse();
    mockedLoginUser.mockResolvedValue({
      user: sampleUser as any,
      token: 'mock-token',
    });

    await login(
      mockRequest({ email: 'jane@example.com', password: 'password123' }) as Request,
      res as Response,
      jest.fn() as NextFunction,
    );

    expect(mockedLoginUser).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'member',
          createdAt: sampleUser.createdAt,
        },
        token: 'mock-token',
      },
    });
  });

  it('passes errors to next() when loginUser throws', async () => {
    const next = jest.fn() as unknown as NextFunction;
    const error = new Error('Invalid credentials');
    mockedLoginUser.mockRejectedValue(error);

    await login(
      mockRequest({ email: 'jane@example.com', password: 'wrong' }) as Request,
      mockResponse() as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not call res.status or res.json when an error occurs', async () => {
    const res = mockResponse();
    mockedLoginUser.mockRejectedValue(new Error('fail'));

    await login(
      mockRequest({}) as Request,
      res as Response,
      jest.fn() as NextFunction,
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('passes only email and password from the body to loginUser', async () => {
    const res = mockResponse();
    mockedLoginUser.mockResolvedValue({ user: sampleUser as any, token: 't' });

    await login(
      mockRequest({ email: 'jane@example.com', password: 'password123', extra: 'ignored' }) as Request,
      res as Response,
      jest.fn() as NextFunction,
    );

    expect(mockedLoginUser).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'password123',
    });
  });
});
