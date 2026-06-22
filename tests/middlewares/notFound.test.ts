import { Request, Response, NextFunction } from 'express';
import { notFoundHandler } from '../../src/middlewares/notFound';
import { ApiError } from '../../src/utils/ApiError';

describe('notFoundHandler middleware', () => {
  it('calls next with an ApiError with 404 status', () => {
    const next = jest.fn() as unknown as NextFunction;

    notFoundHandler({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(404);
  });

  it('passes the errors.resourceNotFound i18n code', () => {
    const next = jest.fn() as unknown as NextFunction;

    notFoundHandler({} as Request, {} as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.code).toBe('errors.resourceNotFound');
  });

  it('passes a descriptive default message', () => {
    const next = jest.fn() as unknown as NextFunction;

    notFoundHandler({} as Request, {} as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.message).toBe('Resource not found');
  });
});
