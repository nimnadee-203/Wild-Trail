export type ManagerSection =
  | 'overview'
  | 'monitoring'
  | 'alerts'
  | 'patrols'
  | 'incidents'
  | 'reports';

export const managerSections: Array<{ key: ManagerSection; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'monitoring', label: 'Live Monitoring', icon: 'videocam-outline' },
  { key: 'alerts', label: 'Alerts & Response', icon: 'notifications-outline' },
  { key: 'patrols', label: 'Patrols', icon: 'walk-outline' },
  { key: 'incidents', label: 'Incidents & Community', icon: 'people-outline' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
];

export const alerts = [
  { id: 'ALT-1042', title: 'Suspicious movement detected', zone: 'North Ridge', time: '8 min ago', severity: 'High', status: 'Active' },
  { id: 'ALT-1041', title: 'Ranger check-in overdue', zone: 'East Boundary', time: '24 min ago', severity: 'Medium', status: 'Assigned' },
  { id: 'ALT-1039', title: 'Vehicle entered restricted zone', zone: 'River Gate', time: '1 hr ago', severity: 'Low', status: 'Resolved' },
];

export const patrols = [
  { name: 'Alpha Team', ranger: 'James Mwangi', zone: 'North Ridge', status: 'On patrol', progress: 72, last: 'Checked in 4 min ago' },
  { name: 'Bravo Team', ranger: 'Amina Hassan', zone: 'River Gate', status: 'On patrol', progress: 45, last: 'Checked in 18 min ago' },
  { name: 'Charlie Team', ranger: 'Peter Otieno', zone: 'East Boundary', status: 'Break', progress: 28, last: 'Break started 12 min ago' },
  { name: 'Delta Team', ranger: 'Grace Wanjiku', zone: 'South Camp', status: 'Completed', progress: 100, last: 'Completed at 11:42 AM' },
];

export const incidents = [
  { id: 'INC-2408', type: 'Human-wildlife conflict', reporter: 'M. Kilonzo', location: 'Maji Moto village', date: 'Today, 10:24 AM', status: 'Investigating', priority: 'High' },
  { id: 'INC-2407', type: 'Illegal activity', reporter: 'Ranger report', location: 'North Ridge', date: 'Yesterday, 4:15 PM', status: 'In progress', priority: 'High' },
  { id: 'INC-2406', type: 'Animal sighting', reporter: 'J. Njoroge', location: 'River Gate', date: 'Yesterday, 9:02 AM', status: 'Resolved', priority: 'Low' },
  { id: 'INC-2405', type: 'Crop damage', reporter: 'A. Wambui', location: 'Kiboko village', date: 'Oct 03, 2024', status: 'Under review', priority: 'Medium' },
];
