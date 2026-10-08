const env = require('./helpers/screen-environment');
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert, Platform } = require('react-native');
const fs = require('firebase/firestore');
const Screen = require('../src/app/(ranger)/alerts/index').default;
const reading = {
  animalId: 'E1',
  species: 'Elephant',
  location: 'East',
  level: 'HIGH',
  status: 'PENDING',
  timestamp: '10:00',
  description: 'Boundary',
};
let originalWindow;
beforeEach(() => {
  originalWindow = global.window;
  fs.onSnapshot.mockReturnValue(jest.fn());
  fs.updateDoc.mockResolvedValue();
});
afterEach(() => {
  global.window = originalWindow;
});
async function mount() {
  const screen = await render(React.createElement(Screen));
  await act(async () =>
    fs.onSnapshot.mock.calls[0][1]({
      forEach: (callback) => {
        callback({ id: 'high', data: () => reading });
        callback({ id: 'medium', data: () => ({ ...reading, animalId: 'L1', level: 'MEDIUM' }) });
        callback({ id: 'low', data: () => ({ ...reading, animalId: 'D1', level: 'LOW' }) });
      },
    }),
  );
  return screen;
}
test('UC3 ranger filters risk levels, opens selected alert and map', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('HIGH'));
  expect(screen.queryByText('L1')).toBeNull();
  await fireEvent.press(screen.getByText('E1'));
  expect(env.router.push).toHaveBeenCalledWith({
    pathname: '/alerts/[id]',
    params: { id: 'high' },
  });
  await fireEvent.press(screen.getByLabelText('View on map'));
  expect(env.router.push).toHaveBeenCalledWith('/map');
  await fireEvent.press(screen.getByText('MEDIUM'));
  expect(screen.getByText('L1')).toBeTruthy();
  await fireEvent.press(screen.getByText('LOW'));
  expect(screen.getByText('D1')).toBeTruthy();
  await fireEvent.press(screen.getByText('All Alerts'));
  expect(screen.getByText('E1')).toBeTruthy();
});
test('UC3 native dispatch failure reports error without success feedback', async () => {
  fs.updateDoc.mockRejectedValueOnce(new Error('denied'));
  const screen = await mount();
  await fireEvent.press(screen.getAllByText('Dispatch Team')[0]);
  await act(async () =>
    Alert.alert.mock.calls
      .at(-1)[2]
      .find((button) => button.text === 'Confirm Dispatch')
      .onPress(),
  );
  expect(Alert.alert).toHaveBeenLastCalledWith('Error', 'Failed to dispatch team.');
});
test.each([false, true])(
  'UC3 browser dispatch confirmation=%s controls remote write',
  async (confirmed) => {
    jest.replaceProperty(Platform, 'OS', 'web');
    global.window = { ...originalWindow, alert: jest.fn(), confirm: jest.fn(() => confirmed) };
    const screen = await mount();
    await fireEvent.press(screen.getAllByText('Dispatch Team')[0]);
    await act(async () => {});
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('East'));
    if (confirmed) {
      expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'high' }), {
        status: 'RESPONDED',
      });
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('dispatched'));
    } else expect(fs.updateDoc).not.toHaveBeenCalled();
  },
);
test('UC3 browser acknowledgement and dispatch failures show feedback', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  global.window = { ...originalWindow, alert: jest.fn(), confirm: jest.fn(() => true) };
  const screen = await mount();
  await fireEvent.press(screen.getAllByText('Acknowledge')[0]);
  expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Officer response logged'));
  fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getAllByText('Acknowledge')[0]);
  expect(window.alert).toHaveBeenLastCalledWith('Failed to acknowledge alert.');
  fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getAllByText('Dispatch Team')[0]);
  await act(async () => {});
  expect(window.alert).toHaveBeenLastCalledWith('Failed to dispatch team.');
});
