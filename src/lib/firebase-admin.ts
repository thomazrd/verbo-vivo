// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When deployed to Firebase, GOOGLE_APPLICATION_CREDENTIALS is automatically set
    if (process.env.NODE_ENV === 'production') {
        admin.initializeApp();
    } else {
        // For local development, use a service account key
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
