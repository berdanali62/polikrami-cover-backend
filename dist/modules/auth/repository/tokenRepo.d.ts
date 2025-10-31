export declare function createRefreshToken(params: {
    id: string;
    userId: string;
    tokenHash: string;
    userAgent?: string;
    ip?: string;
    expiresAt: Date;
}): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    revokedAt: Date | null;
    tokenHash: string;
    userAgent: string | null;
    ip: string | null;
    expiresAt: Date;
}>;
export declare function revokeRefreshToken(id: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    revokedAt: Date | null;
    tokenHash: string;
    userAgent: string | null;
    ip: string | null;
    expiresAt: Date;
}>;
export declare function revokeAllRefreshTokensByUser(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare function findLatestRefreshTokenByUser(userId: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    revokedAt: Date | null;
    tokenHash: string;
    userAgent: string | null;
    ip: string | null;
    expiresAt: Date;
} | null>;
export declare function createEmailVerificationToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
}>;
export declare function useEmailVerificationToken(params: {
    userId: string;
}): Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare function createPasswordResetToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
}>;
export declare function findValidPasswordResetToken(params: {
    userId: string;
}): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
} | null>;
export declare function markPasswordResetTokenUsed(id: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
}>;
