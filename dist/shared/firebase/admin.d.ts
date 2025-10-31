export declare function getFirebaseAdmin(): typeof import("firebase-admin") | null;
export declare function verifyFirebaseIdToken(idToken: string): Promise<{
    uid: string;
    phoneNumber?: string;
} | null>;
