import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCicMF7Sos7NZgHjJ80Z_FiMI0wrpihNps",
  authDomain: "wildtrail-a7918.firebaseapp.com",
  projectId: "wildtrail-a7918",
  storageBucket: "wildtrail-a7918.firebasestorage.app",
  messagingSenderId: "949588157701",
  appId: "1:949588157701:web:40574d61373a31b72f436c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);