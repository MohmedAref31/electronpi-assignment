export interface ApiErrorOptions {
  /** i18n translation key (e.g. "errors.notFound"). When set, the error handler translates it. */
  code?: string;
  /** Optional interpolation params passed to i18next.t */
  params?: Record<string, unknown>;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly code?: string;
  public readonly params?: Record<string, unknown>;

  constructor(statusCode: number, message: string, details?: unknown, options?: ApiErrorOptions) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = options?.code;
    this.params = options?.params;
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string = 'Bad Request', details?: unknown, code: string = 'errors.badRequest'): ApiError {
    return new ApiError(400, message, details, { code });
  }

  static unauthorized(message: string = 'Unauthorized', code: string = 'errors.unauthorized'): ApiError {
    return new ApiError(401, message, undefined, { code });
  }

  static forbidden(message: string = 'Forbidden', code: string = 'errors.forbidden'): ApiError {
    return new ApiError(403, message, undefined, { code });
  }

  static notFound(message: string = 'Resource not found', code: string = 'errors.notFound'): ApiError {
    return new ApiError(404, message, undefined, { code });
  }

  static conflict(message: string = 'Conflict', code: string = 'errors.conflict'): ApiError {
    return new ApiError(409, message, undefined, { code });
  }

  static internal(message: string = 'Internal Server Error', code: string = 'errors.internal'): ApiError {
    return new ApiError(500, message, undefined, { code });
  }
}
