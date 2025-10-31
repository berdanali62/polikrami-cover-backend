export declare function findUserByEmail(email: string): Promise<{
    email: string;
    password: string;
    name: string | null;
    id: string;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    termsAcceptedAt: Date | null;
    privacyAcceptedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function createUser(data: {
    email: string;
    password: string;
    name?: string;
    role?: 'user' | 'designer';
}): Promise<{
    email: string;
    password: string;
    name: string | null;
    id: string;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    termsAcceptedAt: Date | null;
    privacyAcceptedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
