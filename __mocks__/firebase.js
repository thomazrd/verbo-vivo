export const db = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      onSnapshot: jest.fn(() => () => {}),
    })),
  })),
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    onSnapshot: jest.fn(() => () => {}),
  })),
};

export const collection = jest.fn(() => ({
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
  })),
  onSnapshot: jest.fn(() => () => {}),
  add: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
}));

export const doc = jest.fn((db, path, id) => ({
  id: id || 'mock-doc-id',
  path: path,
  get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ id: id || 'mock-doc-id' }) })),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn(() => () => {}),
}));

export const addDoc = jest.fn(() => Promise.resolve({ id: 'new-doc-id' }));
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const setDoc = jest.fn(() => Promise.resolve());
export const getDoc = jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }));
export const onSnapshot = jest.fn(() => () => {});
export const serverTimestamp = jest.fn(() => new Date());
export const writeBatch = jest.fn(() => ({
    commit: jest.fn(() => Promise.resolve()),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
}));
export const arrayUnion = jest.fn(item => ({ type: 'arrayUnion', payload: item }));
export const arrayRemove = jest.fn(item => ({ type: 'arrayRemove', payload: item }));
export const getDocs = jest.fn(() => Promise.resolve({ docs: [], empty: true }));
export const startAfter = jest.fn();
export const limit = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const orderBy = jest.fn();
