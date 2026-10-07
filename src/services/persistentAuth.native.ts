import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, FirebaseError } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';

// Metro selects Firebase's React Native export. TypeScript's web declaration
// omits this documented native-only function.
const { getReactNativePersistence } = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence(storage: typeof AsyncStorage): FirebaseAuth.Persistence;
};

export function getPersistentAuth(app: FirebaseApp) {
  try {
    return FirebaseAuth.initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') return FirebaseAuth.getAuth(app);
    throw error;
  }
}
