jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
}));
jest.mock('../src/services/firebase', () => ({
  db: {},
  auth: { currentUser: null, authStateReady: jest.fn(async () => {}) },
}));
jest.mock('../src/services/firebaseConfig', () => require('../src/services/firebase'));
jest.mock('firebase/app', () => ({
  FirebaseError: class FirebaseError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));
jest.mock('firebase/firestore', () => {
  class Timestamp {
    constructor(date) {
      this.date = date;
    }
    toDate() {
      return this.date;
    }
    static now() {
      return new Timestamp(new Date());
    }
  }
  return Object.fromEntries([
    ...[
      'doc',
      'getDoc',
      'getDocs',
      'addDoc',
      'updateDoc',
      'deleteDoc',
      'query',
      'where',
      'orderBy',
      'onSnapshot',
      'runTransaction',
      'serverTimestamp',
    ].map((name) => [name, jest.fn()]),
    ['collection', jest.fn((db, name) => name)],
    ['Timestamp', Timestamp],
  ]);
});
beforeEach(() => {
  const firestore = require('firebase/firestore');
  firestore.collection.mockImplementation((db, name) => name);
  firestore.doc.mockImplementation((db, collection, id) => ({ collection, id }));
  jest.spyOn(global, 'fetch').mockImplementation(() => {
    throw new Error('Unexpected network request');
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
