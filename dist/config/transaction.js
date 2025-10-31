"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = exports.TransactionConfig = exports.TransactionIsolationLevel = void 0;
exports.withTransaction = withTransaction;
/**
 * Transaction isolation levels for different operations
 */
var TransactionIsolationLevel;
(function (TransactionIsolationLevel) {
    TransactionIsolationLevel["READ_UNCOMMITTED"] = "ReadUncommitted";
    TransactionIsolationLevel["READ_COMMITTED"] = "ReadCommitted";
    TransactionIsolationLevel["REPEATABLE_READ"] = "RepeatableRead";
    TransactionIsolationLevel["SERIALIZABLE"] = "Serializable";
})(TransactionIsolationLevel || (exports.TransactionIsolationLevel = TransactionIsolationLevel = {}));
/**
 * Transaction configuration for different operations
 */
exports.TransactionConfig = {
    // Critical financial operations - highest isolation
    PAYMENT: {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        timeout: 30000, // 30 seconds
        maxRetries: 3
    },
    // Draft operations - prevent concurrent modifications
    DRAFT_COMMIT: {
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        timeout: 15000, // 15 seconds
        maxRetries: 2
    },
    // Designer assignment - prevent double assignment
    DESIGNER_ASSIGNMENT: {
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        timeout: 10000, // 10 seconds
        maxRetries: 2
    },
    // Credit operations - prevent double spending
    CREDIT_OPERATIONS: {
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        timeout: 10000, // 10 seconds
        maxRetries: 2
    },
    // General operations - standard isolation
    GENERAL: {
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
        timeout: 5000, // 5 seconds
        maxRetries: 1
    }
};
/**
 * Enhanced transaction wrapper with isolation levels and retry logic
 */
class TransactionManager {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async executeWithIsolation(operation, config) {
        let lastError = null;
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                return await this.prisma.$transaction(operation, {
                    isolationLevel: config.isolationLevel,
                    timeout: config.timeout
                });
            }
            catch (error) {
                lastError = error;
                // Check if error is retryable
                if (this.isRetryableError(error) && attempt < config.maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 100;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    }
    isRetryableError(error) {
        // PostgreSQL serialization failures
        if (error.code === '40001')
            return true;
        // Deadlock detection
        if (error.code === '40P01')
            return true;
        // Connection timeout
        if (error.code === 'ETIMEDOUT')
            return true;
        // Connection lost
        if (error.code === 'ECONNRESET')
            return true;
        return false;
    }
}
exports.TransactionManager = TransactionManager;
/**
 * Transaction decorator for automatic retry and isolation
 */
function withTransaction(config) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            // Get prisma from 'this' context (service instance)
            const prismaInstance = this.prisma || globalThis.prisma;
            if (!prismaInstance) {
                throw new Error('Prisma client not found. Ensure prisma is available in service instance.');
            }
            const transactionManager = new TransactionManager(prismaInstance);
            return transactionManager.executeWithIsolation(async (tx) => {
                // Replace prisma with transaction context
                const originalPrisma = this.prisma;
                this.prisma = tx;
                try {
                    return await method.apply(this, args);
                }
                finally {
                    this.prisma = originalPrisma;
                }
            }, config);
        };
    };
}
