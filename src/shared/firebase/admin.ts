import { env } from '../../config/env';

let admin: typeof import('firebase-admin') | null = null;
let initialized = false;

export function getFirebaseAdmin() {
  if (!admin) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      admin = require('firebase-admin');
    } catch {
      admin = null;
    }
  }
  if (!admin) return null;
  if (!initialized) {
    try {
      const pk = (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID || undefined,
          clientEmail: env.FIREBASE_CLIENT_EMAIL || undefined,
          privateKey: pk || undefined,
        }),
      });
      initialized = true;
    } catch {
      // ignore init errors – will fail validation later
    }
  }
  return admin;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; phoneNumber?: string } | null> {
  const a = getFirebaseAdmin();
  if (!a) return null;
  try {
    const decoded = await a.auth().verifyIdToken(idToken);
    return { uid: decoded.uid, phoneNumber: decoded.phone_number } as { uid: string; phoneNumber?: string };
  } catch {
    return null;
  }
}


