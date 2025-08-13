// src/lib/firebase-admin.ts
import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // A inicialização padrão é a mais robusta para ambientes do Google Cloud como o Firebase Hosting.
    // Ela utiliza automaticamente as credenciais do ambiente de execução.
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
