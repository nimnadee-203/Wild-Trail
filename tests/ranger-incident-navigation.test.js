jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const { router } = require('expo-router');
const { openRangerIncidentReport } = require('../src/utils/rangerIncidentNavigation');

test('Every new report gets its own session, including repeated clicks in the same millisecond', () => {
  jest.spyOn(Date, 'now').mockReturnValue(123);
  openRangerIncidentReport(true);
  openRangerIncidentReport();
  openRangerIncidentReport();
  const routes = router.push.mock.calls.map(([route]) => route);
  expect(routes.map(route => route.params.emergency)).toEqual(['true', 'false', 'false']);
  expect(new Set(routes.map(route => route.params.reportSession)).size).toBe(3);
  expect(routes.every(route => route.pathname === '/(ranger)/report-incident')).toBe(true);
});
