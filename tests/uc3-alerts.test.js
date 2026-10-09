const fs = require('firebase/firestore');
const { subscribeToManagerAlerts, resolveManagerAlert } = require('../src/services/managerAlerts');
function deliver(data) {
  const onChange = jest.fn(),
    onError = jest.fn(),
    unsubscribe = jest.fn();
  fs.onSnapshot.mockReturnValue(unsubscribe);
  expect(subscribeToManagerAlerts(onChange, onError)).toBe(unsubscribe);
  fs.onSnapshot.mock.calls.at(-1)[1]({
    docs: data.map(([id, fields]) => ({ id, data: () => fields })),
  });
  return onChange.mock.calls[0][0];
}
test.each([
  ['HIGH', 'High'],
  ['medium', 'Medium'],
  [null, 'Low'],
  ['unknown', 'Low'],
])('UC3 normalizes severity %s', (level, expected) => {
  expect(deliver([['a', { level }]])[0].severity).toBe(expected);
});
test.each([
  ['RESPONDED', 'Resolved'],
  ['RESOLVED', 'Resolved'],
  ['ACKNOWLEDGED', 'Assigned'],
  ['ASSIGNED', 'Assigned'],
  ['PENDING', 'Active'],
  [null, 'Active'],
])('UC3 maps alert status %s', (status, expected) => {
  expect(deliver([['a', { status }]])[0].status).toBe(expected);
});
test('UC3 missing collar metadata uses display fallbacks without fabricating coordinates', () => {
  expect(deliver([['a', {}]])[0]).toMatchObject({
    id: 'a',
    species: 'Wildlife',
    title: 'Wildlife risk alert',
    zone: 'Location unavailable',
    time: 'Time unavailable',
    latitude: undefined,
    longitude: undefined,
  });
});
test('UC3 preserves supplied metadata and zero coordinates; sorts displayed times', () => {
  const alerts = deliver([
    ['a', { timestamp: '2026-01-01' }],
    [
      'b',
      {
        species: 'Elephant',
        animalId: 'E1',
        timestamp: '2026-02-01',
        latitude: 0,
        longitude: 0,
        distance: '5 km',
        description: 'Boundary',
        image: 'photo',
        level: 'HIGH',
        status: 'PENDING',
      },
    ],
  ]);
  expect(alerts[0]).toMatchObject({
    id: 'E1',
    firestoreId: 'b',
    latitude: 0,
    longitude: 0,
    distance: '5 km',
    description: 'Boundary',
    image: 'photo',
    rawLevel: 'HIGH',
    rawStatus: 'PENDING',
  });
});
test('UC3 formats Firestore time and handles empty snapshots', () => {
  const date = new Date('2026-01-01');
  expect(deliver([['a', { timestamp: { toDate: () => date } }]])[0].time).toBe(
    date.toLocaleString(),
  );
  expect(deliver([])).toEqual([]);
});
test('UC3 subscription forwards errors and supports cleanup', () => {
  const onError = jest.fn(),
    stop = jest.fn();
  fs.onSnapshot.mockReturnValue(stop);
  const cleanup = subscribeToManagerAlerts(jest.fn(), onError);
  const error = new Error('offline');
  fs.onSnapshot.mock.calls.at(-1)[2](error);
  cleanup();
  expect(onError).toHaveBeenCalledWith(error);
  expect(stop).toHaveBeenCalledTimes(1);
});
test('UC3 resolves the selected alert and propagates database failure', async () => {
  fs.doc.mockReturnValue({ id: 'a' });
  fs.updateDoc.mockResolvedValueOnce();
  await resolveManagerAlert('a');
  expect(fs.updateDoc).toHaveBeenCalledWith({ id: 'a' }, { status: 'RESPONDED' });
  fs.updateDoc.mockRejectedValueOnce(new Error('denied'));
  await expect(resolveManagerAlert('a')).rejects.toThrow('denied');
});
test('UC3 active-alert API preserves shared client error handling', async () => {
  const { alertApiService } = require('../src/services/api/alerts');
  global.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ id: 'a' }] });
  expect(await alertApiService.getActiveAlerts()).toEqual({
    data: [{ id: 'a' }],
    error: null,
    status: 200,
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/alerts/active'),
    expect.anything(),
  );
  global.fetch.mockRejectedValueOnce(new Error('offline'));
  expect(await alertApiService.getActiveAlerts()).toEqual({
    data: null,
    error: 'offline',
    status: 0,
  });
});
