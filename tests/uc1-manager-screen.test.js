const env = require('./helpers/screen-environment');
jest.mock('../src/services/scheduledPatrols', () =>
  Object.fromEntries(
    [
      'createScheduledPatrol',
      'deleteScheduledPatrol',
      'getScheduledPatrolErrorMessage',
      'subscribeToScheduledPatrols',
      'updateScheduledPatrol',
    ].map((name) => [name, jest.fn()]),
  ),
);
jest.mock('../src/services/api/users', () => ({ userService: { getRangers: jest.fn() } }));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert } = require('react-native');
const api = require('../src/services/scheduledPatrols');
const { userService } = require('../src/services/api/users');
const Screen = require('../src/app/(manager)/patrols').default;
const assignment = {
  id: 'p',
  teamName: 'Alpha',
  rangerName: 'Nimal',
  rangerId: 'r',
  zone: 'East',
  date: '2026-10-09',
  startTime: '08:00',
  status: 'scheduled',
  route: [
    { latitude: 6, longitude: 81 },
    { latitude: 6.1, longitude: 81.1 },
  ],
  checkpoints: [{ id: 'cp', label: 'Gate', latitude: 6, longitude: 81 }],
};
const ranger = { id: 'r', name: 'Nimal', badge: 'R1', zoneId: 'East', status: 'AVAILABLE' };
let stop;
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-09T08:00:00Z'));
  stop = jest.fn();
  api.subscribeToScheduledPatrols.mockReturnValue(stop);
  api.createScheduledPatrol.mockResolvedValue('p');
  api.updateScheduledPatrol.mockResolvedValue();
  api.deleteScheduledPatrol.mockResolvedValue();
  api.getScheduledPatrolErrorMessage.mockImplementation((error) => error.message || 'Write failed');
  userService.getRangers.mockResolvedValue([
    ranger,
    { ...ranger, id: 'busy', name: 'Busy Ranger', status: 'ON_PATROL' },
  ]);
});
async function mount(items = []) {
  const screen = await render(React.createElement(Screen));
  await act(async () => api.subscribeToScheduledPatrols.mock.calls[0][0](items));
  return screen;
}
async function createForm(screen) {
  await fireEvent.press(screen.getByText('Schedule patrol'));
  await fireEvent.changeText(screen.getByPlaceholderText('Enter team name'), 'Bravo');
  await fireEvent.press(screen.getByText('Choose a date'));
  await fireEvent.press(screen.getByText('9'));
  await fireEvent.press(screen.getByText('Nimal'));
  await fireEvent.press(screen.getAllByText('Choose time')[0]);
  await fireEvent.press(screen.getByText('10:00'));
  await fireEvent.press(screen.getByText('Use this time'));
}
test('UC1 manager validates required fields, route and checkpoints before scheduling', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('Schedule patrol'));
  await fireEvent.press(screen.getAllByText('Schedule patrol').at(-1));
  expect(Alert.alert).toHaveBeenLastCalledWith('Missing details', expect.any(String));
  await fireEvent.changeText(screen.getByPlaceholderText('Enter team name'), 'Bravo');
  await fireEvent.changeText(screen.getByPlaceholderText('Enter patrol zone'), 'East');
  await fireEvent.press(screen.getByText('Choose a date'));
  await fireEvent.press(screen.getByText('9'));
  await fireEvent.press(screen.getAllByText('Choose time')[0]);
  await fireEvent.press(screen.getByText('Use this time'));
  await fireEvent.press(screen.getAllByText('Schedule patrol').at(-1));
  expect(Alert.alert).toHaveBeenLastCalledWith('Patrol route needed', expect.any(String));
  await fireEvent.press(screen.getByLabelText('Draw test route'));
  await fireEvent.press(screen.getAllByText('Schedule patrol').at(-1));
  expect(Alert.alert).toHaveBeenLastCalledWith('Checkpoints needed', expect.any(String));
  expect(api.createScheduledPatrol).not.toHaveBeenCalled();
});

test('manager cannot select past days but can schedule today and future days', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('Schedule patrol'));
  await fireEvent.press(screen.getByText('Choose a date'));
  expect(screen.getByLabelText('2026-10-08')).toBeDisabled();
  expect(screen.getByLabelText('2026-10-09')).toBeEnabled();
  expect(screen.getByLabelText('2026-10-10')).toBeEnabled();
  await fireEvent.press(screen.getByLabelText('2026-10-08'));
  expect(screen.getByText('Choose a date')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('2026-10-10'));
  expect(screen.getByText('2026-10-10')).toBeTruthy();
});

test('manager sees validation on web when scheduling an incomplete patrol', async () => {
  const { Platform } = require('react-native');
  const original = Platform.OS;
  Platform.OS = 'web';
  try {
    const screen = await mount();
    await fireEvent.press(screen.getByText('Schedule patrol'));
    await fireEvent.press(screen.getAllByText('Schedule patrol').at(-1));
    expect(screen.getByText('Enter a team, zone, date, and start time.')).toBeTruthy();
    expect(api.createScheduledPatrol).not.toHaveBeenCalled();
  } finally {
    Platform.OS = original;
  }
});

test('manager cannot save an assignment on a past date', async () => {
  const screen = await mount([{ ...assignment, date: '2026-10-08' }]);
  await fireEvent.press(screen.getByText('Edit assignment'));
  await fireEvent.press(screen.getByText('Save changes'));
  expect(screen.getByText('Choose today or a future date for the patrol.')).toBeTruthy();
  expect(api.updateScheduledPatrol).not.toHaveBeenCalled();
});
test('UC1 manager schedules ranger, route, checkpoint, end time and instructions', async () => {
  const screen = await mount();
  await createForm(screen);
  await fireEvent.press(screen.getByLabelText('Draw test route'));
  await fireEvent.press(screen.getByText('Add checkpoints'));
  await fireEvent.press(screen.getByLabelText('Add test checkpoint'));
  await fireEvent.press(screen.getByText('Choose time'));
  await fireEvent.press(screen.getByText('17:00'));
  await fireEvent.press(screen.getByText('Use this time'));
  await fireEvent.changeText(
    screen.getByPlaceholderText('Add instructions for the ranger'),
    'Check gate',
  );
  await fireEvent.press(screen.getAllByText('Schedule patrol').at(-1));
  expect(api.createScheduledPatrol).toHaveBeenCalledWith(
    expect.objectContaining({
      teamName: 'Bravo',
      rangerId: 'r',
      rangerName: 'Nimal',
      zone: 'East',
      date: '2026-10-09',
      startTime: '10:00',
      endTime: '17:00',
      notes: 'Check gate',
      status: 'scheduled',
      route: expect.any(Array),
      checkpoints: expect.any(Array),
    }),
  );
  expect(screen.queryByText('Schedule a patrol')).toBeNull();
});
test('UC1 manager edits and unassigns ranger while preserving status', async () => {
  const screen = await mount([assignment]);
  await fireEvent.press(screen.getByText('Edit assignment'));
  await fireEvent.press(screen.getByText('Unassign'));
  expect(api.updateScheduledPatrol).toHaveBeenCalledWith(
    'p',
    expect.objectContaining({ rangerId: '', rangerName: '', status: 'scheduled' }),
  );
  await fireEvent.changeText(screen.getByPlaceholderText('Enter team name'), 'Updated');
  await fireEvent.press(screen.getByText('Save changes'));
  expect(api.updateScheduledPatrol).toHaveBeenLastCalledWith(
    'p',
    expect.objectContaining({ teamName: 'Updated' }),
  );
});
test.each(['save', 'unassign', 'delete'])(
  'UC1 manager %s failure shows error and restores controls',
  async (operation) => {
    const screen = await mount([assignment]);
    await fireEvent.press(screen.getByText('Edit assignment'));
    if (operation === 'delete') {
      api.deleteScheduledPatrol.mockRejectedValueOnce(new Error('denied'));
      await fireEvent.press(screen.getByText('Delete Patrol'));
      await act(async () =>
        Alert.alert.mock.calls
          .at(-1)[2]
          .find((button) => button.style === 'destructive')
          .onPress(),
      );
    } else {
      api.updateScheduledPatrol.mockRejectedValueOnce(new Error('denied'));
      await fireEvent.press(screen.getByText(operation === 'save' ? 'Save changes' : 'Unassign'));
    }
    expect(screen.getByText('denied')).toBeTruthy();
    expect(Alert.alert).toHaveBeenLastCalledWith(
      operation === 'save'
        ? 'Unable to save patrol'
        : operation === 'unassign'
          ? 'Unable to unassign ranger'
          : 'Unable to delete patrol',
      'denied',
    );
  },
);
test('UC1 manager delete waits for confirmation and removes selected assignment', async () => {
  const screen = await mount([assignment]);
  await fireEvent.press(screen.getByText('Edit assignment'));
  await fireEvent.press(screen.getByText('Delete Patrol'));
  expect(api.deleteScheduledPatrol).not.toHaveBeenCalled();
  await act(async () =>
    Alert.alert.mock.calls
      .at(-1)[2]
      .find((button) => button.style === 'destructive')
      .onPress(),
  );
  expect(api.deleteScheduledPatrol).toHaveBeenCalledWith('p');
  expect(screen.queryByText('Edit patrol assignment')).toBeNull();
});
test('UC1 manager prevents selecting busy ranger; supports undo/clear map and time cancellation', async () => {
  const screen = await mount();
  await createForm(screen);
  await fireEvent.press(screen.getByText('Busy Ranger'));
  await fireEvent.press(screen.getByLabelText('Draw test route'));
  await fireEvent.press(screen.getByText('Undo'));
  expect(screen.getByText(/1 points · 0 checkpoints/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Add checkpoints'));
  await fireEvent.press(screen.getByLabelText('Add test checkpoint'));
  await fireEvent.press(screen.getByText('Undo'));
  expect(screen.getByText(/1 points · 0 checkpoints/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Clear'));
  expect(screen.getByText(/0 points · 0 checkpoints/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Draw route'));
  await fireEvent.press(screen.getByText('Choose time'));
  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.queryByText('Choose end time')).toBeNull();
});
test('UC1 manager assignment filters distinguish unassigned, active and completed teams', async () => {
  const screen = await mount([
    assignment,
    { ...assignment, id: 'u', rangerName: '', zone: '' },
    { ...assignment, id: 'active', status: 'on patrol' },
    { ...assignment, id: 'done', status: 'completed' },
  ]);
  await fireEvent.press(screen.getAllByText('Unassigned')[0]);
  expect(screen.getByText('Needs a ranger before patrol')).toBeTruthy();
  expect(screen.queryByText('Edit assignment')).toBeNull();
  await fireEvent.press(screen.getAllByText('On patrol')[0]);
  expect(screen.getByText('45%')).toBeTruthy();
  await fireEvent.press(screen.getAllByText('Completed')[0]);
  expect(screen.getByText('100%')).toBeTruthy();
  await fireEvent.press(screen.getByText('All teams'));
  await screen.unmount();
  expect(stop).toHaveBeenCalled();
});
test.each([new Error('rangers denied'), 'unknown'])(
  'UC1 manager ranger loading errors and subscription errors surface %#',
  async (error) => {
    userService.getRangers.mockRejectedValueOnce(error);
    const screen = await mount();
    await fireEvent.press(screen.getByText('Schedule patrol'));
    expect(screen.getByText(error.message || 'Unable to load rangers.')).toBeTruthy();
    await act(async () =>
      api.subscribeToScheduledPatrols.mock.calls[0][1](new Error('patrols denied')),
    );
    expect(Alert.alert).toHaveBeenCalledWith('Unable to load patrols', 'patrols denied');
  },
);
