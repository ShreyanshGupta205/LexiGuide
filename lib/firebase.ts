import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDk_hRbTNl0FYldsXc8eby9KfohSpZ6Et4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lexiguideoi.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lexiguideoi",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lexiguideoi.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "622121944120",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:622121944120:web:b73f428c93c21c99aad2cd",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MH7CXPW3JE",
};

/**
 * Singleton Firebase Application instance (safe for Next.js App Router & SSR)
 */
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance
 */
export const auth: Auth = getAuth(app);

/**
 * Safe client-side analytics initialization
 */
let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window !== "undefined" && !analyticsInstance) {
    try {
      const supported = await isSupported();
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    } catch (err) {
      // Non-blocking analytics init
    }
  }
  return analyticsInstance;
}
