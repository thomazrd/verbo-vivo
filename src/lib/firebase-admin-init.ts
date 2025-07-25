// src/lib/firebase-admin-init.ts
import 'server-only';
import * as admin from 'firebase-admin';

/**
 * Este arquivo é responsável por inicializar o SDK do Firebase Admin.
 * Ele deve ser importado uma vez no ponto de entrada do servidor da aplicação
 * (como o layout raiz) para garantir que o admin seja configurado antes
 * de qualquer outra operação de servidor que dependa dele.
 */
if (!admin.apps.length) {
  try {
    // Esta inicialização simplificada funciona para ambientes do Google Cloud
    // (onde as credenciais são descobertas automaticamente) e para desenvolvimento
    // local com 'gcloud auth application-default login'.
    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}
