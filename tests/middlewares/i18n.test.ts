import { Request, Response, NextFunction } from 'express';
import { i18nMiddleware } from '../../src/middlewares/i18n';

jest.mock('accept-language-parser', () => ({
  pick: jest.fn(),
}));

jest.mock('i18next', () => ({
  t: jest.fn().mockImplementation((key: string) => `translated:${key}`),
}));

jest.mock('../../src/config/env', () => ({
  envVars: {
    i18n: {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'ar'],
    },
  },
}));

import acceptLanguageParser from 'accept-language-parser';

const mockedPick = acceptLanguageParser.pick as jest.Mock;

function mockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: {},
    query: {},
    ...overrides,
  } as Partial<Request>;
}

function mockResponse(): Partial<Response> {
  return {} as Partial<Response>;
}

function mockNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

describe('i18n middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses language from ?lang= query parameter when valid', () => {
    const req = mockRequest({ query: { lang: 'ar' } } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('ar');
    expect(next).toHaveBeenCalledWith();
  });

  it('falls back to Accept-Language header when no query param', () => {
    mockedPick.mockReturnValue('ar');
    const req = mockRequest({
      headers: { 'accept-language': 'ar,en;q=0.8' },
    } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('ar');
    expect(mockedPick).toHaveBeenCalledWith(['en', 'ar'], 'ar,en;q=0.8', { loose: true });
  });

  it('falls back to default when query param is not a supported language', () => {
    const req = mockRequest({ query: { lang: 'fr' } } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('en');
  });

  it('falls back to default when Accept-Language does not match any supported language', () => {
    mockedPick.mockReturnValue(null);
    const req = mockRequest({
      headers: { 'accept-language': 'zh-CN' },
    } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('en');
  });

  it('falls back to default when no query param and no Accept-Language header', () => {
    const req = mockRequest() as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('en');
  });

  it('query param takes priority over Accept-Language header', () => {
    mockedPick.mockReturnValue('ar');
    const req = mockRequest({
      query: { lang: 'en' },
      headers: { 'accept-language': 'ar' },
    } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('en');
    expect(mockedPick).not.toHaveBeenCalled();
  });

  it('attaches a t function that calls i18next.t with the resolved language', () => {
    const req = mockRequest({ query: { lang: 'ar' } } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(typeof req.t).toBe('function');
    const result = req.t('errors.notFound');
    expect(result).toBe('translated:errors.notFound');
  });

  it('ignores non-string lang query params', () => {
    const req = mockRequest({ query: { lang: ['ar', 'en'] } } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('en');
  });

  it('ignores empty string lang query param', () => {
    const req = mockRequest({ query: { lang: '' } } as Partial<Request>) as Request;
    const next = mockNext();

    i18nMiddleware(req, mockResponse() as Response, next);

    expect(req.language).toBe('en');
  });
});
