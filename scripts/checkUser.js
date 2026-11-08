require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteUser() {
  const targetEmail = process.argv[2] || 'test@example.com';
  const q = query(collection(db, 'users'), where('email', '==', targetEmail));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("User not found in Firestore users collection.");
  } else {
    for (const doc of snap.docs) {
      console.log("Deleting broken user document:", doc.id);
      await deleteDoc(doc.ref);
    }
    console.log("Done.");
  }
}

deleteUser().catch(console.error);
