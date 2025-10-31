type JwtKind = 'access' | 'refresh';
export interface AccessTokenPayload {
    userId: string;
    role?: string;
    typ: 'access';
}
export interface RefreshTokenPayload {
    userId: string;
    tid: string;
    typ: 'refresh';
}
export declare function signAccessToken(payload: Omit<AccessTokenPayload, 'typ'>): string;
export declare function signRefreshToken(payload: Omit<RefreshTokenPayload, 'typ'>): string;
export declare function verifyToken<T>(token: string, kind: JwtKind): T | null;
export declare function decodeWithoutVerify<T>(token: string): T | null;
export {};
