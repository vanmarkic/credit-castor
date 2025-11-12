import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * User interface for Firestore storage
 */
export interface FirestoreUser {
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

/**
 * Simple hash function for passwords
 * NOTE: In production, use a proper password hashing library like bcrypt
 * For this POC, we use a simple hash
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Register a new user in Firestore
 * Stores email and hashed password in the 'users' collection
 *
 * @returns Success boolean and error message if failed
 */
export async function registerUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré. Impossible de créer un compte.',
      };
    }

    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        success: false,
        error: 'Un utilisateur avec cet email existe déjà.',
      };
    }

    // Hash password and create user document
    const passwordHash = await hashPassword(password);
    const userId = email.replace(/[@.]/g, '_'); // Use email as ID (sanitized)

    const userDoc: FirestoreUser = {
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    return { success: true };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: 'Erreur lors de la création du compte.',
    };
  }
}

/**
 * Authenticate a user with email and password
 * Validates against stored hash in Firestore
 *
 * @returns Success boolean, user data if successful, and error message if failed
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: FirestoreUser;
  error?: string;
}> {
  try {
    const db = getDb();
    if (!db) {
      return {
        success: false,
        error: 'Firebase non configuré. Authentification locale uniquement.',
      };
    }

    // Get user document
    const userId = email.replace(/[@.]/g, '_');
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect.',
      };
    }

    const userData = userDoc.data() as FirestoreUser;

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== userData.passwordHash) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect.',
      };
    }

    // Update last login
    await setDoc(
      userDocRef,
      {
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'authentification.',
    };
  }
}

/**
 * Check if a user exists in Firestore
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    const db = getDb();
    if (!db) return false;

    const userId = email.replace(/[@.]/g, '_');
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    return userDoc.exists();
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
}

/**
 * Get user data from Firestore
 */
export async function getUser(
  email: string
): Promise<FirestoreUser | null> {
  try {
    const db = getDb();
    if (!db) return null;

    const userId = email.replace(/[@.]/g, '_');
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return null;

    return userDoc.data() as FirestoreUser;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}
