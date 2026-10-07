import { FirebaseError } from 'firebase/app';
import { signInAnonymously, User } from 'firebase/auth';
import { auth } from './firebase';

// Temporary reporting identity while the ranger sign-in flow is being implemented.
export const DEFAULT_INCIDENT_RANGER = {
  name: 'Ranger Nimal',
  badgeNumber: 'RANGER-409',
};

let pendingReporter: Promise<User> | undefined;

export async function getIncidentReporter(): Promise<User> {
  await auth.authStateReady();
  if (auth.currentUser) {
    return auth.currentUser;
  }

  // Share a single sign-in if multiple submissions request a reporter together.
  if (!pendingReporter) {
    pendingReporter = signInAnonymously(auth)
      .then(({ user }) => user)
      .catch((error: unknown) => {
        if (error instanceof FirebaseError && error.code === 'auth/operation-not-allowed') {
          throw new Error(
            'Enable Anonymous sign-in in Firebase Authentication to report as the default ranger.'
          );
        }
        throw error;
      })
      .finally(() => {
        pendingReporter = undefined;
      });
  }

  return pendingReporter;
}
