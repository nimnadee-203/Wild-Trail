const env = require('./helpers/screen-environment');
jest.mock('../src/services/incidentReporter', () => ({ getIncidentReporter: jest.fn() }));
jest.mock('../src/services/cloudinary', () => ({ uploadIncidentPhoto: jest.fn() }));
jest.mock('../src/services/communityPhoto', () => ({ retainCommunityPhoto: jest.fn() }));
jest.mock('../src/services/communityReports', () => {
  const actual = jest.requireActual('../src/services/communityReports');
  return {
    validateCommunityInput: actual.validateCommunityInput,
    getReportSyncStatus: actual.getReportSyncStatus,
    ...Object.fromEntries(
      [
        'getCommunityQueue',
        'getSimulatedOffline',
        'isCommunityOnline',
        'queueCommunityReport',
        'setSimulatedOffline',
        'subscribeNetworkStatus',
        'syncCommunityReports',
      ].map((name) => [name, jest.fn()]),
    ),
  };
});
jest.mock('../src/hooks/useCameraPermission', () => ({
  useCameraPermission: () => ({
    takePhotoWithCamera: require('expo-image-picker').launchCameraAsync,
    pickImageFromGallery: require('expo-image-picker').launchImageLibraryAsync,
  }),
}));
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));
// Controlled child contracts isolate parent validation/orchestration from the
// pickers' own rendering; these are not claims of picker component coverage.
jest.mock('../src/components/community/VillagePicker', () => ({
  VillagePicker: (props) => {
    const React = require('react'),
      { TextInput, View } = require('react-native');
    return React.createElement(
      View,
      null,
      React.createElement(TextInput, {
        accessibilityLabel: 'Village',
        value: props.value,
        onChangeText: props.onChange,
      }),
      React.createElement(TextInput, {
        accessibilityLabel: 'Custom village',
        value: props.customVillage,
        onChangeText: props.onCustomChange,
      }),
    );
  },
}));
jest.mock('../src/components/community/BoundarySelector', () => ({
  BoundarySelector: (props) => {
    const React = require('react'),
      { TextInput, View } = require('react-native');
    return React.createElement(
      View,
      null,
      React.createElement(TextInput, {
        accessibilityLabel: 'Boundary',
        value: props.selectedOption,
        onChangeText: props.onSelectOption,
      }),
      React.createElement(TextInput, {
        accessibilityLabel: 'Custom boundary',
        value: props.customBoundary,
        onChangeText: props.onChangeCustom,
      }),
    );
  },
}));
jest.mock('../src/components/community/DateTimePickerModal', () => ({
  DateTimePicker: (props) =>
    require('react').createElement(require('react-native').TextInput, {
      accessibilityLabel: 'Event time',
      value: props.value,
      onChangeText: props.onChange,
    }),
}));
jest.mock('../src/components/community/DynamicDescriptionFields', () => ({
  DynamicDescriptionFields: (props) =>
    require('react').createElement(require('react-native').TextInput, {
      accessibilityLabel: 'Description',
      onChangeText: props.onDescriptionChange,
    }),
}));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const api = require('../src/services/communityReports');
const Location = require('expo-location');
const picker = require('expo-image-picker');
const Screen = require('../src/app/community-report').default;
const { COMMUNITY_REPORT_TYPES } = require('../src/types/community');
let queue, unsubscribe;
beforeEach(() => {
  queue = [];
  unsubscribe = jest.fn();
  api.getCommunityQueue.mockImplementation(async () => queue);
  api.isCommunityOnline.mockReturnValue(false);
  api.getSimulatedOffline.mockReturnValue(false);
  api.subscribeNetworkStatus.mockReturnValue(unsubscribe);
  api.syncCommunityReports.mockResolvedValue();
  api.queueCommunityReport.mockImplementation(async (input, photos) => {
    const entry = {
      id: 'report-1',
      input,
      localPhotos: photos,
      uploadedPhotos: [],
      received: false,
      complete: false,
      syncStatus: 'waiting',
    };
    queue.push(entry);
    return entry;
  });
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 6, longitude: 81 } });
  picker.launchCameraAsync.mockResolvedValue('camera:1');
  picker.launchImageLibraryAsync.mockResolvedValue('gallery:1');
});
async function mount() {
  return render(React.createElement(Screen));
}
async function fill(screen) {
  for (const [label, value] of [
    ['Village', ' Village '],
    ['Boundary', 'East Gate'],
    ['Landmark', ' Gate '],
    ['Description', ' Crops damaged '],
    ['Contact phone', ' 0771234567 '],
    ['Event time', '2026-10-08 08:00'],
  ])
    await fireEvent.changeText(screen.getByLabelText(label), value);
}
test('UC4 review validates village, boundary, location and description sequentially', async () => {
  const screen = await mount();
  for (const [label, value, error] of [
    [null, null, 'Please select or specify your village.'],
    ['Village', 'V', /Please choose a boundary/],
    ['Boundary', 'East Gate', /Please capture your current location/],
    ['Landmark', 'Gate', 'Please fill in the incident description details.'],
  ]) {
    if (label) await fireEvent.changeText(screen.getByLabelText(label), value);
    await fireEvent.press(screen.getByText('Review Report'));
    expect(screen.getByText(error)).toBeTruthy();
  }
  expect(api.queueCommunityReport).not.toHaveBeenCalled();
});
test.each(Object.entries(COMMUNITY_REPORT_TYPES))(
  'UC4 screen selects category %s, reviews and saves offline with manual location',
  async (kind, type) => {
    const screen = await mount();
    await fireEvent.press(screen.getByText(type.label));
    await fill(screen);
    await fireEvent.press(screen.getByText('Review Report'));
    expect(screen.getByText('Confirm your report')).toBeTruthy();
    await fireEvent.press(screen.getByText('Confirm & Submit Report'));
    expect(api.queueCommunityReport).toHaveBeenCalledWith(
      expect.objectContaining({
        kind,
        village: 'Village',
        boundarySection: 'East Gate',
        landmark: 'Gate',
        description: 'Crops damaged',
        contactPhone: '0771234567',
      }),
      [],
    );
    expect(api.syncCommunityReports).not.toHaveBeenCalled();
    expect(screen.getByText(/Saved on this device.*report-1/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Done'));
    await fireEvent.press(screen.getByText('Submit another report'));
    expect(screen.getByLabelText('Village').props.value).toBe('');
  },
);
test('UC4 custom village/boundary and GPS are composed into submitted landmark', async () => {
  const screen = await mount();
  await fill(screen);
  await fireEvent.changeText(screen.getByLabelText('Village'), 'Other');
  await fireEvent.changeText(screen.getByLabelText('Custom village'), ' New Village ');
  await fireEvent.changeText(screen.getByLabelText('Boundary'), 'Other');
  await fireEvent.changeText(screen.getByLabelText('Custom boundary'), 'South fence');
  await fireEvent.press(screen.getByLabelText('Use GPS location'));
  await fireEvent.press(screen.getByText('Review Report'));
  await fireEvent.press(screen.getByText('Confirm & Submit Report'));
  expect(api.queueCommunityReport).toHaveBeenCalledWith(
    expect.objectContaining({
      village: 'New Village',
      boundarySection: 'South fence',
      landmark: 'Gate (GPS: 0.00000, 0.00000)',
    }),
    [],
  );
});
test('UC4 invalid date blocks review and GPS alone supplies optional landmark', async () => {
  const screen = await mount();
  await fill(screen);
  await fireEvent.changeText(screen.getByLabelText('Event time'), 'invalid');
  await fireEvent.press(screen.getByText('Review Report'));
  expect(screen.getByText('Enter a valid event date and time.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Event time'), '2026-10-08');
  await fireEvent.changeText(screen.getByLabelText('Landmark'), '');
  await fireEvent.press(screen.getByLabelText('Select map location'));
  await fireEvent.press(screen.getByText('Review Report'));
  await fireEvent.press(screen.getByText('Confirm & Submit Report'));
  expect(api.queueCommunityReport).toHaveBeenCalledWith(
    expect.objectContaining({ landmark: 'GPS: 6.40000, 81.50000' }),
    [],
  );
});
test.each([new Error('disk full'), 'unknown'])(
  'UC4 save error remains visible and form supports retry %#',
  async (error) => {
    const screen = await mount();
    await fill(screen);
    await fireEvent.press(screen.getByText('Review Report'));
    api.queueCommunityReport.mockRejectedValueOnce(error);
    await fireEvent.press(screen.getByText('Confirm & Submit Report'));
    expect(screen.getByText(error.message || 'Unable to save report.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Confirm & Submit Report'));
    expect(screen.getByText('Submit another report')).toBeTruthy();
  },
);
test('UC4 save loading state prevents repeat submission and triggers online delivery', async () => {
  api.isCommunityOnline.mockReturnValue(true);
  const pending = env.deferred();
  api.queueCommunityReport.mockReturnValue(pending.promise);
  const screen = await mount();
  await fill(screen);
  await fireEvent.press(screen.getByText('Review Report'));
  const { completion } = await env.beginPress(screen.getByText('Confirm & Submit Report'));
  await fireEvent.press(screen.getByText('Saving…'));
  expect(api.queueCommunityReport).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve({ id: 'report-1' });
    await completion;
  });
  expect(api.syncCommunityReports).toHaveBeenCalledTimes(1);
});
test('UC4 photo capture/gallery selection can be removed and optional attachment reaches queue', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('Take Photo'));
  await fireEvent.press(screen.getByText('Choose from Gallery'));
  await fireEvent.press(screen.getByText('Remove photo 1'));
  await fill(screen);
  await fireEvent.press(screen.getByText('Review Report'));
  await fireEvent.press(screen.getByText('Confirm & Submit Report'));
  expect(api.queueCommunityReport).toHaveBeenCalledWith(expect.anything(), ['gallery:1']);
});
test.each([null, new Error('camera denied'), 'unknown'])(
  'UC4 photo cancellation/error leaves report editable %#',
  async (outcome) => {
    if (outcome) picker.launchCameraAsync.mockRejectedValueOnce(outcome);
    else picker.launchCameraAsync.mockResolvedValueOnce(null);
    const screen = await mount();
    await fireEvent.press(screen.getByText('Take Photo'));
    expect(screen.getByText('Review Report')).toBeTruthy();
    if (outcome)
      expect(screen.getByText(outcome.message || 'Unable to select photo.')).toBeTruthy();
    else expect(screen.queryByText('Remove photo 1')).toBeNull();
  },
);
test('UC4 saved queue failure displays recovery message and subscription cleans up', async () => {
  api.getCommunityQueue.mockRejectedValueOnce(new Error('storage'));
  const screen = await mount();
  expect(screen.getByText('Unable to read saved reports.')).toBeTruthy();
  await screen.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
test('UC4 urgent alert requires direction and GPS, then submits actual captured coordinates', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByLabelText('Open immediate wildlife alert'));
  await fireEvent.press(screen.getByText(/Send Alert Now/));
  expect(screen.getByText(/Choose the animal and direction/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Toward village'));
  await fireEvent.press(screen.getByText(/Send Alert Now/));
  expect(api.queueCommunityReport).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'elephant_sighting',
      description: 'Elephant moving toward village.',
      urgentAlert: { animal: 'Elephant', direction: 'Toward village', latitude: 6, longitude: 81 },
    }),
    [],
  );
});
test.each(['denied', 'error', 'unknown'])(
  'UC4 urgent GPS handles %s and can refresh',
  async (failure) => {
    if (failure === 'denied')
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    else
      Location.getCurrentPositionAsync.mockRejectedValueOnce(
        failure === 'error' ? new Error('GPS disabled') : 'unknown',
      );
    const screen = await mount();
    await fireEvent.press(screen.getByLabelText('Open immediate wildlife alert'));
    expect(
      screen.getByText(
        failure === 'denied'
          ? 'Location permission is required for an immediate wildlife alert.'
          : failure === 'error'
            ? 'GPS disabled'
            : 'Unable to get your current location.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Refresh GPS location'));
    expect(screen.getByText('GPS ready: 6.00000, 81.00000')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Close quick report'));
    expect(screen.queryByText('Quick report')).toBeNull();
  },
);
test.each([new Error('storage full'), 'unknown'])(
  'UC4 urgent other animal validates name and shows save errors %#',
  async (error) => {
    const screen = await mount();
    await fireEvent.press(screen.getByLabelText('Open immediate wildlife alert'));
    await fireEvent.press(screen.getByText('Other'));
    await fireEvent.press(screen.getByText('Crossing road'));
    await fireEvent.press(screen.getByText(/Send Alert Now/));
    expect(api.queueCommunityReport).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Other animal'), ' Deer ');
    api.queueCommunityReport.mockRejectedValueOnce(error);
    await fireEvent.press(screen.getByText(/Send Alert Now/));
    expect(screen.getByText(error.message || 'Unable to send immediate alert.')).toBeTruthy();
    await fireEvent.press(screen.getByText(/Send Alert Now/));
    expect(api.queueCommunityReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: 'other_wildlife_conflict',
        urgentAlert: expect.objectContaining({ animal: 'Deer', direction: 'Crossing road' }),
      }),
      [],
    );
  },
);
function queued(id, status = 'waiting') {
  return {
    id,
    input: {
      kind: 'crop_raiding',
      village: 'Village',
      boundarySection: 'East',
      description: 'Damage',
    },
    localPhotos: [],
    uploadedPhotos: [],
    syncStatus: status,
    complete: status === 'synced',
  };
}
test.each(['waiting', 'failed'])(
  'UC4 %s report sync action targets one record and refreshes success status',
  async (status) => {
    queue = [queued('queued', status)];
    const screen = await mount();
    api.syncCommunityReports.mockImplementationOnce(async () => {
      queue = [queued('queued', 'synced')];
    });
    await fireEvent.press(
      status === 'waiting'
        ? screen.getByText('Sync now')
        : screen.getAllByText('Retry sync').at(-1),
    );
    expect(api.syncCommunityReports).toHaveBeenCalledWith('queued');
    expect(screen.getByText('Synced with Operations')).toBeTruthy();
  },
);
test.each([new Error('offline'), 'unknown'])(
  'UC4 global sync failure shows error and restores controls %#',
  async (error) => {
    queue = [queued('queued')];
    const screen = await mount();
    api.syncCommunityReports.mockRejectedValueOnce(error);
    await fireEvent.press(screen.getByText('Sync now (1 pending)'));
    expect(api.syncCommunityReports).toHaveBeenCalledWith(undefined);
    expect(screen.getByText(error.message || 'Sync failed. Retry when connected.')).toBeTruthy();
    expect(screen.getByText('Sync now (1 pending)')).toBeTruthy();
  },
);
test('UC4 network toggle and subscription update online state; queue status/photos display real fallbacks', async () => {
  queue = [
    { ...queued('syncing', 'syncing') },
    {
      ...queued('failed', 'failed'),
      localPhotos: ['local:photo'],
      uploadedPhotos: ['https://remote/photo'],
    },
  ];
  const screen = await mount();
  expect(screen.getByText('Syncing to Operations…')).toBeTruthy();
  expect(screen.getByText('Connection failed during upload.')).toBeTruthy();
  await fireEvent(screen.getByLabelText('Report photo 1'), 'error');
  expect(screen.getByLabelText('Report photo 1').props.source.uri).toBe('local:photo');
  await fireEvent.press(screen.getByText('Simulate Offline'));
  expect(api.setSimulatedOffline).toHaveBeenCalledWith(true);
  await act(async () => api.subscribeNetworkStatus.mock.calls[0][0](true));
  expect(screen.getByText('Online · Live Sync Active')).toBeTruthy();
});
