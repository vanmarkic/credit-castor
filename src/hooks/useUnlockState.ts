import { useState, useEffect, useCallback } from 'react';

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
}

const UNLOCK_STATE_KEY = 'credit-castor-unlock-state';
const ADMIN_PASSWORD = import.meta.env.PUBLIC_ADMIN_PASSWORD || 'admin2025';

/**
 * Load unlock state from localStorage.
 */
function loadUnlockState(): UnlockState {
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
 */
function saveUnlockState(state: UnlockState): void {
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
 *
 * @param projectId - Project ID (unused, kept for backwards compatibility)
 * @param onNotification - Optional callback (unused, kept for backwards compatibility)
 */
export function useUnlockState(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  projectId: string = 'default',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNotification?: unknown
) {
  const [state, setState] = useState<UnlockState>(loadUnlockState);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveUnlockState(state);
  }, [state]);

  // Auto-lock when user closes the app/tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.isUnlocked) {
        const lockedState: UnlockState = {
          isUnlocked: false,
          unlockedAt: null,
          unlockedBy: null,
        };
        saveUnlockState(lockedState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isUnlocked]);

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

    // Update state
    const newState: UnlockState = {
      isUnlocked: true,
      unlockedAt: new Date(),
      unlockedBy: userEmail,
    };

    setState(newState);
    return true;
  }, []);

  /**
   * Lock collective fields.
   */
  const lock = useCallback(async (): Promise<void> => {
    const newState: UnlockState = {
      isUnlocked: false,
      unlockedAt: null,
      unlockedBy: null,
    };

    setState(newState);
  }, []);

  /**
   * Check if a password is correct (without unlocking).
   */
  const validatePassword = useCallback((password: string): boolean => {
    return password === ADMIN_PASSWORD;
  }, []);

  return {
    ...state,
    unlock,
    lock,
    validatePassword,
    isLoading: false,
  };
}

/**
 * Get the current unlock state without using a hook (for utility functions).
 */
export function getUnlockState(): UnlockState {
  return loadUnlockState();
}
