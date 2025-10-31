export type HashingKind = 'password' | 'token';
export interface Argon2Options {
    timeCost?: number;
    memoryCost?: number;
    parallelism?: number;
    saltLength?: number;
}
export interface HashingModuleConfig extends Argon2Options {
}
export declare class Argon2idHasher {
    private readonly timeCost;
    private readonly memoryCost;
    private readonly parallelism;
    private readonly saltLength;
    constructor(config?: HashingModuleConfig);
    hashPassword(plain: string): Promise<string>;
    verifyPassword(hash: string, plain: string): Promise<boolean>;
    hashToken(plain: string): Promise<string>;
    verifyTokenHash(hash: string, plain: string): Promise<boolean>;
}
export declare function createDefaultHasher(): Argon2idHasher;
