import { Request, Response, NextFunction } from 'express';
import { paginationMiddleware, MAX_LIMIT, DEFAULT_LIMIT, DEFAULT_PAGE } from '../../src/middlewares/pagination';

function mockRequest(query: Record<string, unknown> = {}): Partial<Request> {
  return { query } as Partial<Request>;
}

function mockResponse(): Partial<Response> {
  return {} as Partial<Response>;
}

describe('paginationMiddleware', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  it('exports the correct constants', () => {
    expect(MAX_LIMIT).toBe(100);
    expect(DEFAULT_LIMIT).toBe(20);
    expect(DEFAULT_PAGE).toBe(1);
  });

  it('uses default page, limit, and sort when no query params', () => {
    const req = mockRequest() as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination).toEqual({ page: 1, limit: 20, skip: 0, sortBy: undefined, sortOrder: 'DESC' });
    expect(next).toHaveBeenCalledWith();
  });

  it('uses query params when provided', () => {
    const req = mockRequest({ page: '3', limit: '50' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination).toEqual({ page: 3, limit: 50, skip: 100, sortBy: undefined, sortOrder: 'DESC' });
  });

  it('extracts sortBy and sortOrder from query', () => {
    const req = mockRequest({ sortBy: 'title', sortOrder: 'asc' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.sortBy).toBe('title');
    expect(req.pagination!.sortOrder).toBe('ASC');
  });

  it('normalizes sortOrder to uppercase', () => {
    const req = mockRequest({ sortOrder: 'desc' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.sortOrder).toBe('DESC');
  });

  it('defaults sortOrder to DESC when invalid', () => {
    const req = mockRequest({ sortOrder: 'random' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.sortOrder).toBe('DESC');
  });

  it('defaults sortBy to undefined when empty string', () => {
    const req = mockRequest({ sortBy: '' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.sortBy).toBeUndefined();
  });

  it('defaults sortBy to undefined when not a string', () => {
    const req = mockRequest({ sortBy: 123 }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.sortBy).toBeUndefined();
  });

  it('clamps limit to MAX_LIMIT', () => {
    const req = mockRequest({ page: '1', limit: '500' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.limit).toBe(MAX_LIMIT);
    expect(req.pagination!.skip).toBe(0);
  });

  it('clamps page to minimum 1', () => {
    const req = mockRequest({ page: '0', limit: '10' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.page).toBe(1);
    expect(req.pagination!.skip).toBe(0);
  });

  it('treats limit 0 as invalid and uses default', () => {
    const req = mockRequest({ page: '1', limit: '0' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.limit).toBe(DEFAULT_LIMIT);
  });

  it('handles negative page by clamping to 1', () => {
    const req = mockRequest({ page: '-5', limit: '10' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.page).toBe(1);
  });

  it('handles non-numeric page by using default', () => {
    const req = mockRequest({ page: 'abc', limit: '10' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.page).toBe(DEFAULT_PAGE);
  });

  it('handles non-numeric limit by using default', () => {
    const req = mockRequest({ page: '1', limit: 'xyz' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination!.limit).toBe(DEFAULT_LIMIT);
  });

  it('calculates skip correctly for page 2 with limit 10', () => {
    const req = mockRequest({ page: '2', limit: '10' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination).toEqual({ page: 2, limit: 10, skip: 10, sortBy: undefined, sortOrder: 'DESC' });
  });

  it('calculates skip correctly for page 5 with limit 25', () => {
    const req = mockRequest({ page: '5', limit: '25' }) as Request;

    paginationMiddleware(req, mockResponse() as Response, next);

    expect(req.pagination).toEqual({ page: 5, limit: 25, skip: 100, sortBy: undefined, sortOrder: 'DESC' });
  });
});
