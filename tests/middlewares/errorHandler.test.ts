import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { ApiError } from '../../src/utils/ApiError';

function mockRequest(t?: (key: string) => string): Partial<Request> {
  return {
    t: t ?? ((key: string) => key),
  } as Partial<Request>;
}

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  it('responds with the ApiError statusCode and translated message', () => {
    const res = mockResponse();
    const err = ApiError.notFound('Resource not found', 'errors.resourceNotFound');

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'errors.resourceNotFound' },
    });
  });

  it('includes details in the response when ApiError has details', () => {
    const res = mockResponse();
    const err = ApiError.badRequest('Validation failed', [{ field: 'email', message: 'Invalid' }]);

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'errors.badRequest',
        details: [{ field: 'email', message: 'Invalid' }],
      },
    });
  });

  it('falls back to the raw message when ApiError has no i18n code', () => {
    const res = mockResponse();
    const err = new ApiError(418, "I'm a teapot");

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: "I'm a teapot" },
    });
  });

  it('maps TypeORM unique violation (23505) to 409', () => {
    const res = mockResponse();
    const err = new Error('duplicate key');
    (err as Error & { code?: string }).code = '23505';

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'errors.uniqueViolation' },
    });
  });

  it('maps TypeORM foreign key violation (23503) to 400', () => {
    const res = mockResponse();
    const err = new Error('FK violation');
    (err as Error & { code?: string }).code = '23503';

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'errors.foreignKeyViolation' },
    });
  });

  it('maps TypeORM not-null violation (23502) to 400', () => {
    const res = mockResponse();
    const err = new Error('not null');
    (err as Error & { code?: string }).code = '23502';

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'errors.notNullViolation' },
    });
  });

  it('returns 500 for a generic Error with no TypeORM code', () => {
    const res = mockResponse();
    const err = new Error('something went wrong');

    errorHandler(err, mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'something went wrong' },
    });
  });

  it('returns 500 with internal message for non-Error throws', () => {
    const res = mockResponse();

    errorHandler('string error', mockRequest() as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'errors.internal' },
    });
  });

  it('uses fallback t function when req.t is not defined', () => {
    const res = mockResponse();
    const err = ApiError.notFound('Resource not found', 'errors.resourceNotFound');

    errorHandler(err, {} as Request, res as Response, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'errors.resourceNotFound' },
    });
  });

  it('uses the request t function for translation', () => {
    const res = mockResponse();
    const err = ApiError.notFound('Resource not found', 'errors.resourceNotFound');
    const customT = (key: string) => `AR:${key}`;

    errorHandler(err, mockRequest(customT) as Request, res as Response, jest.fn() as NextFunction);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'AR:errors.resourceNotFound' },
    });
  });
});
