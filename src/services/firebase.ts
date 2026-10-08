import { initializeApp, getApps, getApp } from "firebase/app";
import { getPersistentAuth } from './persistentAuth';
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCicMF7Sos7NZgHjJ80Z_FiMI0wrpihNps",
  authDomain: "wildtrail-a7918.firebaseapp.com",
  projectId: "wildtrail-a7918",
  storageBucket: "wildtrail-a7918.firebasestorage.app",
  messagingSenderId: "949588157701",
  appId: "1:949588157701:web:40574d61373a31b72f436c",
};

// Initialize Firebase safely (prevents duplicate app error during Fast Refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getPersistentAuth(app);
// Avoid streaming WebChannel requests that can stall on mobile networks/proxies.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
});
export const storage = getStorage(app);
export { app };