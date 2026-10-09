const env = require('./helpers/screen-environment');
jest.mock('../src/services/api/patrols', () => ({
  patrolApiService: { setRangerStatus: jest.fn(), getRangerStatus: jest.fn() },
}));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert, Platform } = require('react-native');
const fs = require('firebase/firestore');
const { patrolApiService: patrol } = require('../src/services/api/patrols');
const Details = require('../src/app/(ranger)/alerts/[id]').default;
const Confirm = require('../src/app/(ranger)/alerts/confirm').default;
const data = {
  animalId: 'E1',
  species: 'Elephant',
  location: 'East boundary',
  timestamp: '10:00',
  latitude: 0,
  longitude: 0,
  level: 'HIGH',
};
beforeEach(() => {
  env.params.id = 'a';
  fs.getDoc.mockResolvedValue({ id: 'a', exists: () => true, data: () => data });
  fs.updateDoc.mockResolvedValue();
  patrol.getRangerStatus.mockResolvedValue('RESPONDING_TO_ALERT');
  patrol.setRangerStatus.mockResolvedValue();
});
test('UC3 details displays loading before alert document resolves', async () => {
  const pending = env.deferred();
  fs.getDoc.mockReturnValue(pending.promise);
  const screen = await render(React.createElement(Details));
  expect(screen.getByText('Loading alert details...')).toBeTruthy();
  await act(async () => pending.resolve({ id: 'a', exists: () => true, data: () => data }));
  expect(screen.getByText('E1')).toBeTruthy();
  expect(screen.getByText('Latitude: 0')).toBeTruthy();
});
test.each([false, true])(
  'UC3 acknowledgement/respond navigation after write failure=%s characterizes existing behavior',
  async (failure) => {
    if (failure) fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    const screen = await render(React.createElement(Details));
    await fireEvent.press(screen.getByText('Acknowledge & Respond'));
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), {
      status: 'RESPONDED',
    });
    expect(patrol.setRangerStatus).toHaveBeenCalledWith('RESPONDING_TO_ALERT');
    expect(env.router.push).toHaveBeenCalledWith({
      pathname: '/alerts/confirm',
      params: { id: 'a' },
    });
    if (failure) expect(console.error).toHaveBeenCalled();
  },
);
test.each([false, true])('UC3 missing id/document leaves details loading %#', async (missingId) => {
  if (missingId) delete env.params.id;
  else fs.getDoc.mockResolvedValue({ exists: () => false });
  const screen = await render(React.createElement(Details));
  expect(screen.getByText('Loading alert details...')).toBeTruthy();
  if (missingId) expect(fs.getDoc).not.toHaveBeenCalled();
});
test.each([false, true])(
  'UC3 confirmation completes response even if remote resolution fails=%s',
  async (failure) => {
    if (failure) fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    const screen = await render(React.createElement(Confirm));
    expect(screen.getByText('RESPONDING TO ALERT')).toBeTruthy();
    await fireEvent.press(screen.getByText('View Location on Map'));
    expect(env.router.push).toHaveBeenCalledWith({
      pathname: '/map',
      params: { respondingAlertId: 'a' },
    });
    await fireEvent.press(screen.getByText('Complete Response (Set Available)'));
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), {
      status: 'RESOLVED',
    });
    expect(patrol.setRangerStatus).toHaveBeenCalledWith('AVAILABLE');
    expect(env.router.push).toHaveBeenLastCalledWith('/dashboard');
    expect(Alert.alert).toHaveBeenCalledWith('Response Completed', expect.any(String));
  },
);
test('UC3 confirmation fallback metadata and return-to-alerts route', async () => {
  fs.getDoc.mockResolvedValue({ id: 'a', exists: () => true, data: () => ({}) });
  const screen = await render(React.createElement(Confirm));
  expect(screen.getByText('Elephant E-014')).toBeTruthy();
  await fireEvent.press(screen.getByText('Back to Alerts Feed'));
  expect(env.router.push).toHaveBeenCalledWith('/alerts');
});
test.each(['missing', 'denied', 'absent'])(
  'UC3 confirmation handles %s document by retaining loading state',
  async (state) => {
    if (state === 'missing') delete env.params.id;
    else if (state === 'denied') fs.getDoc.mockRejectedValueOnce(new Error('denied'));
    else fs.getDoc.mockResolvedValue({ exists: () => false });
    const screen = await render(React.createElement(Confirm));
    expect(screen.getByText('Confirming response details...')).toBeTruthy();
  },
);
