import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../shared/errors/ApiError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details ?? undefined });
  }
  // Handle generic errors carrying a status (e.g., CORS origin rejection)
  if (err && typeof err === 'object' && 'message' in err) {
    const anyErr = err as { message?: string; status?: number };
    if (anyErr.status && typeof anyErr.status === 'number') {
      return res.status(anyErr.status).json({ message: anyErr.message ?? 'Error' });
    }
  }
  if (err instanceof Error) {
    logger.error({ msg: err.message, stack: err.stack }, 'Unhandled error');
  } else {
    logger.error({ err }, 'Unhandled error');
  }
  res.status(500).json({ message: 'Internal Server Error' });
}

