import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

const adminUser = { uid: 'admin_user_id', role: 'ADMIN' };
const regularUser = { uid: 'regular_user_id', role: 'USER' };
const anotherUser = { uid: 'another_user_id', role: 'USER' };

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'rules-test-project-studies',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'users/admin_user_id'), { role: 'ADMIN' });
        await setDoc(doc(adminDb, 'users/regular_user_id'), { role: 'USER' });
        await setDoc(doc(adminDb, 'studies/published_study'), { status: 'PUBLISHED', authorId: 'another_user_id' });
        await setDoc(doc(adminDb, 'studies/draft_study'), { status: 'DRAFT', authorId: 'admin_user_id' });
    });
});


afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules for "studies" collection', () => {
  // === READ Rules ===
  it('should allow anyone to read a published study', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(db, 'studies/published_study');
    await assertSucceeds(getDoc(docRef));
  });

  it('should NOT allow an unauthenticated user to read a draft study', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(db, 'studies/draft_study');
    await assertFails(getDoc(docRef));
  });
  
  it('should NOT allow a regular user to read a draft study', async () => {
    const db = testEnv.authenticatedContext(regularUser.uid, { role: regularUser.role }).firestore();
    const docRef = doc(db, 'studies/draft_study');
    await assertFails(getDoc(docRef));
  });

  it('should allow an admin to read a draft study', async () => {
    const db = testEnv.authenticatedContext(adminUser.uid, { role: adminUser.role }).firestore();
    const docRef = doc(db, 'studies/draft_study');
    await assertSucceeds(getDoc(docRef));
  });

  // === WRITE Rules ===
  it('should NOT allow an unauthenticated user to create a study', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(db, 'studies/new_study');
    await assertFails(setDoc(docRef, { title: 'New Study', status: 'DRAFT' }));
  });
  
  it('should NOT allow a regular user to create a study', async () => {
    const db = testEnv.authenticatedContext(regularUser.uid, { role: regularUser.role }).firestore();
    const docRef = doc(db, 'studies/new_study');
    await assertFails(setDoc(docRef, { title: 'New Study', status: 'DRAFT', authorId: regularUser.uid }));
  });

  it('should allow an admin to create a study', async () => {
    const db = testEnv.authenticatedContext(adminUser.uid, { role: adminUser.role }).firestore();
    const docRef = doc(db, 'studies/new_study_by_admin');
    await assertSucceeds(setDoc(docRef, { title: 'Admin Study', status: 'DRAFT', authorId: adminUser.uid }));
  });
  
  it('should NOT allow a regular user to update a study', async () => {
    const db = testEnv.authenticatedContext(regularUser.uid, { role: regularUser.role }).firestore();
    const docRef = doc(db, 'studies/published_study');
    await assertFails(updateDoc(docRef, { title: 'Updated Title' }));
  });

  it('should allow an admin to update a study', async () => {
    const db = testEnv.authenticatedContext(adminUser.uid, { role: adminUser.role }).firestore();
    const docRef = doc(db, 'studies/published_study');
    await assertSucceeds(updateDoc(docRef, { title: 'Updated by Admin' }));
  });
});
