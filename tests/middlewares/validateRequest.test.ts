import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../src/middlewares/validateRequest';
import { ApiError } from '../../src/utils/ApiError';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

import { validationResult } from 'express-validator';

const mockedValidationResult = validationResult as unknown as jest.Mock;

function mockRequest(): Partial<Request> {
  return {} as Partial<Request>;
}

function mockResponse(): Partial<Response> {
  return {} as Partial<Response>;
}

describe('validateRequest middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next with no args when there are no validation errors', () => {
    mockedValidationResult.mockReturnValue({ isEmpty: () => true });
    const next = jest.fn() as unknown as NextFunction;

    validateRequest(mockRequest() as Request, mockResponse() as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next with ApiError 400 when there are validation errors', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { type: 'field', path: 'email', msg: 'Email is required', value: '' },
        { type: 'field', path: 'password', msg: 'Password is required', value: '' },
      ],
    });
    const next = jest.fn() as unknown as NextFunction;

    validateRequest(mockRequest() as Request, mockResponse() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
  });

  it('formats field errors with field name and message', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { type: 'field', path: 'email', msg: 'A valid email is required', value: 'bad' },
      ],
    });
    const next = jest.fn() as unknown as NextFunction;

    validateRequest(mockRequest() as Request, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.details).toEqual([{ field: 'email', message: 'A valid email is required' }]);
  });

  it('uses the error type as the field name for non-field errors', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ type: 'alternative', msg: 'Unexpected field', nestedErrors: [] }],
    });
    const next = jest.fn() as unknown as NextFunction;

    validateRequest(mockRequest() as Request, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.details).toEqual([{ field: 'alternative', message: 'Unexpected field' }]);
  });

  it('passes the errors.badRequest i18n code', () => {
    mockedValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ type: 'field', path: 'name', msg: 'Name is required' }],
    });
    const next = jest.fn() as unknown as NextFunction;

    validateRequest(mockRequest() as Request, mockResponse() as Response, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.code).toBe('errors.badRequest');
  });
});
