
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let initializationError: Error | null = null;

try {
  const requiredKeys: (keyof typeof firebaseConfig)[] = [
      'apiKey', 'authDomain', 'projectId'
  ];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config keys in .env.local: ${missingKeys.join(', ')}. Please add them and restart the server.`);
  }

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

} catch (e: any) {
  initializationError = e;
  if (typeof window === 'undefined') {
    // This console log will only appear on the server, guiding the developer.
    console.error("--- FIREBASE INITIALIZATION ERROR ---");
    console.error(e.message);
    console.error("This error is expected if you haven't set up your .env.local file yet. The app will continue to run in a degraded mode.");
    console.error("-------------------------------------");
  }
  
  // Ensure all exports are null if initialization fails
  app = null;
  db = null;
  auth = null;
  googleProvider = null;
}

export { app, db, auth, googleProvider, initializationError };
