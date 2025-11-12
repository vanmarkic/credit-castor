import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditLock, type LockNotification } from './useEditLock';
import { forceReleaseLock } from '../services/editLockService';
import { isFirebaseConfigured } from '../services/firebase';

/**
 * Represents the unlock state for collective fields.
 */
export interface UnlockState {
  /** Whether collective fields are currently unlocked */
  isUnlocked: boolean;

  /** Timestamp when fields were unlocked */
  unlockedAt: Date | null;

  /** Email of the user who unlocked the fields */
  unlockedBy: string | null;

  /** Whether another user is currently editing (Firestore lock) */
  isLockedByOther: boolean;

  /** Details of the Firestore lock (if any) */
  lockDetails: {
    userEmail: string;
    sessionId: string;
    expiresAt: Date;
    lastHeartbeat: Date;
  } | null;
}

const UNLOCK_STATE_KEY = 'credit-castor-unlock-state';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025';

/**
 * Load unlock state from localStorage.
 */
function loadUnlockState(): Omit<UnlockState, 'isLockedByOther' | 'lockDetails'> {
  try {
    const stored = localStorage.getItem(UNLOCK_STATE_KEY);
    if (!stored) {
      return {
        isUnlocked: false,
        unlockedAt: null,
        unlockedBy: null,
      };
    }

    const parsed = JSON.parse(stored);
    return {
      isUnlocked: parsed.isUnlocked || false,
      unlockedAt: parsed.unlockedAt ? new Date(parsed.unlockedAt) : null,
      unlockedBy: parsed.unlockedBy || null,
    };
  } catch (error) {
    console.error('Failed to load unlock state:', error);
    return {
      isUnlocked: false,
      unlockedAt: null,
      unlockedBy: null,
    };
  }
}

/**
 * Save unlock state to localStorage.
 * Only saves basic fields (not Firestore lock details)
 */
function saveUnlockState(state: Partial<UnlockState>): void {
  try {
    localStorage.setItem(UNLOCK_STATE_KEY, JSON.stringify({
      isUnlocked: state.isUnlocked,
      unlockedAt: state.unlockedAt?.toISOString() || null,
      unlockedBy: state.unlockedBy,
    }));
  } catch (error) {
    console.error('Failed to save unlock state:', error);
  }
}

/**
 * Custom hook to manage the unlock state for collective fields.
 *
 * This hook:
 * - Persists unlock state across browser sessions
 * - Validates admin password before unlocking
 * - Tracks who unlocked and when
 * - Coordinates editing across devices via Firestore (if configured)
 * - Falls back to localStorage-only if Firebase is not configured
 *
 * @param projectId - Project ID for Firestore coordination
 * @param onNotification - Optional callback for lock notifications
 */
export function useUnlockState(
  projectId: string = 'default',
  onNotification?: (notification: LockNotification) => void
) {
  const [localState, setLocalState] = useState<UnlockState>(() => {
    const loaded = loadUnlockState();
    return {
      ...loaded,
      isLockedByOther: false,
      lockDetails: null,
    };
  });

  // Generate a unique session ID for this browser session
  const sessionId = useMemo(() => {
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }, []);

  // Use Firestore-based edit lock if Firebase is configured
  const firestoreEnabled = isFirebaseConfigured();
  const editLock = useEditLock(
    projectId,
    localState.unlockedBy || 'unknown',
    sessionId,
    onNotification
  );

  // Determine if another user has the lock
  const isLockedByOther = firestoreEnabled ? editLock.isLocked && !editLock.isOwnLock : false;

  // Combine local state with Firestore lock state
  const state: UnlockState = {
    ...localState,
    isLockedByOther,
    lockDetails: editLock.lockDetails ? {
      userEmail: editLock.lockDetails.userEmail,
      sessionId: editLock.lockDetails.sessionId,
      expiresAt: editLock.lockDetails.expiresAt,
      lastHeartbeat: editLock.lockDetails.lastHeartbeat,
    } : null,
  };

  // Sync local state to localStorage whenever it changes
  useEffect(() => {
    saveUnlockState(localState);
  }, [localState]);

  // Auto-lock when user closes the app/tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localState.isUnlocked) {
        // Lock the fields before the app closes
        const lockedState: UnlockState = {
          isUnlocked: false,
          unlockedAt: null,
          unlockedBy: null,
          isLockedByOther: false,
          lockDetails: null,
        };
        saveUnlockState(lockedState);

        // Release Firestore lock if enabled
        if (firestoreEnabled && editLock.isOwnLock) {
          editLock.releaseLock();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [localState.isUnlocked, editLock, firestoreEnabled]);

  /**
   * Attempt to unlock collective fields with admin password.
   * @param password Admin password
   * @param userEmail Email of the user requesting unlock
   * @returns Promise<boolean> - true if unlock was successful
   */
  const unlock = useCallback(async (password: string, userEmail: string): Promise<boolean> => {
    // Validate password
    if (password !== ADMIN_PASSWORD) {
      return false;
    }

    // Check if another user has the lock (Firestore)
    if (firestoreEnabled && isLockedByOther) {
      // Cannot unlock - someone else is editing
      return false;
    }

    // Acquire Firestore lock if Firebase is configured
    if (firestoreEnabled) {
      const acquired = await editLock.acquireLock();
      if (!acquired) {
        return false;
      }
    }

    // Update local state
    const newState: UnlockState = {
      isUnlocked: true,
      unlockedAt: new Date(),
      unlockedBy: userEmail,
      isLockedByOther: false,
      lockDetails: null,
    };

    setLocalState(newState);
    return true;
  }, [firestoreEnabled, isLockedByOther, editLock]);

  /**
   * Lock collective fields.
   */
  const lock = useCallback(async (): Promise<void> => {
    // Release Firestore lock if Firebase is configured
    if (firestoreEnabled && editLock.isOwnLock) {
      await editLock.releaseLock();
    }

    // Update local state
    const newState: UnlockState = {
      isUnlocked: false,
      unlockedAt: null,
      unlockedBy: null,
      isLockedByOther: false,
      lockDetails: null,
    };

    setLocalState(newState);
  }, [firestoreEnabled, editLock]);

  /**
   * Force unlock (admin only)
   * Releases the Firestore lock held by another user
   */
  const forceUnlock = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!firestoreEnabled) {
      return { success: false, error: 'Firestore is not configured' };
    }

    const result = await forceReleaseLock(projectId, password);
    return result;
  }, [firestoreEnabled, projectId]);

  /**
   * Check if a password is correct (without unlocking).
   * Useful for validation before showing unlock dialog.
   */
  const validatePassword = useCallback((password: string): boolean => {
    return password === ADMIN_PASSWORD;
  }, []);

  return {
    ...state,
    unlock,
    lock,
    forceUnlock,
    validatePassword,
    isLoading: editLock.isLoading,
  };
}

/**
 * Get the current unlock state without using a hook (for utility functions).
 * Note: This returns only localStorage state, not Firestore lock status
 */
export function getUnlockState(): Omit<UnlockState, 'isLockedByOther' | 'lockDetails'> {
  return loadUnlockState();
}

/**
 * Clear the unlock state (useful for testing or logout).
 */
export function clearUnlockState(): void {
  localStorage.removeItem(UNLOCK_STATE_KEY);
}
