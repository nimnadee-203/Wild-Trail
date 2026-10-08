jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../src/components/WildTrailBrand', () => ({ WildTrailBrand: () => null }));
jest.mock('../src/components/WildlifeAlertImage', () => ({ WildlifeAlertImage: () => null }));
const { render, fireEvent, act } = require('@testing-library/react-native');
const React = require('react');
const { Alert, Platform } = require('react-native');
const fs = require('firebase/firestore');
const Screen = require('../src/app/(ranger)/alerts/index').default;
async function mount(status = 'PENDING') {
  const stop = jest.fn();
  fs.onSnapshot.mockReturnValue(stop);
  const screen = await render(React.createElement(Screen));
  await act(async () =>
    fs.onSnapshot.mock.calls.at(-1)[1]({
      forEach: (callback) =>
        callback({
          id: 'a',
          data: () => ({
            animalId: 'E1',
            species: 'Elephant',
            location: 'East',
            level: 'HIGH',
            status,
            timestamp: '10:00',
            description: 'Boundary',
          }),
        }),
    }),
  );
  return { screen, stop };
}
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  fs.updateDoc.mockResolvedValue();
});
test('UC3 ranger acknowledges pending alert and unsubscribes on unmount', async () => {
  const { screen, stop } = await mount();
  await fireEvent.press(screen.getByText('Acknowledge'));
  expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), {
    status: 'ACKNOWLEDGED',
  });
  expect(Alert.alert).toHaveBeenCalledWith('Alert Acknowledged', expect.stringContaining('E1'));
  await screen.unmount();
  expect(stop).toHaveBeenCalledTimes(1);
});
test('UC3 acknowledgement failure shows error feedback', async () => {
  fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
  const { screen } = await mount();
  await fireEvent.press(screen.getByText('Acknowledge'));
  expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to acknowledge alert.');
});
test('UC3 already acknowledged alert prevents duplicate acknowledgement', async () => {
  const { screen } = await mount('ACKNOWLEDGED');
  await fireEvent.press(screen.getByText('Acknowledged'));
  expect(fs.updateDoc).not.toHaveBeenCalled();
});
test('UC3 dispatch confirmation resolves selected alert', async () => {
  const { screen } = await mount();
  await fireEvent.press(screen.getByText('Dispatch Team'));
  const buttons = Alert.alert.mock.calls.at(-1)[2];
  await act(async () => buttons.find((button) => button.text === 'Confirm Dispatch').onPress());
  expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), {
    status: 'RESPONDED',
  });
});
