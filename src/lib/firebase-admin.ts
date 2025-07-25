// src/lib/firebase-admin.ts
import 'server-only';
import * as admin from 'firebase-admin';

// Verifica se a variável de ambiente com as credenciais está presente
const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!admin.apps.length) {
  try {
    // Usa as credenciais do ambiente se estiverem disponíveis
    if (hasCredentials) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    } else {
        // Fallback para ambientes (como desenvolvimento local) onde as credenciais podem não estar definidas via arquivo
        admin.initializeApp();
    }
  } catch (error: any) {
    // Log detalhado para depuração
    if (error.code === 'app/duplicate-app') {
      console.log('Firebase admin app already initialized.');
    } else {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
