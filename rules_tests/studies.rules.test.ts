import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, get, set, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const ADMIN_USER = { uid: 'admin-user', role: 'ADMIN' };
const REGULAR_USER = { uid: 'regular-user', role: 'USER' };
const ANOTHER_USER = { uid: 'another-user', role: 'USER' };

const PUBLISHED_STUDY = {
    id: 'published-study',
    title: 'Published Study',
    status: 'PUBLISHED',
    authorId: ADMIN_USER.uid
};

const DRAFT_STUDY = {
    id: 'draft-study',
    title: 'Draft Study',
    status: 'DRAFT',
    authorId: ADMIN_USER.uid
};


describe('Firestore Security Rules for Studies', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'rules-test-project',
      firestore: {
        host: 'localhost',
        port: 8080,
      },
    });

    // Pre-populate admin user data for role checks
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await set(doc(adminDb, `users/${ADMIN_USER.uid}`), { role: 'ADMIN' });
        await set(doc(adminDb, `users/${REGULAR_USER.uid}`), { role: 'USER' });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    // Pre-populate studies for read tests
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await set(doc(adminDb, `studies/${PUBLISHED_STUDY.id}`), PUBLISHED_STUDY);
        await set(doc(adminDb, `studies/${DRAFT_STUDY.id}`), DRAFT_STUDY);
    });
  });

  // --- Read Rules ---
  test('should allow anyone to read a published study', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const publishedStudyRef = doc(unauthedDb, `studies/${PUBLISHED_STUDY.id}`);
    await assertSucceeds(get(publishedStudyRef));
  });

  test('should NOT allow unauthenticated users to read a draft study', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const draftStudyRef = doc(unauthedDb, `studies/${DRAFT_STUDY.id}`);
    await assertFails(get(draftStudyRef));
  });

  test('should NOT allow a regular user to read a draft study', async () => {
    const userDb = testEnv.authenticatedContext(REGULAR_USER.uid, { role: 'USER' }).firestore();
    const draftStudyRef = doc(userDb, `studies/${DRAFT_STUDY.id}`);
    await assertFails(get(draftStudyRef));
  });
  
  test('should allow an admin user to read a draft study', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_USER.uid, { role: 'ADMIN' }).firestore();
    const draftStudyRef = doc(adminDb, `studies/${DRAFT_STUDY.id}`);
    await assertSucceeds(get(draftStudyRef));
  });

  // --- Write Rules (Create) ---
   test('should allow an admin to create a new study', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_USER.uid, { role: 'ADMIN' }).firestore();
    const newStudyRef = doc(adminDb, 'studies/new-admin-study');
    await assertSucceeds(set(newStudyRef, { title: 'Admin Created', status: 'DRAFT' }));
  });

  test('should NOT allow a regular user to create a new study', async () => {
    const userDb = testEnv.authenticatedContext(REGULAR_USER.uid, { role: 'USER' }).firestore();
    const newStudyRef = doc(userDb, 'studies/new-user-study');
    await assertFails(set(newStudyRef, { title: 'User Created', status: 'DRAFT' }));
  });

  // --- Write Rules (Update) ---
  test('should allow an admin to update a study', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_USER.uid, { role: 'ADMIN' }).firestore();
    const studyRef = doc(adminDb, `studies/${DRAFT_STUDY.id}`);
    await assertSucceeds(set(studyRef, { title: 'Updated by Admin' }, { merge: true }));
  });

  test('should NOT allow a regular user to update a study', async () => {
    const userDb = testEnv.authenticatedContext(REGULAR_USER.uid, { role: 'USER' }).firestore();
    const studyRef = doc(userDb, `studies/${PUBLISHED_STUDY.id}`);
    await assertFails(set(studyRef, { title: 'Updated by User' }, { merge: true }));
  });

  // --- Write Rules (Delete) ---
   test('should allow an admin to delete a study', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_USER.uid, { role: 'ADMIN' }).firestore();
    const studyRef = doc(adminDb, `studies/${DRAFT_STUDY.id}`);
    await assertSucceeds(deleteDoc(studyRef));
  });

  test('should NOT allow a regular user to delete a study', async () => {
    const userDb = testEnv.authenticatedContext(REGULAR_USER.uid, { role: 'USER' }).firestore();
    const studyRef = doc(userDb, `studies/${PUBLISHED_STUDY.id}`);
    await assertFails(deleteDoc(studyRef));
  });

});
