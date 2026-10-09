const fs = require('firebase/firestore');
const { FirebaseError } = require('firebase/app');
const api = require('../src/services/scheduledPatrols');
const input = {
  teamName: ' Alpha ',
  rangerName: ' Ranger ',
  zone: ' East ',
  date: '2026-01-01',
  startTime: '08:00',
  status: 'scheduled',
};
beforeEach(() => {
  jest.useFakeTimers();
});
test('UC1 manager creates normalized assignment', async () => {
  fs.addDoc.mockResolvedValue({ id: 'p' });
  expect(await api.createScheduledPatrol(input)).toBe('p');
  expect(fs.addDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      teamName: 'Alpha',
      rangerName: 'Ranger',
      zone: 'East',
      rangerId: null,
      endTime: null,
      notes: null,
      route: [],
      checkpoints: [],
    }),
  );
});
test('UC1 manager updates assignment with optional fields and deletes it', async () => {
  fs.updateDoc.mockResolvedValue();
  fs.deleteDoc.mockResolvedValue();
  await api.updateScheduledPatrol('p', {
    ...input,
    rangerId: ' r ',
    endTime: ' 12:00 ',
    notes: ' Gate ',
    route: [{ latitude: 6, longitude: 81 }],
    checkpoints: [],
  });
  expect(fs.updateDoc).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'p' }),
    expect.objectContaining({ rangerId: 'r', endTime: '12:00', notes: 'Gate' }),
  );
  await api.deleteScheduledPatrol('p');
  expect(fs.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'p' }));
});
test('UC1 manager write times out after 15 seconds', async () => {
  fs.addDoc.mockImplementation(() => new Promise(() => {}));
  const pending = api.createScheduledPatrol(input);
  const assertion = expect(pending).rejects.toThrow('15 seconds');
  await jest.advanceTimersByTimeAsync(15000);
  await assertion;
});
test.each([
  ['permission-denied', 'denied'],
  ['failed-precondition', 'not enabled'],
  ['not-found', 'not enabled'],
  ['unavailable', 'unavailable'],
  ['other', 'Original'],
])('UC1 explains Firestore error %s', (code, message) => {
  expect(api.getScheduledPatrolErrorMessage(new FirebaseError(code, 'Original'))).toContain(
    message,
  );
});
test('UC1 explains non-Firebase errors', () => {
  expect(api.getScheduledPatrolErrorMessage(new Error('disk'))).toBe('disk');
  expect(api.getScheduledPatrolErrorMessage(null)).toContain('Unable to save');
});
test('UC1 assignment subscription normalizes points and rejects nonfinite coordinates', () => {
  const change = jest.fn(),
    error = jest.fn(),
    stop = jest.fn();
  fs.onSnapshot.mockReturnValue(stop);
  expect(api.subscribeToScheduledPatrols(change, error)).toBe(stop);
  fs.onSnapshot.mock.calls.at(-1)[1]({
    docs: [
      {
        id: 'p',
        data: () => ({
          route: [
            { latitude: '6', longitude: '81' },
            { latitude: 'bad', longitude: 1 },
          ],
          checkpoints: [
            { latitude: 0, longitude: 0 },
            { latitude: Infinity, longitude: 0 },
          ],
          createdAt: { toDate: () => new Date('2026-01-01') },
        }),
      },
      {
        id: 'q',
        data: () => ({
          route: 'bad',
          checkpoints: null,
          rangerId: 'r',
          endTime: '12:00',
          notes: 'Note',
        }),
      },
    ],
  });
  expect(change.mock.calls[0][0][0]).toMatchObject({
    id: 'p',
    route: [{ latitude: 6, longitude: 81 }],
    checkpoints: [{ id: 'cp-1', label: 'Checkpoint 1', latitude: 0, longitude: 0 }],
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  expect(change.mock.calls[0][0][1]).toMatchObject({ route: [], checkpoints: [], rangerId: 'r' });
  const failure = new Error('offline');
  fs.onSnapshot.mock.calls.at(-1)[2](failure);
  expect(error).toHaveBeenCalledWith(failure);
});
