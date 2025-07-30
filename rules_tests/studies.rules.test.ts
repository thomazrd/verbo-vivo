import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'verbo-vivo-rules-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Regras da coleção "studies"', () => {
  // Helper para criar um estudo usando o contexto de admin
  const createStudy = async (studyId: string, data: any) => {
    const adminDb = testEnv.authenticatedContext('admin-user', { role: 'ADMIN' }).firestore();
    await setDoc(doc(adminDb, `studies/${studyId}`), data);
  };

  test('deve PERMITIR a leitura de um estudo com status "PUBLISHED" para usuários não autenticados', async () => {
    await createStudy('published-study', { title: 'Estudo Publicado', status: 'PUBLISHED' });
    const db = testEnv.unauthenticatedContext().firestore();
    const studyRef = doc(db, 'studies/published-study');
    await assertSucceeds(getDoc(studyRef));
  });

  test('deve NEGAR a leitura de um estudo com status "DRAFT" para usuários não autenticados', async () => {
    await createStudy('draft-study', { title: 'Estudo Rascunho', status: 'DRAFT' });
    const db = testEnv.unauthenticatedContext().firestore();
    const studyRef = doc(db, 'studies/draft-study');
    await assertFails(getDoc(studyRef));
  });

  test('deve PERMITIR a leitura de um estudo com status "PUBLISHED" para usuários autenticados', async () => {
    await createStudy('published-study-auth', { title: 'Estudo Publicado', status: 'PUBLISHED' });
    const db = testEnv.authenticatedContext('user-123').firestore();
    const studyRef = doc(db, 'studies/published-study-auth');
    await assertSucceeds(getDoc(studyRef));
  });

  test('deve NEGAR a escrita (criação) para usuários não administradores', async () => {
    const db = testEnv.authenticatedContext('user-123').firestore();
    const studyRef = doc(db, 'studies/new-study');
    await assertFails(setDoc(studyRef, { title: 'Novo Estudo', status: 'DRAFT' }));
  });

  test('deve PERMITIR a escrita (criação) para usuários administradores', async () => {
    const adminDb = testEnv.authenticatedContext('admin-user', { role: 'ADMIN' }).firestore();
    const studyRef = doc(adminDb, 'studies/admin-study');
    await assertSucceeds(setDoc(studyRef, { title: 'Estudo de Admin', status: 'DRAFT' }));
  });
});
