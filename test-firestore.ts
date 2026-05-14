
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  console.log("Starting Firestore test...");
  try {
    const querySnapshot = await getDocs(collection(db, 'handymen'));
    console.log("Success! Handymen count:", querySnapshot.size);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
