export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    // Restore prototype chain (needed when targeting ES5/ES6 with built-in Error)
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string = 'Bad Request', details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string = 'Conflict'): ApiError {
    return new ApiError(409, message);
  }

  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(500, message);
  }
}
