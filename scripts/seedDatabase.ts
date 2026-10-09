import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCicMF7Sos7NZgHjJ80Z_FiMI0wrpihNps",
  authDomain: "wildtrail-a7918.firebaseapp.com",
  projectId: "wildtrail-a7918",
  storageBucket: "wildtrail-a7918.firebasestorage.app",
  messagingSenderId: "949588157701",
  appId: "1:949588157701:web:40574d61373a31b72f436c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
  {
    uid: 'usr-admin-01',
    name: 'Sarah Jenkins',
    email: 'admin@wildguard.org',
    role: 'admin',
    staffId: 'ADM-001',
    badge: 'ADM-001',
    profileId: 'usr-admin-01',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'headquarters',
    phone: '+94 77 123 4567',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    uid: 'usr-ranger-204',
    name: 'Nimal Perera',
    email: 'nimal@wildguard.org',
    role: 'ranger',
    staffId: 'RG-204',
    badge: 'RG-204',
    profileId: 'ranger-204',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'block-01',
    phone: '+94 71 987 6543',
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    uid: 'usr-manager-101',
    name: 'Dr. K. Silva',
    email: 'manager@wildguard.org',
    role: 'manager',
    staffId: 'MGR-101',
    badge: 'MGR-101',
    profileId: 'usr-manager-101',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'sector-north',
    phone: '+94 77 555 1234',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    uid: 'usr-liaison-305',
    name: 'Anura Bandara',
    email: 'liaison@wildguard.org',
    role: 'liaison',
    staffId: 'LIA-305',
    badge: 'LIA-305',
    profileId: 'usr-liaison-305',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'community-buffer-b',
    phone: '+94 76 333 4444',
    createdAt: '2026-03-01T11:00:00Z',
  },
];

const rangers = [
  {
    id: 'ranger-204',
    userId: 'usr-ranger-204',
    name: 'Nimal Perera',
    badge: 'RG-204',
    parkId: 'yala',
    zoneId: 'block-01',
    status: 'AVAILABLE',
    currentPatrolId: null,
    currentAlertId: null,
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    id: 'ranger-105',
    userId: 'usr-ranger-105',
    name: 'Sunil Rathnayake',
    badge: 'RG-105',
    parkId: 'yala',
    zoneId: 'block-02',
    status: 'AVAILABLE',
    currentPatrolId: null,
    currentAlertId: null,
    createdAt: '2026-02-20T09:30:00Z',
  },
];

const alerts = [
  {
    animalId: 'Elephant E-014',
    species: 'Asian Elephant (Bull, 28 yrs)',
    location: 'Farmland Zone B',
    distance: '350m to houses',
    level: 'HIGH',
    timestamp: 'Today, 07:43 PM',
    status: 'PENDING',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg',
    description: 'Tracked collar GPS logged crossing outer boundary fence into cultivated paddies.',
    latitude: '6.298245° S',
    longitude: '81.339256° E',
  },
  {
    animalId: 'Elephant E-011',
    species: 'Asian Elephant (Cow, Herd leader)',
    location: 'Waterhole Zone C',
    distance: '1.2 km to buffer border',
    level: 'MEDIUM',
    timestamp: 'Today, 05:20 PM',
    status: 'ACKNOWLEDGED',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Elephant_near_ndutu.jpg/320px-Elephant_near_ndutu.jpg',
    description: 'Herd moving along southern migration corridor towards agricultural transition zone.',
    latitude: '6.301122° S',
    longitude: '81.341100° E',
  },
];

async function seed() {
  console.log("Starting Firestore database seeding...");

  // 1. Seed users collection: users/{uid}
  console.log("Seeding users collection...");
  for (const user of users) {
    await setDoc(doc(db, 'users', user.uid), user);
    console.log(` -> Added user doc: users/${user.uid} (${user.name} - ${user.role})`);
  }

  // 2. Seed rangers collection: rangers/{id}
  console.log("Seeding rangers collection...");
  for (const ranger of rangers) {
    await setDoc(doc(db, 'rangers', ranger.id), ranger);
    console.log(` -> Added ranger doc: rangers/${ranger.id} (${ranger.name})`);
  }

  // 3. Seed alerts collection
  console.log("Seeding alerts collection...");
  const alertsRef = collection(db, 'alerts');
  for (const alert of alerts) {
    const docRef = await addDoc(alertsRef, alert);
    console.log(` -> Added alert doc: alerts/${docRef.id}`);
  }

  console.log("Firestore database seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

