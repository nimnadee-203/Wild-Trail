jest.mock('firebase/auth', () => ({ signInAnonymously: jest.fn() }));
const { signInAnonymously } = require('firebase/auth');
const { FirebaseError } = require('firebase/app');
const { auth } = require('../src/services/firebase');
const { getIncidentReporter } = require('../src/services/incidentReporter');
beforeEach(() => {
  auth.currentUser = null;
  auth.authStateReady.mockResolvedValue();
});
test('UC2 returns existing identity without anonymous sign-in', async () => {
  auth.currentUser = { uid: 'r' };
  expect(await getIncidentReporter()).toEqual({ uid: 'r' });
  expect(signInAnonymously).not.toHaveBeenCalled();
});
test('UC2 concurrent reporter requests share anonymous sign-in', async () => {
  let resolve;
  signInAnonymously.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const a = getIncidentReporter(),
    b = getIncidentReporter();
  await Promise.resolve();
  resolve({ user: { uid: 'anon' } });
  expect(await Promise.all([a, b])).toEqual([{ uid: 'anon' }, { uid: 'anon' }]);
  expect(signInAnonymously).toHaveBeenCalledTimes(1);
});
test.each([new FirebaseError('auth/operation-not-allowed', 'disabled'), new Error('offline')])(
  'UC2 reporter error is actionable and next request retries %#',
  async (error) => {
    signInAnonymously
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ user: { uid: 'retry' } });
    await expect(getIncidentReporter()).rejects.toThrow(
      error.code ? 'Enable Anonymous' : 'offline',
    );
    expect(await getIncidentReporter()).toEqual({ uid: 'retry' });
  },
);
