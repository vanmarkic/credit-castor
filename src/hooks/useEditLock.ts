/**
 * useEditLock Hook
 *
 * React hook for managing edit lock state with real-time Firestore synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  acquireEditLock,
  releaseEditLock,
  extendLockExpiration,
  type EditLock,
  HEARTBEAT_INTERVAL_MS,
} from '../services/editLockService';

/**
 * Notification types for lock events
 */
export interface LockNotification {
  type: 'lock-acquired' | 'lock-released' | 'lock-denied' | 'lock-stolen' | 'lock-error';
  message: string;
  lockOwner?: string;
}

/**
 * Hook state interface
 */
export interface UseEditLockState {
  /** Whether the project is currently locked */
  isLocked: boolean;

  /** Email of the user who holds the lock (if any) */
  lockOwner: string | null;

  /** Whether the current user holds the lock */
  isOwnLock: boolean;

  /** Lock details */
  lockDetails: EditLock | null;

  /** Acquire the edit lock */
  acquireLock: () => Promise<boolean>;

  /** Release the edit lock */
  releaseLock: () => Promise<boolean>;

  /** Whether a lock operation is in progress */
  isLoading: boolean;
}

/**
 * Hook for managing edit lock with real-time sync
 *
 * @param projectId - Project ID to lock
 * @param userEmail - Current user's email
 * @param sessionId - Unique session ID
 * @param onNotification - Optional callback for lock notifications
 */
export function useEditLock(
  projectId: string,
  userEmail: string,
  sessionId: string,
  onNotification?: (notification: LockNotification) => void
): UseEditLockState {
  const [isLocked, setIsLocked] = useState(false);
  const [lockOwner, setLockOwner] = useState<string | null>(null);
  const [lockDetails, setLockDetails] = useState<EditLock | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isOwnLockRef = useRef(false);

  // Computed: Is this the current user's lock?
  const isOwnLock = isLocked && lockOwner === userEmail && lockDetails?.sessionId === sessionId;

  // Keep ref in sync for cleanup
  useEffect(() => {
    isOwnLockRef.current = isOwnLock;
  }, [isOwnLock]);

  /**
   * Start heartbeat to keep lock alive
   */
  const startHeartbeat = useCallback(() => {
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const extended = await extendLockExpiration(projectId, userEmail, sessionId);
        if (!extended) {
          console.warn('Failed to extend lock expiration');
          // Stop heartbeat if we can't extend
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [projectId, userEmail, sessionId]);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Acquire lock
   */
  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!db) {
      onNotification?.({
        type: 'lock-error',
        message: 'Firebase n\'est pas configuré',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const result = await acquireEditLock(projectId, userEmail, sessionId);

      if (result.success) {
        // Start heartbeat
        startHeartbeat();

        onNotification?.({
          type: 'lock-acquired',
          message: 'Vous avez déverrouillé les champs collectifs',
        });

        return true;
      } else {
        // Failed to acquire lock
        const ownerEmail = result.existingLock?.userEmail || 'un autre utilisateur';
        onNotification?.({
          type: 'lock-denied',
          message: `${ownerEmail} est en train de modifier le projet`,
          lockOwner: result.existingLock?.userEmail,
        });

        return false;
      }
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      onNotification?.({
        type: 'lock-error',
        message: 'Erreur lors du déverrouillage',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, userEmail, sessionId, onNotification, startHeartbeat]);

  /**
   * Release lock
   */
  const releaseLock = useCallback(async (): Promise<boolean> => {
    if (!db) {
      return false;
    }

    setIsLoading(true);

    try {
      // Stop heartbeat first
      stopHeartbeat();

      const released = await releaseEditLock(projectId, userEmail, sessionId);

      if (released) {
        onNotification?.({
          type: 'lock-released',
          message: 'Vous avez verrouillé les champs collectifs',
        });
      }

      return released;
    } catch (error) {
      console.error('Failed to release lock:', error);
      onNotification?.({
        type: 'lock-error',
        message: 'Erreur lors du verrouillage',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, userEmail, sessionId, onNotification, stopHeartbeat]);

  /**
   * Subscribe to real-time lock changes
   */
  useEffect(() => {
    if (!db) {
      return;
    }

    const lockRef = doc(db, 'editLocks', projectId);

    const unsubscribe = onSnapshot(
      lockRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          const lock: EditLock = {
            userEmail: data.userEmail,
            sessionId: data.sessionId,
            acquiredAt: data.acquiredAt?.toDate?.() || new Date(),
            expiresAt: data.expiresAt?.toDate?.() || new Date(),
            lastHeartbeat: data.lastHeartbeat?.toDate?.() || new Date(),
          };

          setIsLocked(true);
          setLockOwner(lock.userEmail);
          setLockDetails(lock);

          // If someone else took the lock, notify
          if (lock.userEmail !== userEmail || lock.sessionId !== sessionId) {
            // Stop our heartbeat if we were holding the lock
            stopHeartbeat();

            onNotification?.({
              type: 'lock-stolen',
              message: `${lock.userEmail} a pris le verrou`,
              lockOwner: lock.userEmail,
            });
          }
        } else {
          // No lock exists
          setIsLocked(false);
          setLockOwner(null);
          setLockDetails(null);
        }
      },
      (error) => {
        console.error('Lock subscription error:', error);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [projectId, userEmail, sessionId, onNotification, stopHeartbeat]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Release lock and stop heartbeat on unmount
      stopHeartbeat();

      if (isOwnLockRef.current && db) {
        releaseEditLock(projectId, userEmail, sessionId).catch((error) => {
          console.error('Failed to release lock on unmount:', error);
        });
      }

      // Unsubscribe from Firestore
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [projectId, userEmail, sessionId, stopHeartbeat]);

  return {
    isLocked,
    lockOwner,
    isOwnLock,
    lockDetails,
    acquireLock,
    releaseLock,
    isLoading,
  };
}
