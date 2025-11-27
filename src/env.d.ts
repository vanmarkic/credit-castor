/// <reference types="vite/client" />

interface ImportMetaEnv {
  // App passwords (Astro uses PUBLIC_ prefix for client-side variables)
  readonly PUBLIC_APP_PASSWORD?: string;
  readonly PUBLIC_ADMIN_PASSWORD?: string;

  // Firebase configuration
  readonly PUBLIC_FIREBASE_API_KEY?: string;

  // Firestore write control (set to 'true' to enable writes in dev mode)
  readonly PUBLIC_ENABLE_FIRESTORE_WRITES?: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly PUBLIC_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
