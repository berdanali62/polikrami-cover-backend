export declare class UserVerificationService {
    sendPhoneCode(userId: string, phone: string): Promise<void>;
    verifyPhoneCode(userId: string, phone: string, code: string): Promise<boolean>;
}
