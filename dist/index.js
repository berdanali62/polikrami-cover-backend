"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const server = (0, http_1.createServer)(app_1.default);
server.listen(env_1.env.PORT, () => {
    logger_1.logger.info({ port: env_1.env.PORT, env: env_1.env.NODE_ENV }, 'API listening');
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error({ err }, 'Uncaught Exception');
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error({ reason }, 'Unhandled Rejection');
});
async function gracefulShutdown(signal) {
    try {
        logger_1.logger.info({ signal }, 'Graceful shutdown start');
        await new Promise((resolve) => server.close(() => resolve()));
        await (0, database_1.shutdownDatabase)();
        logger_1.logger.info('Graceful shutdown complete');
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
    }
}
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
