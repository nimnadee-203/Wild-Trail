jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 6.4, longitude: 81.5 } })),
  Accuracy: { High: 4 },
}));
jest.mock('../src/hooks/useCameraPermission', () => ({ useCameraPermission: () => ({
  takePhotoWithCamera: jest.fn(), pickImageFromGallery: jest.fn(),
}) }));
jest.mock('../src/services/communityReports', () => ({
  getCommunityQueue: jest.fn(async () => []),
  getReportSyncStatus: jest.fn(() => 'waiting'),
  getSimulatedOffline: jest.fn(() => false),
  isCommunityOnline: jest.fn(() => false),
  queueCommunityReport: jest.fn(async () => ({ id: 'report-1' })),
  subscribeNetworkStatus: jest.fn(() => () => {}),
  syncCommunityReports: jest.fn(), setSimulatedOffline: jest.fn(), validateCommunityInput: jest.fn(),
}));
jest.mock('../src/components/community/CommunityLocationMap', () => ({ CommunityLocationMap: () => null }));
const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react-native');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const Screen = require('../src/app/community-report').default;
const { queueCommunityReport } = require('../src/services/communityReports');
const { CommunityLanguageProvider, CommunityLanguageSelector, localizeCommunityDescription } = require('../src/components/community/CommunityLanguage');
const { translateCommunity } = require('../src/constants/communityTranslations');
const { BoundarySelector } = require('../src/components/community/BoundarySelector');

beforeEach(() => { AsyncStorage.getItem.mockResolvedValue(null); AsyncStorage.setItem.mockResolvedValue(); });

test.each([
  ['සිංහල', 'ප්‍රජා වාර්තාකරණය', 'අලියා', 'ගම දෙසට', '🚨 දැන් දැනුම්දීම යවන්න', 'හදිසි දැනුම්දීම යවන්න', 'වාර්තාව සාර්ථකව සුරැකුණා'],
  ['தமிழ்', 'சமூக அறிக்கையிடல்', 'யானை', 'கிராமத்தை நோக்கி', '🚨 இப்போது எச்சரிக்கையை அனுப்பவும்', 'அவசர எச்சரிக்கையை அனுப்பவும்', 'அறிக்கை வெற்றிகரமாகச் சேமிக்கப்பட்டது'],
])('Community urgent reporting works in %s with stable submission values', async (language, heading, animal, direction, send, open, success) => {
  const screen = await render(React.createElement(Screen));
  await fireEvent.press(screen.getByLabelText(language));
  expect(screen.getByText(heading)).toBeTruthy();
  await fireEvent.press(screen.getByText(open));
  expect(screen.getByText(animal)).toBeTruthy();
  await fireEvent.press(screen.getByText(direction));
  await waitFor(() => expect(screen.getByText(/6.40000/)).toBeTruthy());
  await fireEvent.press(screen.getByText(send));
  expect(queueCommunityReport).toHaveBeenCalledWith(expect.objectContaining({
    kind: 'elephant_sighting', urgentAlert: { animal: 'Elephant', direction: 'Toward village', latitude: 6.4, longitude: 81.5 },
  }), []);
  expect(screen.getByText(success)).toBeTruthy();
});

test('Tamil validation and language switching preserve selected incident details', async () => {
  const screen = await render(React.createElement(Screen));
  await fireEvent.press(screen.getByText('Paddy'));
  await fireEvent.press(screen.getByLabelText('தமிழ்'));
  await fireEvent.press(screen.getByText('அறிக்கையைச் சரிபார்க்கவும்'));
  expect(screen.getByText('உங்கள் கிராமத்தைத் தேர்ந்தெடுக்கவும் அல்லது பெயரை எழுதவும்.')).toBeTruthy();
  expect(screen.getByText('பாதிக்கப்பட்டவை: நெற்பயிர்')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('English'));
  expect(screen.getByText('Affected: Paddy')).toBeTruthy();
});

test('Community preference is restored and does not affect shared components outside its provider', async () => {
  AsyncStorage.getItem.mockResolvedValue('si');
  const props = { selectedOption: 'East Gate', customBoundary: '', onSelectOption: jest.fn(), onChangeCustom: jest.fn() };
  const screen = await render(React.createElement(React.Fragment, null,
    React.createElement(CommunityLanguageProvider, null, React.createElement(CommunityLanguageSelector), React.createElement(BoundarySelector, props)),
    React.createElement(BoundarySelector, props),
  ));
  await waitFor(() => expect(screen.getByText('නැගෙනහිර පිවිසුම')).toBeTruthy());
  expect(screen.getByText('East Gate')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('தமிழ்'));
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('wild-trail:community-report-language', 'ta');
});

test('Report summaries translate generated choices while preserving residents notes', () => {
  const t = text => translateCommunity('ta', text);
  expect(localizeCommunityDescription('Affected: Paddy | Details: வீட்டிற்கு அருகில்', t))
    .toBe('பாதிக்கப்பட்டவை: நெற்பயிர் | விவரங்கள்: வீட்டிற்கு அருகில்');
  expect(localizeCommunityDescription('Elephant moving toward village.', t))
    .toBe('யானை · நகர்கிறது · கிராமத்தை நோக்கி');
});
