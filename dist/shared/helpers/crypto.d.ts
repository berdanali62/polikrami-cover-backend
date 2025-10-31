export declare function hashPassword(plain: string): Promise<string>;
export declare function verifyPassword(hash: string, plain: string): Promise<boolean>;
export declare function hashToken(plain: string): Promise<string>;
export declare function verifyTokenHash(hash: string, plain: string): Promise<boolean>;
