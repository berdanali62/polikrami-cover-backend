"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.shutdownDatabase = shutdownDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
exports.prisma = new client_1.PrismaClient({
    log: [{ emit: 'event', level: 'query' }, 'error', 'warn'],
});
exports.prisma.$on('query', (e) => {
    logger_1.logger.debug({ sql: e.query, params: e.params, duration: e.duration }, 'DB query');
});
async function shutdownDatabase() {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Prisma disconnected');
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error during Prisma disconnect');
    }
}
