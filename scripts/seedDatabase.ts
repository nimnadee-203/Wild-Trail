import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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
  {
    animalId: 'Leopard L-003',
    species: 'Indian Leopard (Male)',
    location: 'Northern Buffer Boundary',
    distance: '2.8 km to village',
    level: 'LOW',
    timestamp: 'Today, 02:15 PM',
    status: 'RESPONDED',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Leopard_africa.jpg/320px-Leopard_africa.jpg',
    description: 'Stationary position inside dense brush for over 3 hours. No conflict risk detected.',
    latitude: '6.310123° S',
    longitude: '81.335500° E',
  },
];

async function seed() {
  console.log("Starting seeding...");
  const alertsRef = collection(db, 'alerts');
  for (const alert of alerts) {
    const docRef = await addDoc(alertsRef, alert);
    console.log("Added alert:", docRef.id);
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
