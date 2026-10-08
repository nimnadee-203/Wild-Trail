const env = require('./helpers/screen-environment');
jest.mock('../src/hooks/useLocation', () => ({ useLocation: jest.fn() }));
jest.mock('../src/services/api/patrols', () => ({
  patrolApiService: Object.fromEntries(
    [
      'getActivePatrolSession',
      'addActualPathPoint',
      'addMarkedWaypoint',
      'addPatrolObservation',
      'completePatrolSession',
    ].map((name) => [name, jest.fn()]),
  ),
}));
jest.mock('../src/services/api/offlineSync', () => ({
  offlineSyncService: Object.fromEntries(
    ['getQueue', 'isOnline', 'setOnlineStatus', 'syncPendingItems', 'queueItem'].map((name) => [
      name,
      jest.fn(),
    ]),
  ),
}));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert, Platform } = require('react-native');
const { useLocation } = require('../src/hooks/useLocation');
const { patrolApiService: api } = require('../src/services/api/patrols');
const { offlineSyncService: sync } = require('../src/services/api/offlineSync');
const Screen = require('../src/app/(ranger)/patrol').default;
const point = { latitude: 6, longitude: 81, timestamp: '08:00' };
const waypoint = {
  ...point,
  id: 'wp',
  type: 'WATER_POINT',
  notes: 'Water',
  syncStatus: 'PENDING_SYNC',
};
const observation = {
  ...point,
  id: 'obs',
  type: 'Fence Damage',
  description: 'Broken fence',
  syncStatus: 'PENDING_SYNC',
};
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  useLocation.mockReturnValue({
    location: { latitude: 6.123456, longitude: 81.123456, accuracy: 4 },
    errorMsg: null,
    isLoading: false,
    refreshLocation: jest.fn(),
  });
  api.getActivePatrolSession.mockResolvedValue(null);
  api.addActualPathPoint.mockResolvedValue(null);
  api.addMarkedWaypoint.mockResolvedValue(null);
  api.addPatrolObservation.mockResolvedValue(null);
  api.completePatrolSession.mockImplementation(async (patrolId, input) => ({
    ...input,
    patrolId,
    completionPercentage: 80,
  }));
  sync.getQueue.mockResolvedValue([]);
  sync.isOnline.mockResolvedValue(true);
  sync.setOnlineStatus.mockResolvedValue();
  sync.syncPendingItems.mockResolvedValue({ syncedCount: 2 });
  sync.queueItem.mockResolvedValue({ id: 'q' });
});
async function mount(params = {}) {
  Object.assign(env.params, params);
  return render(React.createElement(Screen));
}
test('UC1 screen starts tracking, records deterministic GPS breadcrumbs, stops and navigates after completion', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('Start GPS Patrol'));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10000);
  });
  expect(api.addActualPathPoint).toHaveBeenCalledTimes(2);
  expect(api.addActualPathPoint).toHaveBeenLastCalledWith(
    expect.objectContaining({ latitude: 6.1239, longitude: 81.1241, syncStatus: 'SUBMITTED' }),
  );
  await fireEvent.press(screen.getByText('Stop Patrol Session'));
  expect(api.completePatrolSession).toHaveBeenCalledWith(
    'PAT-0156',
    expect.objectContaining({
      actualPath: expect.arrayContaining([expect.objectContaining({ latitude: 6.1239 })]),
      distanceKm: expect.any(Number),
    }),
  );
  expect(screen.getByText('Patrol Completed')).toBeTruthy();
  await fireEvent.press(screen.getByText('Done & Return to Dashboard'));
  expect(env.router.push).toHaveBeenCalledWith('/dashboard');
  const count = api.addActualPathPoint.mock.calls.length;
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });
  expect(api.addActualPathPoint).toHaveBeenCalledTimes(count);
});
test('UC1 loads saved path, waypoints and observations and includes them in assigned patrol summary', async () => {
  api.getActivePatrolSession.mockResolvedValue({
    actualPath: [point, { ...point, latitude: 6.1 }],
    markedWaypoints: [waypoint],
    observations: [observation],
  });
  const screen = await mount({
    patrolId: 'p',
    patrolName: 'East Patrol',
    park: 'Yala',
    priority: 'LOW',
    startTime: '08:00',
    routeCoords: JSON.stringify([
      [81, 6],
      [81.1, 6.1],
    ]),
  });
  expect(screen.getByText('Marked Waypoints (1)')).toBeTruthy();
  await fireEvent.press(screen.getByText('View JSON'));
  expect(screen.getByText('Hide JSON')).toBeTruthy();
  await fireEvent.press(screen.getByText('Hide JSON'));
  await fireEvent.press(screen.getByText('Stop Patrol Session'));
  expect(api.completePatrolSession).toHaveBeenCalledWith(
    'p',
    expect.objectContaining({
      patrolName: 'East Patrol',
      priority: 'LOW',
      markedWaypoints: [waypoint],
      observations: [observation],
    }),
  );
  expect(screen.getByText('SAVED OBSERVATIONS')).toBeTruthy();
  expect(screen.getByText('SAVED WAYPOINTS')).toBeTruthy();
});
test.each(['bad', '[]', '{}'])(
  'UC1 invalid/empty route parameter uses existing fallback %#',
  async (routeCoords) => {
    const screen = await mount({ routeCoords });
    await fireEvent.press(screen.getByText('View JSON'));
    expect(screen.getByText(/latitude: 6.3672/)).toBeTruthy();
    expect(api.completePatrolSession).not.toHaveBeenCalled();
  },
);
test('UC1 waypoint captures GPS with selected category and trimmed notes', async () => {
  const screen = await mount({ patrolId: 'p' });
  await fireEvent.press(screen.getByText('Mark Waypoint'));
  await fireEvent.press(screen.getByText('Fence Breach'));
  await fireEvent.changeText(screen.getByPlaceholderText(/Fresh animal tracks/), ' Broken fence ');
  await fireEvent.press(screen.getByText('Save Waypoint'));
  expect(api.addMarkedWaypoint).toHaveBeenCalledWith(
    expect.objectContaining({
      latitude: 6.1235,
      longitude: 81.1235,
      type: 'FENCE_BREACH',
      notes: 'Broken fence',
      syncStatus: 'SUBMITTED',
    }),
  );
  expect(screen.getByText('Marked Waypoints (1)')).toBeTruthy();
  expect(Alert.alert).toHaveBeenLastCalledWith('Waypoint Recorded', expect.any(String));
});
test('UC1 offline waypoint/observation use last path when GPS unavailable and sync when restored', async () => {
  useLocation.mockReturnValue({
    location: null,
    errorMsg: 'GPS denied',
    isLoading: false,
    refreshLocation: jest.fn(),
  });
  sync.isOnline.mockResolvedValue(false);
  const screen = await mount({ patrolId: 'p' });
  await fireEvent.press(screen.getByText('Mark Waypoint'));
  await fireEvent.press(screen.getByText('Save Waypoint'));
  expect(sync.queueItem).toHaveBeenCalledWith(
    'WAYPOINT',
    expect.objectContaining({ latitude: 6.3672, notes: undefined, syncStatus: 'PENDING_SYNC' }),
  );
  await fireEvent.press(screen.getByText('Add Observation'));
  await fireEvent.press(screen.getByText('Save'));
  expect(sync.queueItem).toHaveBeenCalledWith(
    'OBSERVATION',
    expect.objectContaining({ description: 'Fresh elephant footprints', patrolId: 'p' }),
  );
  await fireEvent.press(screen.getByText('Restore Internet'));
  expect(sync.syncPendingItems).toHaveBeenCalledTimes(1);
  expect(Alert.alert).toHaveBeenLastCalledWith('Internet Restored', expect.stringContaining('2'));
  expect(screen.queryAllByText('PENDING_SYNC')).toHaveLength(0);
});
test('UC1 observation validates description and records selected type', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('Add Observation'));
  await fireEvent.changeText(screen.getByPlaceholderText('[ Fresh elephant footprints ]'), ' ');
  await fireEvent.press(screen.getByText('Save'));
  expect(Alert.alert).toHaveBeenLastCalledWith('Description Required', expect.any(String));
  expect(api.addPatrolObservation).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('[ Wildlife Sighting ]'));
  await fireEvent.press(screen.getByText('Illegal Activity'));
  await fireEvent.changeText(
    screen.getByPlaceholderText('[ Fresh elephant footprints ]'),
    ' Snare wire ',
  );
  await fireEvent.press(screen.getByText('Save'));
  expect(api.addPatrolObservation).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'Illegal Activity', description: 'Snare wire' }),
  );
});
test('UC1 offline completion queues the patrol summary and connectivity toggle updates state', async () => {
  const screen = await mount({ patrolId: 'p' });
  await fireEvent.press(screen.getByText('Simulate Offline'));
  expect(sync.setOnlineStatus).toHaveBeenCalledWith(false);
  await fireEvent.press(screen.getByText('Stop Patrol Session'));
  expect(sync.queueItem).toHaveBeenCalledWith(
    'PATROL_SUMMARY',
    expect.objectContaining({ patrolId: 'p' }),
  );
});
test('UC1 cancel waypoint/observation leaves records untouched and refresh requests device GPS', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('Mark Waypoint'));
  await fireEvent.press(screen.getByText('Cancel'));
  await fireEvent.press(screen.getByText('Add Observation'));
  await fireEvent.press(screen.getByText('Cancel'));
  await fireEvent.press(screen.getByText('Refresh GPS Signal'));
  expect(api.addMarkedWaypoint).not.toHaveBeenCalled();
  expect(api.addPatrolObservation).not.toHaveBeenCalled();
  expect(useLocation().refreshLocation).toHaveBeenCalledTimes(3);
});
test('UC1 displays location loading state and clears tracking interval on unmount', async () => {
  useLocation.mockReturnValue({
    location: null,
    errorMsg: null,
    isLoading: true,
    refreshLocation: jest.fn(),
  });
  const screen = await mount({ patrolId: 'p' });
  expect(screen.getByText('Acquiring High Accuracy GPS Signal...')).toBeTruthy();
  await screen.unmount();
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10000);
  });
  expect(api.addActualPathPoint).not.toHaveBeenCalled();
});
