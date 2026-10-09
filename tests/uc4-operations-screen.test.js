const env = require('./helpers/screen-environment');
jest.mock('../src/hooks/useStaffProfile', () => ({ useStaffProfile: jest.fn() }));
jest.mock('../src/hooks/useRoleGuard', () => ({ useRoleGuard: jest.fn() }));
jest.mock('../src/services/communityReports', () => ({
  watchCommunityReports: jest.fn(),
  acceptCommunityOperation: jest.fn(),
  respondToCommunityReport: jest.fn(),
  queueCommunityReport: jest.fn(),
  syncCommunityReports: jest.fn(),
  parseCommunitySms: jest.fn(),
}));
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react-native');
const api = require('../src/services/communityReports');
const { useStaffProfile } = require('../src/hooks/useStaffProfile');
const { goBackOrReplace } = require('../src/utils/navigation');
const Screen = require('../src/components/CommunityOperationsScreen').default;
const report = {
  id: 'r1',
  kind: 'crop_raiding',
  village: 'Village One',
  boundarySection: 'East',
  description: 'Crop damage',
  occurredAt: '2026-10-08',
  source: 'community_app',
  status: 'pending',
  assignedTo: '',
  landmark: 'Gate',
  responseNotes: '',
  contactPhone: '123',
  photoUris: ['https://photo'],
  receivedAt: '2026-10-08',
};
let stop;
beforeEach(() => {
  stop = jest.fn();
  useStaffProfile.mockReturnValue({ role: 'ranger' });
  api.watchCommunityReports.mockReturnValue(stop);
  api.acceptCommunityOperation.mockResolvedValue();
  api.respondToCommunityReport.mockResolvedValue();
  api.syncCommunityReports.mockResolvedValue();
  api.parseCommunitySms.mockReturnValue({ kind: 'elephant_sighting' });
  api.queueCommunityReport.mockResolvedValue({ id: 'sms1' });
});
async function mount(reports = [report], props) {
  const screen = await render(React.createElement(Screen, props));
  await act(async () => api.watchCommunityReports.mock.calls.at(-1)[0](reports));
  return screen;
}
test('UC4 operations subscription shows loading then filters searches and reports', async () => {
  const screen = await render(React.createElement(Screen));
  expect(screen.getAllByText('?')).toHaveLength(3);
  expect(screen.queryByText('No community reports received yet.')).toBeNull();
  await act(async () =>
    api.watchCommunityReports.mock.calls[0][0]([
      report,
      { ...report, id: 'r2', village: 'Village Two', status: 'resolved', source: 'sms_simulated' },
    ]),
  );
  await fireEvent.changeText(screen.getByPlaceholderText(/Search/), ' village two ');
  expect(screen.queryByLabelText('View report from Village One')).toBeNull();
  expect(screen.getByLabelText('View report from Village Two')).toBeTruthy();
  await fireEvent.changeText(screen.getByPlaceholderText(/Search/), 'missing');
  expect(screen.getByText('No matching reports')).toBeTruthy();
  await screen.unmount();
  expect(stop).toHaveBeenCalledTimes(1);
});
test.each(['ranger', 'liaison'])(
  'UC4 %s opens response, accepts and saves chosen status/notes',
  async (role) => {
    useStaffProfile.mockReturnValue({ role });
    const screen = await mount();
    await fireEvent.press(screen.getByLabelText('View report from Village One'));
    await fireEvent.press(screen.getByText('Accept Operation'));
    expect(api.acceptCommunityOperation).toHaveBeenCalledWith('r1');
    await fireEvent.press(screen.getAllByText('resolved').at(-1));
    await fireEvent.changeText(screen.getByLabelText('Response notes'), ' Follow up ');
    await fireEvent.press(screen.getByText('Save Response'));
    expect(api.respondToCommunityReport).toHaveBeenCalledWith('r1', 'resolved', ' Follow up ');
    await fireEvent.press(screen.getByLabelText('Close report details'));
    expect(screen.queryByLabelText('Response notes')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Back to dashboard'));
    expect(goBackOrReplace).toHaveBeenCalledWith(
      role === 'liaison' ? '/(liaison)/dashboard' : '/(ranger)/dashboard',
    );
  },
);
test.each([new Error('denied'), 'unknown'])(
  'UC4 operations acceptance and response errors stay in details %#',
  async (error) => {
    api.acceptCommunityOperation.mockRejectedValueOnce(error);
    api.respondToCommunityReport.mockRejectedValueOnce(error);
    const screen = await mount();
    await fireEvent.press(screen.getByLabelText('View report from Village One'));
    await fireEvent.press(screen.getByText('Accept Operation'));
    expect(screen.getByText(error.message || 'Unable to accept operation.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save Response'));
    expect(screen.getByText(error.message || 'Unable to save response.')).toBeTruthy();
  },
);
test('UC4 accepted demo report exposes owner without another accept button', async () => {
  const screen = await mount([
    {
      ...report,
      assignedTo: 'officer',
      demoAcceptance: true,
      status: 'investigating',
      source: 'sms_simulated',
      receivedAt: '',
    },
  ]);
  await fireEvent.press(screen.getByLabelText('View report from Village One'));
  expect(screen.getByText('Accepted by: officer')).toBeTruthy();
  expect(screen.queryByText('Accept Operation')).toBeNull();
  expect(screen.getByText(/Demo acceptance: saved/)).toBeTruthy();
});
test('UC4 operations subscription errors show failure and no reports', async () => {
  const screen = await render(React.createElement(Screen));
  await act(async () => api.watchCommunityReports.mock.calls[0][1](new Error('denied')));
  expect(screen.getByText('denied')).toBeTruthy();
});
test('UC4 SMS simulation uses edited input and gives explicit prototype receipt', async () => {
  const screen = await mount([], { manager: true });
  await fireEvent.changeText(screen.getByLabelText('Simulated sender phone'), '123');
  await fireEvent.changeText(
    screen.getByLabelText('Simulated SMS message'),
    'CROP | V | E | Gate | Damage',
  );
  await fireEvent.press(screen.getByText('Simulate Incoming SMS'));
  expect(api.parseCommunitySms).toHaveBeenCalledWith('CROP | V | E | Gate | Damage', '123');
  expect(api.queueCommunityReport).toHaveBeenCalledWith({ kind: 'elephant_sighting' }, []);
  expect(screen.getByText(/Simulated SMS saved: sms1/)).toBeTruthy();
});
test.each([new Error('invalid keyword'), 'unknown'])(
  'UC4 SMS invalid input prevents queueing %#',
  async (error) => {
    api.parseCommunitySms.mockImplementationOnce(() => {
      throw error;
    });
    const screen = await mount([]);
    await fireEvent.press(screen.getByText('Simulate Incoming SMS'));
    expect(screen.getByText(error.message || 'Invalid simulated SMS.')).toBeTruthy();
    expect(api.queueCommunityReport).not.toHaveBeenCalled();
  },
);
test('UC4 manager and community route wrappers render actual operations content', async () => {
  const Community = require('../src/app/community-operations').default,
    Manager = require('../src/app/(manager)/community-reports').default;
  let screen = await render(React.createElement(Community));
  expect(screen.getByText('Community reports')).toBeTruthy();
  await screen.unmount();
  screen = await render(React.createElement(Manager));
  expect(screen.getByText('Community reports')).toBeTruthy();
  expect(screen.queryByLabelText('Back to dashboard')).toBeNull();
});
