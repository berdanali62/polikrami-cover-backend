export declare class AuthService {
    register(params: {
        email: string;
        password: string;
        name?: string;
        role?: 'user' | 'designer';
        acceptTerms?: boolean;
        acceptPrivacy?: boolean;
        acceptRevenueShare?: boolean;
    }): Promise<{
        id: string;
        email: string;
        name: string | null;
    }>;
    login(params: {
        email: string;
        password: string;
        ua?: string;
        ip?: string;
    }): Promise<{
        access: string;
        refresh: string;
    }>;
    resendVerification(email: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    refresh(params: {
        userId: string;
        refreshTid: string;
        ua?: string;
        ip?: string;
    }): Promise<{
        access: string;
        refresh: string;
    }>;
    forgotPassword(email: string): Promise<void>;
    verifyResetCode(email: string, code: string): Promise<boolean>;
    resetPassword(email: string, code: string, newPassword: string): Promise<void>;
    verifyRefreshToken(token: string): {
        userId: string;
        tid: string;
    } | null;
}
