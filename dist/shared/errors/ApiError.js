"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internal = exports.tooManyRequests = exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.ApiError = ApiError;
const badRequest = (message = 'Bad Request', details) => new ApiError(400, message, details);
exports.badRequest = badRequest;
const unauthorized = (message = 'Unauthorized', details) => new ApiError(401, message, details);
exports.unauthorized = unauthorized;
const forbidden = (message = 'Forbidden', details) => new ApiError(403, message, details);
exports.forbidden = forbidden;
const notFound = (message = 'Not Found', details) => new ApiError(404, message, details);
exports.notFound = notFound;
const conflict = (message = 'Conflict', details) => new ApiError(409, message, details);
exports.conflict = conflict;
const tooManyRequests = (message = 'Too Many Requests', details) => new ApiError(429, message, details);
exports.tooManyRequests = tooManyRequests;
const internal = (message = 'Internal Server Error', details) => new ApiError(500, message, details);
exports.internal = internal;
