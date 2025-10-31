"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseAdmin = getFirebaseAdmin;
exports.verifyFirebaseIdToken = verifyFirebaseIdToken;
const env_1 = require("../../config/env");
let admin = null;
let initialized = false;
function getFirebaseAdmin() {
    if (!admin) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            admin = require('firebase-admin');
        }
        catch {
            admin = null;
        }
    }
    if (!admin)
        return null;
    if (!initialized) {
        try {
            const pk = (env_1.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: env_1.env.FIREBASE_PROJECT_ID || undefined,
                    clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL || undefined,
                    privateKey: pk || undefined,
                }),
            });
            initialized = true;
        }
        catch {
            // ignore init errors – will fail validation later
        }
    }
    return admin;
}
async function verifyFirebaseIdToken(idToken) {
    const a = getFirebaseAdmin();
    if (!a)
        return null;
    try {
        const decoded = await a.auth().verifyIdToken(idToken);
        return { uid: decoded.uid, phoneNumber: decoded.phone_number };
    }
    catch {
        return null;
    }
}
