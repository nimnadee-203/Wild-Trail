import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const testFirebaseConnection = async () => {
  try {
    const snapshot = await getDocs(collection(db, "test"));

    console.log("Firebase connected successfully!");
    console.log("Documents:", snapshot.size);
  } catch (error) {
    console.error("Firebase connection failed:", error);
  }
};