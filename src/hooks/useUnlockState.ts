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

  /** Whether readonly mode is enabled (all fields disabled) */
  isReadonlyMode: boolean;
}

const UNLOCK_STATE_KEY = 'credit-castor-unlock-state';
const READONLY_MODE_KEY = 'credit-castor-readonly-mode';
const ADMIN_PASSWORD = import.meta.env.PUBLIC_ADMIN_PASSWORD || 'admin2025';

// Default readonly mode from env (true unless explicitly set to 'false')
const DEFAULT_READONLY_MODE = import.meta.env.PUBLIC_READONLY_MODE !== 'false';

/**
 * Load readonly mode from localStorage (defaults to env setting).
 */
function loadReadonlyMode(): boolean {
  try {
    const stored = localStorage.getItem(READONLY_MODE_KEY);
    if (stored === null) {
      return DEFAULT_READONLY_MODE;
    }
    return stored === 'true';
  } catch {
    return DEFAULT_READONLY_MODE;
  }
}

/**
 * Save readonly mode to localStorage.
 */
function saveReadonlyMode(isReadonly: boolean): void {
  try {
    localStorage.setItem(READONLY_MODE_KEY, String(isReadonly));
  } catch (error) {
    console.error('Failed to save readonly mode:', error);
  }
}

/**
 * Load unlock state from localStorage.
 */
function loadUnlockState(): UnlockState {
  try {
    const stored = localStorage.getItem(UNLOCK_STATE_KEY);
    const isReadonlyMode = loadReadonlyMode();

    if (!stored) {
      return {
        isUnlocked: false,
        unlockedAt: null,
        unlockedBy: null,
        isReadonlyMode,
      };
    }

    const parsed = JSON.parse(stored);
    return {
      isUnlocked: parsed.isUnlocked || false,
      unlockedAt: parsed.unlockedAt ? new Date(parsed.unlockedAt) : null,
      unlockedBy: parsed.unlockedBy || null,
      isReadonlyMode,
    };
  } catch (error) {
    console.error('Failed to load unlock state:', error);
    return {
      isUnlocked: false,
      unlockedAt: null,
      unlockedBy: null,
      isReadonlyMode: DEFAULT_READONLY_MODE,
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
  _projectId: string = 'default',
  _onNotification?: unknown
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
          isReadonlyMode: state.isReadonlyMode,
        };
        saveUnlockState(lockedState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isUnlocked, state.isReadonlyMode]);

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
    setState(prev => ({
      ...prev,
      isUnlocked: true,
      unlockedAt: new Date(),
      unlockedBy: userEmail,
    }));
    return true;
  }, []);

  /**
   * Lock collective fields.
   */
  const lock = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      isUnlocked: false,
      unlockedAt: null,
      unlockedBy: null,
    }));
  }, []);

  /**
   * Set readonly mode.
   * @param isReadonly Whether to enable readonly mode
   */
  const setReadonlyMode = useCallback((isReadonly: boolean): void => {
    setState(prev => ({
      ...prev,
      isReadonlyMode: isReadonly,
    }));
    saveReadonlyMode(isReadonly);
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
    setReadonlyMode,
    isLoading: false,
  };
}

/**
 * Get the current unlock state without using a hook (for utility functions).
 */
export function getUnlockState(): UnlockState {
  return loadUnlockState();
}
