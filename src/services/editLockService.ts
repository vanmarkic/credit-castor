/**
 * Edit Lock Service
 *
 * Firestore-based collaborative editing lock coordination
 * Prevents multiple users from editing simultaneously
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentReference
} from 'firebase/firestore';

/**
 * Lock expiration duration in milliseconds (5 minutes)
 */
export const LOCK_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Heartbeat interval in milliseconds (30 seconds)
 */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/**
 * Admin password for force unlock
 */
const ADMIN_PASSWORD = import.meta.env.PUBLIC_ADMIN_PASSWORD || 'admin2025';

/**
 * Represents an active edit lock
 */
export interface EditLock {
  /** User email who holds the lock */
  userEmail: string;

  /** Unique session ID */
  sessionId: string;

  /** When the lock was acquired */
  acquiredAt: Date;

  /** When the lock expires */
  expiresAt: Date;

  /** Last heartbeat timestamp */
  lastHeartbeat: Date;
}

/**
 * Result of lock acquisition attempt
 */
export interface LockAcquisitionResult {
  /** Whether lock was successfully acquired */
  success: boolean;

  /** The acquired lock (if successful) */
  lock?: EditLock;

  /** Reason for failure */
  reason?: 'locked' | 'error';

  /** Existing lock details (if locked by someone else) */
  existingLock?: EditLock;

  /** Error message */
  error?: string;
}

/**
 * Result of lock status check
 */
export interface LockStatus {
  /** Whether project is currently locked */
  isLocked: boolean;

  /** Lock details (if locked) */
  lock: EditLock | null;

  /** Whether the lock has expired */
  isExpired?: boolean;
}

/**
 * Result of force release operation
 */
export interface ForceReleaseResult {
  /** Whether force release was successful */
  success: boolean;

  /** Error type */
  error?: 'invalid-password' | 'firestore-error';

  /** Error message */
  message?: string;
}

/**
 * Firestore document structure for edit lock
 */
interface EditLockDocument {
  userEmail: string;
  sessionId: string;
  acquiredAt: Timestamp | ReturnType<typeof serverTimestamp>;
  expiresAt: Timestamp;
  lastHeartbeat: Timestamp | ReturnType<typeof serverTimestamp>;
}

/**
 * Get lock document reference
 * Note: Assumes db is not null (callers must verify)
 */
function getLockDocRef(projectId: string): DocumentReference {
  return doc(db!, 'editLocks', projectId);
}

/**
 * Convert Firestore document to EditLock
 */
function documentToLock(data: EditLockDocument): EditLock {
  return {
    userEmail: data.userEmail,
    sessionId: data.sessionId,
    acquiredAt: data.acquiredAt instanceof Timestamp ? data.acquiredAt.toDate() : new Date(),
    expiresAt: data.expiresAt.toDate(),
    lastHeartbeat: data.lastHeartbeat instanceof Timestamp ? data.lastHeartbeat.toDate() : new Date(),
  };
}

/**
 * Check if a lock is expired
 */
function isLockExpired(lock: EditLock): boolean {
  return lock.expiresAt.getTime() < Date.now();
}

/**
 * Attempt to acquire edit lock for a project
 *
 * Uses Firestore transaction to ensure atomicity and prevent race conditions
 */
export async function acquireEditLock(
  projectId: string,
  userEmail: string,
  sessionId: string
): Promise<LockAcquisitionResult> {
  if (!db) {
    return {
      success: false,
      reason: 'error',
      error: 'Firestore is not configured',
    };
  }

  try {
    const lockRef = getLockDocRef(projectId);

    const result = await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      // Check if lock exists
      if (lockDoc.exists()) {
        const existingLock = documentToLock(lockDoc.data() as EditLockDocument);

        // Check if it's the same user/session (allow re-acquisition)
        if (existingLock.userEmail === userEmail && existingLock.sessionId === sessionId) {
          // Same user/session - extend expiration
          const newExpiresAt = Timestamp.fromDate(new Date(Date.now() + LOCK_EXPIRATION_MS));

          transaction.update(lockRef, {
            expiresAt: newExpiresAt,
            lastHeartbeat: serverTimestamp(),
          });

          return {
            success: true,
            lock: {
              ...existingLock,
              expiresAt: newExpiresAt.toDate(),
              lastHeartbeat: new Date(),
            },
          };
        }

        // Check if lock is expired
        if (isLockExpired(existingLock)) {
          // Expired - acquire for new user
          const now = new Date();
          const newExpiresAt = new Date(now.getTime() + LOCK_EXPIRATION_MS);

          const newLockDoc: EditLockDocument = {
            userEmail,
            sessionId,
            acquiredAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(newExpiresAt),
            lastHeartbeat: serverTimestamp(),
          };

          transaction.set(lockRef, newLockDoc);

          return {
            success: true,
            lock: {
              userEmail,
              sessionId,
              acquiredAt: now,
              expiresAt: newExpiresAt,
              lastHeartbeat: now,
            },
          };
        }

        // Lock is active and owned by someone else
        return {
          success: false,
          reason: 'locked' as const,
          existingLock,
        };
      }

      // No lock exists - acquire it
      const now = new Date();
      const expiresAt = new Date(now.getTime() + LOCK_EXPIRATION_MS);

      const newLockDoc: EditLockDocument = {
        userEmail,
        sessionId,
        acquiredAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        lastHeartbeat: serverTimestamp(),
      };

      transaction.set(lockRef, newLockDoc);

      return {
        success: true,
        lock: {
          userEmail,
          sessionId,
          acquiredAt: now,
          expiresAt,
          lastHeartbeat: now,
        },
      };
    });

    return result;
  } catch (error) {
    console.error('Failed to acquire edit lock:', error);
    return {
      success: false,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Release edit lock
 *
 * Only succeeds if the lock is owned by the specified user/session
 */
export async function releaseEditLock(
  projectId: string,
  userEmail: string,
  sessionId: string
): Promise<boolean> {
  if (!db) {
    return false;
  }

  try {
    const lockRef = getLockDocRef(projectId);

    const released = await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (!lockDoc.exists()) {
        return false;
      }

      const lock = documentToLock(lockDoc.data() as EditLockDocument);

      // Only allow releasing own lock
      if (lock.userEmail === userEmail && lock.sessionId === sessionId) {
        transaction.delete(lockRef);
        return true;
      }

      return false;
    });

    return released;
  } catch (error) {
    console.error('Failed to release edit lock:', error);
    return false;
  }
}

/**
 * Check current lock status
 */
export async function checkLockStatus(projectId: string): Promise<LockStatus> {
  if (!db) {
    return {
      isLocked: false,
      lock: null,
    };
  }

  try {
    const lockRef = getLockDocRef(projectId);
    const lockDoc = await getDoc(lockRef);

    if (!lockDoc.exists()) {
      return {
        isLocked: false,
        lock: null,
      };
    }

    const lock = documentToLock(lockDoc.data() as EditLockDocument);

    // Check if expired
    if (isLockExpired(lock)) {
      return {
        isLocked: false,
        lock: null,
        isExpired: true,
      };
    }

    return {
      isLocked: true,
      lock,
    };
  } catch (error) {
    console.error('Failed to check lock status:', error);
    return {
      isLocked: false,
      lock: null,
    };
  }
}

/**
 * Extend lock expiration (for heartbeat)
 *
 * Only succeeds if lock is owned by specified user/session
 */
export async function extendLockExpiration(
  projectId: string,
  userEmail: string,
  sessionId: string
): Promise<boolean> {
  if (!db) {
    return false;
  }

  try {
    const lockRef = getLockDocRef(projectId);

    const extended = await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (!lockDoc.exists()) {
        return false;
      }

      const lock = documentToLock(lockDoc.data() as EditLockDocument);

      // Only allow extending own lock
      if (lock.userEmail === userEmail && lock.sessionId === sessionId) {
        const newExpiresAt = Timestamp.fromDate(new Date(Date.now() + LOCK_EXPIRATION_MS));

        transaction.update(lockRef, {
          expiresAt: newExpiresAt,
          lastHeartbeat: serverTimestamp(),
        });

        return true;
      }

      return false;
    });

    return extended;
  } catch (error) {
    console.error('Failed to extend lock expiration:', error);
    return false;
  }
}

/**
 * Force release edit lock (admin only)
 *
 * Requires admin password
 */
export async function forceReleaseLock(
  projectId: string,
  password: string
): Promise<ForceReleaseResult> {
  // Verify admin password
  if (password !== ADMIN_PASSWORD) {
    return {
      success: false,
      error: 'invalid-password',
      message: 'Mot de passe administrateur incorrect',
    };
  }

  if (!db) {
    return {
      success: false,
      error: 'firestore-error',
      message: 'Firestore is not configured',
    };
  }

  try {
    const lockRef = getLockDocRef(projectId);
    await deleteDoc(lockRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to force release lock:', error);
    return {
      success: false,
      error: 'firestore-error',
      message: error instanceof Error ? error.message : 'Erreur Firestore',
    };
  }
}
