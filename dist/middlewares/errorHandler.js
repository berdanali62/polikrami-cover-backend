"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const ApiError_1 = require("../shared/errors/ApiError");
function errorHandler(err, _req, res, _next) {
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({ message: err.message, details: err.details ?? undefined });
    }
    // Handle generic errors carrying a status (e.g., CORS origin rejection)
    if (err && typeof err === 'object' && 'message' in err) {
        const anyErr = err;
        if (anyErr.status && typeof anyErr.status === 'number') {
            return res.status(anyErr.status).json({ message: anyErr.message ?? 'Error' });
        }
    }
    if (err instanceof Error) {
        logger_1.logger.error({ msg: err.message, stack: err.stack }, 'Unhandled error');
    }
    else {
        logger_1.logger.error({ err }, 'Unhandled error');
    }
    res.status(500).json({ message: 'Internal Server Error' });
}
