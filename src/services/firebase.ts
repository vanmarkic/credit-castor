import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase configuration from environment variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Check if Firebase is configured (all required env vars are present)
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

/**
 * Initialize Firebase app and Firestore
 * Returns null if Firebase is not configured (missing env vars)
 */
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initializeFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  // If already initialized, return existing instances
  if (app && db) {
    return { app, db };
  }

  // Check if Firebase is configured
  if (!isFirebaseConfigured()) {
    console.warn(
      'Firebase is not configured. Please add Firebase environment variables to .env file.\n' +
      'Required variables:\n' +
      '  - VITE_FIREBASE_API_KEY\n' +
      '  - VITE_FIREBASE_AUTH_DOMAIN\n' +
      '  - VITE_FIREBASE_PROJECT_ID\n' +
      '  - VITE_FIREBASE_STORAGE_BUCKET\n' +
      '  - VITE_FIREBASE_MESSAGING_SENDER_ID\n' +
      '  - VITE_FIREBASE_APP_ID\n\n' +
      'The app will continue to work with localStorage-only mode.'
    );
    return { app: null, db: null };
  }

  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    console.log('✅ Firebase initialized successfully');
    return { app, db };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    return { app: null, db: null };
  }
}

/**
 * Get the Firestore instance
 * Returns null if Firebase is not configured or initialization failed
 */
export function getDb(): Firestore | null {
  if (!db) {
    const { db: initializedDb } = initializeFirebase();
    return initializedDb;
  }
  return db;
}

/**
 * Get the Firebase app instance
 * Returns null if Firebase is not configured or initialization failed
 */
export function getApp(): FirebaseApp | null {
  if (!app) {
    const { app: initializedApp } = initializeFirebase();
    return initializedApp;
  }
  return app;
}
