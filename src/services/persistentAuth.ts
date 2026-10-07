import { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export function getPersistentAuth(app: FirebaseApp) { return getAuth(app); }
