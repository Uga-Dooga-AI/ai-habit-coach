import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { initializeAuth, type Auth } from 'firebase/auth';

// Metro resolves the react-native condition at runtime; TS types lack it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (
    storage: typeof AsyncStorage,
  ) => import('firebase/auth').Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

let app: FirebaseApp;
let auth: Auth;

export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every(Boolean);
}

function ensureInitialized() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured for this build');
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

export function getFirebaseApp(): FirebaseApp {
  ensureInitialized();
  return app;
}

export function getFirebaseAuth(): Auth {
  ensureInitialized();
  return auth;
}
