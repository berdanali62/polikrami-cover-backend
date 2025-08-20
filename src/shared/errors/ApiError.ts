export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const badRequest = (message = 'Bad Request', details?: unknown) => new ApiError(400, message, details);
export const unauthorized = (message = 'Unauthorized', details?: unknown) => new ApiError(401, message, details);
export const forbidden = (message = 'Forbidden', details?: unknown) => new ApiError(403, message, details);
export const notFound = (message = 'Not Found', details?: unknown) => new ApiError(404, message, details);
export const conflict = (message = 'Conflict', details?: unknown) => new ApiError(409, message, details);
export const tooManyRequests = (message = 'Too Many Requests', details?: unknown) => new ApiError(429, message, details);
export const internal = (message = 'Internal Server Error', details?: unknown) => new ApiError(500, message, details);


