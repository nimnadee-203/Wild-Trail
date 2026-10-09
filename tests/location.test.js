jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));
const { renderHook, act } = require('@testing-library/react-native');
const { Platform } = require('react-native');
const Location = require('expo-location');
const { useLocation } = require('../src/hooks/useLocation');
beforeEach(() => {
  jest.useFakeTimers();
});
test.each(['ios', 'android', 'web'])(
  'UC1/UC2 GPS success on %s maps device coordinates',
  async (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 0, longitude: 0, altitude: null, accuracy: 5 },
    });
    const { result, unmount } = await renderHook(() => useLocation());
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(result.current.location).toEqual({
      latitude: 0,
      longitude: 0,
      altitude: null,
      accuracy: 5,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMsg).toBeNull();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 4 });
    unmount();
  },
);
test.each(['ios', 'web'])('UC1/UC2 permission denial on %s', async (os) => {
  jest.replaceProperty(Platform, 'OS', os);
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
  const { result, unmount } = await renderHook(() => useLocation());
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(result.current.location).toEqual(
    os === 'web' ? expect.objectContaining({ latitude: 6.3725 }) : null,
  );
  expect(result.current.errorMsg).toContain(os === 'web' ? 'simulated' : 'denied');
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  unmount();
});
test.each([
  ['ios', new Error('GPS disabled'), 'GPS disabled'],
  ['ios', {}, 'Failed to get current location'],
  ['web', new Error('GPS disabled'), 'simulated'],
])('UC1/UC2 GPS failure %#', async (os, error, message) => {
  jest.replaceProperty(Platform, 'OS', os);
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockRejectedValue(error);
  const { result, unmount } = await renderHook(() => useLocation());
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(result.current.errorMsg).toContain(message);
  expect(result.current.isLoading).toBe(false);
  unmount();
});
