// src/lib/firebase-admin.ts
import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Em um ambiente do Google Cloud (como o Firebase Hosting/Functions),
    // o SDK Admin pode se inicializar sem credenciais explícitas.
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
