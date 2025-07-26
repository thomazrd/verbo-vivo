// src/lib/firebase-admin.ts
import 'server-only';
import * as admin from 'firebase-admin';

// Interface para guardar a instância do admin
interface FirebaseAdminWithApp extends admin.app.App {
  _firestore?: admin.firestore.Firestore;
  _auth?: admin.auth.Auth;
}

// Declaração para estender o tipo global e evitar erros de tipo
declare global {
  // eslint-disable-next-line no-var
  var __firebase_admin__: FirebaseAdminWithApp | undefined;
}

/**
 * Inicializa o Firebase Admin SDK de forma segura (Singleton).
 * Isso garante que a inicialização ocorra apenas uma vez.
 */
function initializeFirebaseAdmin() {
  if (!global.__firebase_admin__) {
    try {
      // Em um ambiente do Google Cloud (como o Firebase Hosting/Functions),
      // o SDK Admin pode se inicializar sem credenciais explícitas.
      global.__firebase_admin__ = admin.initializeApp() as FirebaseAdminWithApp;
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      // Fallback para credenciais de Application Default para ambientes que as suportam
      try {
        if (!admin.apps.length) {
          global.__firebase_admin__ = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          }) as FirebaseAdminWithApp;
        } else {
           global.__firebase_admin__ = admin.app() as FirebaseAdminWithApp;
        }
      } catch(e) {
         console.error('Failed to initialize with default credentials', e);
         throw e;
      }
    }
  }
  return global.__firebase_admin__;
}

const app = initializeFirebaseAdmin();
export const db = app.firestore();
export const auth = app.auth();
