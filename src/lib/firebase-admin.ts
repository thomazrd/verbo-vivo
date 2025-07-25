// src/lib/firebase-admin.ts
import 'server-only';
import * as admin from 'firebase-admin';
import './firebase-admin-init'; // Garante que a inicialização ocorra antes de exportar

export const db = admin.firestore();
export const auth = admin.auth();
