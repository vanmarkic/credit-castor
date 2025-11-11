import { useState, useEffect, useCallback } from 'react';

/**
 * Represents an active user session
 */
export interface ActiveUser {
  /** User email or identifier */
  email: string;
  /** Last activity timestamp */
  lastSeen: Date;
  /** Unique session ID */
  sessionId: string;
}

/**
 * Presence detection configuration
 */
interface PresenceConfig {
  /** How often to update presence (ms) */
  heartbeatInterval?: number;
  /** How long before a user is considered inactive (ms) */
  inactiveThreshold?: number;
  /** LocalStorage key for presence data */
  storageKey?: string;
}

const DEFAULT_CONFIG: Required<PresenceConfig> = {
  heartbeatInterval: 5000, // 5 seconds
  inactiveThreshold: 15000, // 15 seconds
  storageKey: 'credit-castor-presence',
};

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current session ID from sessionStorage (persists for tab lifetime)
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('credit-castor-session-id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('credit-castor-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Parse presence data from localStorage
 */
function loadPresenceData(storageKey: string): Record<string, ActiveUser> {
  try {
    const data = localStorage.getItem(storageKey);
    if (!data) return {};

    const parsed = JSON.parse(data);
    // Convert ISO strings back to Date objects
    const result: Record<string, ActiveUser> = {};
    for (const [sessionId, user] of Object.entries(parsed)) {
      result[sessionId] = {
        ...(user as ActiveUser),
        lastSeen: new Date((user as ActiveUser).lastSeen),
      };
    }
    return result;
  } catch (error) {
    console.error('Failed to load presence data:', error);
    return {};
  }
}

/**
 * Save presence data to localStorage
 */
function savePresenceData(
  storageKey: string,
  data: Record<string, ActiveUser>
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save presence data:', error);
  }
}

/**
 * Clean up inactive users from presence data
 */
function cleanupInactiveUsers(
  data: Record<string, ActiveUser>,
  threshold: number
): Record<string, ActiveUser> {
  const now = Date.now();
  const result: Record<string, ActiveUser> = {};

  for (const [sessionId, user] of Object.entries(data)) {
    if (now - user.lastSeen.getTime() < threshold) {
      result[sessionId] = user;
    }
  }

  return result;
}

/**
 * Hook for detecting presence of other users in different browser tabs/windows.
 *
 * For Phase 2: Uses localStorage + StorageEvent for cross-tab communication
 * For Phase 3: Can be upgraded to Firestore real-time listeners
 *
 * @example
 * ```tsx
 * const { activeUsers, updatePresence } = usePresenceDetection('user@example.com');
 *
 * useEffect(() => {
 *   if (activeUsers.length > 1) {
 *     toast('Autre utilisateur actif!');
 *   }
 * }, [activeUsers]);
 * ```
 */
export function usePresenceDetection(
  userEmail: string | null,
  config: PresenceConfig = {}
) {
  const {
    heartbeatInterval,
    inactiveThreshold,
    storageKey,
  } = { ...DEFAULT_CONFIG, ...config };

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const sessionId = getSessionId();

  /**
   * Update this session's presence
   */
  const updatePresence = useCallback(() => {
    if (!userEmail) return;

    const allPresence = loadPresenceData(storageKey);

    // Update current session
    allPresence[sessionId] = {
      email: userEmail,
      lastSeen: new Date(),
      sessionId,
    };

    // Clean up inactive sessions
    const cleaned = cleanupInactiveUsers(allPresence, inactiveThreshold);

    // Save back to localStorage
    savePresenceData(storageKey, cleaned);

    // Update state (exclude current session)
    const others = Object.values(cleaned).filter(
      (user) => user.sessionId !== sessionId
    );
    setActiveUsers(others);
  }, [userEmail, sessionId, storageKey, inactiveThreshold]);

  /**
   * Remove current session from presence
   */
  const removePresence = useCallback(() => {
    const allPresence = loadPresenceData(storageKey);
    delete allPresence[sessionId];
    savePresenceData(storageKey, allPresence);
  }, [sessionId, storageKey]);

  /**
   * Handle storage events from other tabs
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const allPresence = loadPresenceData(storageKey);
          const cleaned = cleanupInactiveUsers(allPresence, inactiveThreshold);
          const others = Object.values(cleaned).filter(
            (user) => user.sessionId !== sessionId
          );
          setActiveUsers(others);
        } catch (error) {
          console.error('Error handling presence update:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, sessionId, inactiveThreshold]);

  /**
   * Heartbeat: periodically update presence
   */
  useEffect(() => {
    if (!userEmail) return;

    // Initial update
    updatePresence();

    // Set up interval
    const interval = setInterval(updatePresence, heartbeatInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      removePresence();
    };
  }, [userEmail, heartbeatInterval, updatePresence, removePresence]);

  return {
    /** List of active users (excluding current session) */
    activeUsers,
    /** Manually trigger presence update */
    updatePresence,
    /** Remove current session from presence */
    removePresence,
  };
}
