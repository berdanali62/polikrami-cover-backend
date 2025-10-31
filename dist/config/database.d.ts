import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ("warn" | "error" | {
        emit: "event";
        level: "query";
    })[];
}, "query", import("@prisma/client/runtime/library").DefaultArgs>;
export declare function shutdownDatabase(): Promise<void>;
