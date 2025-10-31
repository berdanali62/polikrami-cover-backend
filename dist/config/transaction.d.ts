import { PrismaClient } from '@prisma/client';
/**
 * Transaction isolation levels for different operations
 */
export declare enum TransactionIsolationLevel {
    READ_UNCOMMITTED = "ReadUncommitted",
    READ_COMMITTED = "ReadCommitted",
    REPEATABLE_READ = "RepeatableRead",
    SERIALIZABLE = "Serializable"
}
/**
 * Transaction configuration for different operations
 */
export declare const TransactionConfig: {
    PAYMENT: {
        isolationLevel: TransactionIsolationLevel;
        timeout: number;
        maxRetries: number;
    };
    DRAFT_COMMIT: {
        isolationLevel: TransactionIsolationLevel;
        timeout: number;
        maxRetries: number;
    };
    DESIGNER_ASSIGNMENT: {
        isolationLevel: TransactionIsolationLevel;
        timeout: number;
        maxRetries: number;
    };
    CREDIT_OPERATIONS: {
        isolationLevel: TransactionIsolationLevel;
        timeout: number;
        maxRetries: number;
    };
    GENERAL: {
        isolationLevel: TransactionIsolationLevel;
        timeout: number;
        maxRetries: number;
    };
};
/**
 * Enhanced transaction wrapper with isolation levels and retry logic
 */
export declare class TransactionManager {
    private prisma;
    constructor(prisma: PrismaClient);
    executeWithIsolation<T>(operation: (tx: any) => Promise<T>, config: typeof TransactionConfig[keyof typeof TransactionConfig]): Promise<T>;
    private isRetryableError;
}
/**
 * Transaction decorator for automatic retry and isolation
 */
export declare function withTransaction(config: typeof TransactionConfig[keyof typeof TransactionConfig]): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
