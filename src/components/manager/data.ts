export type ManagerSection =
  | 'overview'
  | 'monitoring'
  | 'alerts'
  | 'patrols'
  | 'incidents'
  | 'community-reports'
  | 'reports';

export const managerSections: Array<{ key: ManagerSection; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'monitoring', label: 'Live Monitoring', icon: 'videocam-outline' },
  { key: 'alerts', label: 'Alerts & Response', icon: 'notifications-outline' },
  { key: 'patrols', label: 'Patrols', icon: 'walk-outline' },
  { key: 'incidents', label: 'Incidents', icon: 'people-outline' },
  { key: 'community-reports', label: 'Community Reports', icon: 'people-circle-outline' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
];

export const alerts = [
  {
    firestoreId: 'mock-alt-1042',
    id: 'Elephant E-014',
    animalId: 'Elephant E-014',
    title: 'Asian Elephant risk alert',
    species: 'Asian Elephant (Bull, 28 yrs)',
    zone: 'North Ridge / Farmland Zone B',
    time: '8 min ago',
    severity: 'High' as const,
    status: 'Active' as const,
    distance: '350m to village boundary',
    description: 'Tracked collar GPS logged crossing outer boundary fence into cultivated paddies.',
    latitude: '6.2982° S',
    longitude: '81.3392° E',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg',
  },
  {
    firestoreId: 'mock-alt-1041',
    id: 'Elephant E-011',
    animalId: 'Elephant E-011',
    title: 'Herd movement near corridor',
    species: 'Asian Elephant (Cow, Herd leader)',
    zone: 'East Boundary / Waterhole Zone C',
    time: '24 min ago',
    severity: 'Medium' as const,
    status: 'Assigned' as const,
    distance: '1.2 km to buffer border',
    description: 'Herd moving along southern migration corridor towards agricultural transition zone.',
    latitude: '6.3011° S',
    longitude: '81.3411° E',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Elephant_near_ndutu.jpg/320px-Elephant_near_ndutu.jpg',
  },
  {
    firestoreId: 'mock-alt-1039',
    id: 'Leopard L-003',
    animalId: 'Leopard L-003',
    title: 'Vehicle entered restricted zone',
    species: 'African Leopard (Adult Male)',
    zone: 'River Gate',
    time: '1 hr ago',
    severity: 'Low' as const,
    status: 'Resolved' as const,
    distance: 'Cleared 2.5 km deep into reserve',
    description: 'Unauthorized safari vehicle approached within 50m of rocky outcrop. Ranger team dispatched and area cleared.',
    latitude: '6.2845° S',
    longitude: '81.3508° E',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Leopard_africa.jpg/320px-Leopard_africa.jpg',
  },
];

export const patrols = [
  { name: 'Alpha Team', ranger: 'James Mwangi', zone: 'North Ridge', status: 'On patrol', progress: 72, last: 'Checked in 4 min ago' },
  { name: 'Bravo Team', ranger: 'Amina Hassan', zone: 'River Gate', status: 'On patrol', progress: 45, last: 'Checked in 18 min ago' },
  { name: 'Charlie Team', ranger: 'Peter Otieno', zone: 'East Boundary', status: 'Break', progress: 28, last: 'Break started 12 min ago' },
  { name: 'Delta Team', ranger: 'Grace Wanjiku', zone: 'South Camp', status: 'Completed', progress: 100, last: 'Completed at 11:42 AM' },
];

export type MockRangerStatus = 'available' | 'on patrol' | 'off duty';

export type MockRanger = {
  id: string;
  name: string;
  badge: string;
  zone: string;
  status: MockRangerStatus;
};

export const mockRangers: MockRanger[] = [
  { id: 'ranger-204', name: 'James Mwangi', badge: 'RG-204', zone: 'North Ridge', status: 'available' },
  { id: 'ranger-211', name: 'Amina Hassan', badge: 'RG-211', zone: 'River Gate', status: 'available' },
  { id: 'ranger-218', name: 'Peter Otieno', badge: 'RG-218', zone: 'East Boundary', status: 'on patrol' },
  { id: 'ranger-223', name: 'Grace Wanjiku', badge: 'RG-223', zone: 'South Camp', status: 'available' },
  { id: 'ranger-230', name: 'Daniel Kariuki', badge: 'RG-230', zone: 'West Valley', status: 'off duty' },
  { id: 'ranger-236', name: 'Lydia Chebet', badge: 'RG-236', zone: 'Marsh Flats', status: 'available' },
];

export const incidents = [
  { id: 'INC-2408', type: 'Human-wildlife conflict', reporter: 'M. Kilonzo', location: 'Maji Moto village', date: 'Today, 10:24 AM', status: 'Investigating', priority: 'High' },
  { id: 'INC-2407', type: 'Illegal activity', reporter: 'Ranger report', location: 'North Ridge', date: 'Yesterday, 4:15 PM', status: 'In progress', priority: 'High' },
  { id: 'INC-2406', type: 'Animal sighting', reporter: 'J. Njoroge', location: 'River Gate', date: 'Yesterday, 9:02 AM', status: 'Resolved', priority: 'Low' },
  { id: 'INC-2405', type: 'Crop damage', reporter: 'A. Wambui', location: 'Kiboko village', date: 'Oct 03, 2024', status: 'Under review', priority: 'Medium' },
];
