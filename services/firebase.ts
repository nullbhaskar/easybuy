/**
 * ============================================================
 * EasyBuy - AI-Powered E-Commerce Mobile Application
 * ------------------------------------------------------------
 * Author      : Bhaskar Das
 * Institution : DPGITM
 * Internship  : 2026
 * ------------------------------------------------------------
 * © 2026 Bhaskar Das. All rights reserved.
 * Unauthorized copying, redistribution, or plagiarism of
 * this source code is strictly prohibited.
 * ============================================================
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, inMemoryPersistence } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

try {
  if (Platform.OS === 'web') {
    auth = initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  auth = getAuth(app);
}


const db: Firestore = getFirestore(app);

export { app, auth, db };
export default db;


