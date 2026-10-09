const env = require('./helpers/screen-environment');
jest.mock('../src/services/managerAlerts', () => ({
  subscribeToManagerAlerts: jest.fn(),
  resolveManagerAlert: jest.fn(),
}));
jest.mock('../src/components/manager/AlertDetailSideBox', () => ({
  AlertDetailSideBox: (props) => {
    if (!props.alert) return null;
    const React = require('react'),
      { View, Text } = require('react-native'),
      { button } = require('./helpers/screen-environment');
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, `Selected ${props.alert.id}`),
      button(props.isResolving ? 'Resolving alert' : 'Resolve selected alert', () =>
        props.onResolve(props.alert.firestoreId),
      ),
      button('Close alert detail', props.onClose),
    );
  },
}));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const { Alert } = require('react-native');
const api = require('../src/services/managerAlerts');
const Screen = require('../src/app/(manager)/alerts').default;
const alerts = [
  {
    firestoreId: 'a',
    id: 'E1',
    title: 'Elephant boundary risk',
    zone: 'East',
    time: '10:00',
    severity: 'High',
    status: 'Active',
  },
  {
    firestoreId: 'b',
    id: 'E2',
    title: 'Resolved leopard risk',
    zone: 'West',
    time: '09:00',
    severity: 'Low',
    status: 'Resolved',
  },
];
let stop;
beforeEach(() => {
  stop = jest.fn();
  api.subscribeToManagerAlerts.mockReturnValue(stop);
  api.resolveManagerAlert.mockResolvedValue();
});
async function mount(items = alerts) {
  const screen = await render(React.createElement(Screen));
  await act(async () => api.subscribeToManagerAlerts.mock.calls[0][0](items));
  return screen;
}
test('UC3 manager filters active/severity/resolved alerts and opens/closes selected details', async () => {
  const screen = await mount();
  await fireEvent.press(screen.getByText('High priority'));
  expect(screen.queryByText('Resolved leopard risk')).toBeNull();
  await fireEvent.press(screen.getAllByText('Active')[0]);
  await fireEvent.press(screen.getByLabelText('View full details for Elephant boundary risk'));
  expect(screen.getByText('Selected E1')).toBeTruthy();
  await fireEvent.press(screen.getByText('Close alert detail'));
  expect(screen.queryByText('Selected E1')).toBeNull();
  await fireEvent.press(screen.getByText('Resolved'));
  expect(screen.queryByText('Elephant boundary risk')).toBeNull();
  await fireEvent.press(screen.getByText('All alerts'));
  expect(screen.getByText('Elephant boundary risk')).toBeTruthy();
  await screen.unmount();
  expect(stop).toHaveBeenCalled();
});
test('UC3 manager resolves route-selected alert and displays pending state', async () => {
  env.params.alertId = 'E1';
  const pending = env.deferred();
  api.resolveManagerAlert.mockReturnValue(pending.promise);
  const screen = await mount();
  const { completion } = await env.beginPress(screen.getByText('Resolve selected alert'));
  expect(screen.getByText('Resolving alert')).toBeTruthy();
  expect(api.resolveManagerAlert).toHaveBeenCalledWith('a');
  await act(async () => {
    pending.resolve();
    await completion;
  });
  expect(screen.getByText('Resolve selected alert')).toBeTruthy();
});
test.each([new Error('denied'), 'unknown'])(
  'UC3 manager resolution failure restores controls with feedback %#',
  async (error) => {
    api.resolveManagerAlert.mockRejectedValueOnce(error);
    env.params.id = 'a';
    const screen = await mount();
    await fireEvent.press(screen.getByText('Resolve selected alert'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Unable to resolve alert',
      error.message || 'Please try again.',
    );
  },
);
test('UC3 manager subscription error and empty filter display recovery message', async () => {
  const screen = await mount([alerts[1]]);
  await fireEvent.press(screen.getByText('High priority'));
  expect(screen.getByText('No alerts found for this filter.')).toBeTruthy();
  await act(async () => api.subscribeToManagerAlerts.mock.calls[0][1]({}));
  expect(screen.getByText('Unable to load alerts from Firestore.')).toBeTruthy();
  expect(screen.getByText('Alerts are unavailable.')).toBeTruthy();
});
test('UC3 mock alert resolution stays local without backend mutation', async () => {
  env.params.id = 'mock-a';
  const screen = await mount([{ ...alerts[0], firestoreId: 'mock-a' }]);
  await fireEvent.press(screen.getByText('Resolve selected alert'));
  expect(api.resolveManagerAlert).not.toHaveBeenCalled();
  expect(screen.getAllByText('Resolved')).toHaveLength(2);
});
test('UC3 monitoring selects camera and toggles preview pause', async () => {
  const Monitor = require('../src/app/(manager)/monitoring').default;
  const screen = await render(React.createElement(Monitor));
  await fireEvent.press(screen.getByText('East Boundary'));
  await fireEvent.press(screen.getByLabelText('Pause preview'));
  expect(screen.getByText('PAUSED')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Play preview'));
  expect(screen.getByText('PREVIEW')).toBeTruthy();
});
