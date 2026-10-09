// Native rendering boundaries only; screen state and handlers remain real.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../src/components/WildTrailBrand', () => ({ WildTrailBrand: () => null }));
jest.mock('../../src/components/WildlifeAlertImage', () => ({ WildlifeAlertImage: () => null }));
jest.mock('expo-router', () => ({
  useRouter: () => require('./screen-environment').router,
  useLocalSearchParams: () => require('./screen-environment').params,
  useFocusEffect: (callback) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../src/utils/navigation', () => ({ goBackOrReplace: jest.fn() }));
jest.mock('../../src/components/manager/ManagerShell', () => ({
  ManagerShell: ({ children }) => children,
  managerStyles: {},
}));
jest.mock('../../src/components/manager/PatrolRouteMap', () => ({
  PatrolRouteMap: (props) => require('./screen-environment').MapBoundary(props),
}));
jest.mock('../../src/components/manager/CameraPreview', () => ({ CameraPreview: () => null }));
jest.mock('../../src/components/community/LocationLandmarkPicker', () => ({
  LocationLandmarkPicker: (props) => require('./screen-environment').LocationBoundary(props),
}));
const React = require('react');
const { TextInput, Pressable, Text, View } = require('react-native');
const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const params = {};
const button = (label, onPress) =>
  React.createElement(
    Pressable,
    { onPress, accessibilityLabel: label },
    React.createElement(Text, null, label),
  );
function LocationBoundary(props) {
  return React.createElement(
    View,
    null,
    React.createElement(TextInput, {
      accessibilityLabel: 'Landmark',
      value: props.landmarkText,
      onChangeText: props.onChangeLandmarkText,
    }),
    button('Select map location', () => {
      props.onCoordsChange({ latitude: 6.4, longitude: 81.5 });
      props.onLocationSourceChange('map');
    }),
    button('Use GPS location', () => {
      props.onCoordsChange({ latitude: 0, longitude: 0, accuracy: 5 });
      props.onLocationSourceChange('gps');
    }),
  );
}
function MapBoundary(props) {
  if (!props.editable) return null;
  return React.createElement(
    View,
    null,
    button('Draw test route', () =>
      props.onChange?.({
        route: [
          { latitude: 6, longitude: 81 },
          { latitude: 6.1, longitude: 81.1 },
        ],
        checkpoints: props.checkpoints,
      }),
    ),
    button('Add test checkpoint', () =>
      props.onChange?.({
        route: props.route,
        checkpoints: [{ id: 'cp', label: 'Gate', latitude: 6, longitude: 81 }],
      }),
    ),
  );
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  Object.keys(params).forEach((key) => delete params[key]);
  jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
// RNTL 14 fireEvent awaits async handlers. Start one explicitly to inspect the
// real pending UI before settling a deferred dependency, then await completion.
async function beginPress(element) {
  let completion;
  const { handler } =
    require('@testing-library/react-native/dist/events/propagation').findEventHandler(
      element,
      'press',
      { bubbles: true },
    );
  if (!handler) throw new Error('No enabled press handler found');
  await require('@testing-library/react-native').act(async () => {
    completion = handler();
  });
  return { completion };
}
module.exports = { router, params, button, MapBoundary, LocationBoundary, deferred, beginPress };
