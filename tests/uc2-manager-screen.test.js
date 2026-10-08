require('./helpers/screen-environment');
jest.mock('../src/services/api/incidents', () => ({ getFirebaseIncidents: jest.fn() }));
const React = require('react');
const { render, fireEvent } = require('@testing-library/react-native');
const { Alert } = require('react-native');
const { getFirebaseIncidents } = require('../src/services/api/incidents');
const Screen = require('../src/app/(manager)/incidents').default;
const report = {
  id: 'i',
  title: 'Snare',
  location: { address: 'Gate' },
  reporterName: 'Nimal',
  reporterId: 'r',
  severity: 'high',
  status: 'investigating',
  createdAt: '2026-10-08',
};
test('UC2 manager maps location fallbacks, filters and searches incidents and opens details', async () => {
  getFirebaseIncidents.mockResolvedValue([
    report,
    {
      ...report,
      id: 'j',
      title: 'Carcass',
      location: { latitude: 0, longitude: 0 },
      reporterName: undefined,
      status: 'resolved',
    },
    { ...report, id: 'k', title: 'Sighting', location: {} },
  ]);
  const screen = await render(React.createElement(Screen));
  expect(screen.getByText('0.0000, 0.0000')).toBeTruthy();
  expect(screen.getByText('Location not provided')).toBeTruthy();
  await fireEvent.press(screen.getByText('Snare'));
  expect(Alert.alert).toHaveBeenCalledWith('i', expect.stringContaining('Reported by Nimal'));
  await fireEvent.press(screen.getAllByText('Resolved')[0]);
  expect(screen.queryByText('Snare')).toBeNull();
  await fireEvent.press(screen.getByText('All incidents'));
  await fireEvent.press(screen.getAllByText('Investigating')[0]);
  await fireEvent.changeText(screen.getByPlaceholderText('Search incidents...'), 'gate');
  expect(screen.getByText('Snare')).toBeTruthy();
  expect(screen.queryByText('Sighting')).toBeNull();
});
test.each([new Error('denied'), 'unknown'])(
  'UC2 manager fetch error shows feedback %#',
  async (error) => {
    getFirebaseIncidents.mockRejectedValue(error);
    await render(React.createElement(Screen));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Unable to load incidents',
      error.message || 'Please try again.',
    );
  },
);
