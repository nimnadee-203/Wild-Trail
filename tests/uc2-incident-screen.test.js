const env = require('./helpers/screen-environment');
jest.mock('../src/services/rangerIncidentQueue', () => ({ saveRangerIncident: jest.fn() }));
jest.mock('../src/hooks/useRangerIncidentQueue', () => ({ useRangerIncidentQueue: () => ({ queue: [], online: true }) }));
jest.mock('../src/components/RangerIncidentOfflinePanel', () => ({ RangerIncidentOfflinePanel: () => null }));
jest.mock('../src/hooks/useCameraPermission', () => ({
  useCameraPermission: () => {
    const React = require('react');
    const [photos, setPhotos] = React.useState([]);
    return {
      photos,
      takePhotoWithCamera: require('expo-image-picker').launchCameraAsync,
      pickImageFromGallery: require('expo-image-picker').launchImageLibraryAsync,
      addPhoto: (uri) => setPhotos((current) => [...current, uri]),
      removePhoto: (index) => setPhotos((current) => current.filter((_, i) => i !== index)),
    };
  },
}));
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert } = require('react-native');
const picker = require('expo-image-picker');
const { saveRangerIncident: createIncident } = require('../src/services/rangerIncidentQueue');
const { goBackOrReplace } = require('../src/utils/navigation');
const Screen = require('../src/app/(ranger)/report-incident').default;
async function details(type = 'Snare') {
  const screen = await render(React.createElement(Screen));
  await fireEvent.press(screen.getByText(type));
  return screen;
}
async function review(screen, { description = 'Tracks near gate', location = true } = {}) {
  if (description) await fireEvent.changeText(screen.getByPlaceholderText(/Describe/), description);
  if (location) await fireEvent.press(screen.getByLabelText('Select map location'));
  await fireEvent.press(screen.getByText('Review Report'));
}
beforeEach(() => {
  createIncident.mockResolvedValue({ id: 'i', syncStatus: 'synced' });
  picker.launchCameraAsync.mockResolvedValue('camera:photo');
  picker.launchImageLibraryAsync.mockResolvedValue('gallery:photo');
});

test('Emergency report skips review and submits critical priority with required details', async () => {
  env.params.emergency = 'true';
  const screen = await render(React.createElement(Screen));
  expect(screen.queryByText('Review Report')).toBeNull();
  await fireEvent.press(screen.getByText('Send emergency report'));
  expect(createIncident).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByPlaceholderText(/Describe/), 'Ranger injured near gate');
  await fireEvent.press(screen.getByText('Send emergency report'));
  expect(Alert.alert).toHaveBeenLastCalledWith('Location required', expect.any(String));
  await fireEvent.press(screen.getByLabelText('Use GPS location'));
  await fireEvent.press(screen.getByText('Send emergency report'));
  expect(createIncident).toHaveBeenCalledWith(expect.objectContaining({
    title: 'Emergency incident', severity: 'critical', description: 'Ranger injured near gate',
    location: { latitude: 0, longitude: 0, accuracy: 5 }, photoUris: [],
  }));
  expect(screen.getByText('Report submitted')).toBeTruthy();
});

test('Emergency button opens quick reporting from the normal form', async () => {
  const screen = await render(React.createElement(Screen));
  await fireEvent.press(screen.getByText('Emergency report'));
  expect(screen.getByText('Send emergency report')).toBeTruthy();
  expect(screen.queryByText('Select the type of incident')).toBeNull();
});
test.each([
  ['Snare', 'snare_detected'],
  ['Carcass', 'other'],
  ['Illegal Campsite', 'other'],
  ['Wildlife Sighting', 'wildlife_sighting'],
])('UC2 screen submits %s with mapped category and selected priority', async (type, category) => {
  const screen = await details(type);
  await fireEvent.press(screen.getByLabelText('High priority. Urgent response'));
  await fireEvent.changeText(screen.getByLabelText('Landmark'), ' East gate ');
  await review(screen);
  await fireEvent.press(screen.getByText('Submit Report'));
  expect(createIncident).toHaveBeenCalledWith(
    expect.objectContaining({
      title: type,
      category,
      severity: 'high',
      description: 'Tracks near gate',
      location: { latitude: 6.4, longitude: 81.5, address: 'East gate' },
      photoUris: [],
    }),
  );
  expect(screen.getByText('Report submitted')).toBeTruthy();
  await fireEvent.press(screen.getByText('Back to Dashboard'));
  expect(env.router.replace).toHaveBeenCalledWith('/(ranger)/dashboard');
});
test('UC2 screen requires description and location before contacting backend', async () => {
  const screen = await details();
  await review(screen, { description: '', location: false });
  await fireEvent.press(screen.getByText('Submit Report'));
  expect(Alert.alert).toHaveBeenLastCalledWith('Description required', expect.any(String));
  await fireEvent.press(screen.getByLabelText('Go back'));
  await review(screen, { location: false });
  await fireEvent.press(screen.getByText('Submit Report'));
  expect(Alert.alert).toHaveBeenLastCalledWith('Location required', expect.any(String));
  expect(createIncident).not.toHaveBeenCalled();
});
test('UC2 custom category requires text and supports editing type from details', async () => {
  const screen = await details('Other');
  await fireEvent.press(screen.getByText('Continue'));
  expect(screen.getByPlaceholderText('Enter the incident type')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByPlaceholderText('Enter the incident type'),
    ' Fence damage ',
  );
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(screen.getByText('Fence damage'));
  await fireEvent.press(screen.getByText('Carcass'));
  await review(screen);
  await fireEvent.press(screen.getByText('Submit Report'));
  expect(createIncident).toHaveBeenCalledWith(
    expect.objectContaining({ category: 'other', title: 'Carcass' }),
  );
});
test('UC2 submission disables repeat presses while saving and displays sync failure without losing the report', async () => {
  const pending = env.deferred();
  createIncident.mockReturnValue(pending.promise);
  const screen = await details();
  await review(screen);
  const { completion } = await env.beginPress(screen.getByText('Submit Report'));
  await fireEvent.press(screen.getByText(/Submitting report/));
  expect(createIncident).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve({ id: 'i', syncStatus: 'failed', error: 'One photo failed' });
    await completion;
  });
  expect(screen.getByText('Report saved on this device')).toBeTruthy();
  expect(screen.getByText(/Sync needs attention: One photo failed/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Go back'));
  expect(goBackOrReplace).toHaveBeenCalledWith('/(ranger)/dashboard');
});
test.each([new Error('Permission denied'), 'unknown'])(
  'UC2 submission failure preserves review and permits retry %#',
  async (error) => {
    createIncident.mockRejectedValueOnce(error);
    const screen = await details();
    await review(screen);
    await fireEvent.press(screen.getByText('Submit Report'));
    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Submission failed',
      error.message || 'Unable to submit the incident.',
    );
    expect(screen.getByText('Submit Report')).toBeTruthy();
    await fireEvent.press(screen.getByText('Submit Report'));
    expect(screen.getByText('Report submitted')).toBeTruthy();
  },
);
test('UC2 photo preview must be attached or discarded before review; gallery attachment can be removed', async () => {
  const screen = await details();
  await fireEvent.press(screen.getByText(/Take Photo/));
  await fireEvent.press(screen.getByText('Review Report'));
  expect(screen.queryByText('Submit Report')).toBeNull();
  await fireEvent.press(screen.getByText('Discard Photo'));
  await fireEvent.press(screen.getByText(/Gallery/));
  await fireEvent.press(screen.getByText('Attach Photo'));
  expect(screen.getByLabelText('Remove photo 1')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Remove photo 1'));
  expect(screen.getByText('No photos attached yet')).toBeTruthy();
});
test.each([null, new Error('Camera blocked'), 'unknown'])(
  'UC2 camera cancellation/failure leaves form usable %#',
  async (outcome) => {
    if (outcome) picker.launchCameraAsync.mockRejectedValueOnce(outcome);
    else picker.launchCameraAsync.mockResolvedValueOnce(null);
    const screen = await details();
    await fireEvent.press(screen.getByText(/Take Photo/));
    expect(screen.getByText('Review Report')).toBeTruthy();
    if (outcome)
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Unable to select photo',
        outcome.message || 'Please try again.',
      );
    else expect(screen.queryByText('Attach Photo')).toBeNull();
  },
);
test('UC2 back navigation returns from details to category then dashboard', async () => {
  const screen = await details();
  await fireEvent.press(screen.getByLabelText('Go back'));
  expect(screen.getByText('Select the type of incident')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Go back'));
  expect(goBackOrReplace).toHaveBeenCalledWith('/(ranger)/dashboard');
});
