/**
 * Edit Lock Service Tests
 *
 * Tests for Firestore-based collaborative editing lock coordination
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  acquireEditLock,
  releaseEditLock,
  checkLockStatus,
  extendLockExpiration,
  forceReleaseLock
} from './editLockService';
import { Timestamp } from 'firebase/firestore';

// In-memory lock storage for testing
const mockLockStore: Map<string, any> = new Map();

// Transaction lock to serialize concurrent access
let transactionLock: Promise<any> = Promise.resolve();

// Mock Firestore
vi.mock('./firebase', () => ({
  db: {},
  isFirebaseConfigured: () => true,
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal() as any;

  return {
    ...actual,
    doc: vi.fn((db, collection, docId) => ({ collection, docId })),
    getDoc: vi.fn(async (ref) => {
      const data = mockLockStore.get(ref.docId);
      return {
        exists: () => !!data,
        data: () => data,
      };
    }),
    setDoc: vi.fn(async (ref, data) => {
      mockLockStore.set(ref.docId, data);
    }),
    deleteDoc: vi.fn(async (ref) => {
      mockLockStore.delete(ref.docId);
    }),
    runTransaction: vi.fn(async (db, updateFunction) => {
      // Serialize transactions to prevent race conditions
      const currentLock = transactionLock;
      let resolveLock: () => void;
      transactionLock = new Promise<void>(resolve => {
        resolveLock = resolve;
      });

      await currentLock;

      try {
        // Simple transaction mock - read current state, run update function, commit
        const transaction = {
          get: vi.fn(async (ref) => {
            const data = mockLockStore.get(ref.docId);
            return {
              exists: () => !!data,
              data: () => data,
            };
          }),
          set: vi.fn((ref, data) => {
            mockLockStore.set(ref.docId, data);
          }),
          update: vi.fn((ref, data) => {
            const existing = mockLockStore.get(ref.docId) || {};
            mockLockStore.set(ref.docId, { ...existing, ...data });
          }),
          delete: vi.fn((ref) => {
            mockLockStore.delete(ref.docId);
          }),
        };

        return await updateFunction(transaction);
      } finally {
        resolveLock!();
      }
    }),
    serverTimestamp: () => Timestamp.now(),
    Timestamp: actual.Timestamp,
  };
});

describe('editLockService', () => {
  const projectId = 'test-project-123';
  const userEmail = 'user1@example.com';
  const sessionId = 'session-abc-123';
  const adminPassword = 'admin2025';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLockStore.clear();
    transactionLock = Promise.resolve();
  });

  afterEach(() => {
    mockLockStore.clear();
    transactionLock = Promise.resolve();
  });

  describe('acquireEditLock', () => {
    it('should successfully acquire lock when no lock exists', async () => {
      const result = await acquireEditLock(projectId, userEmail, sessionId);

      expect(result.success).toBe(true);
      expect(result.lock).toBeDefined();
      expect(result.lock?.userEmail).toBe(userEmail);
      expect(result.lock?.sessionId).toBe(sessionId);
      expect(result.lock?.expiresAt).toBeDefined();
    });

    it('should fail to acquire lock when active lock exists', async () => {
      // First user acquires lock
      await acquireEditLock(projectId, 'user1@example.com', 'session-1');

      // Second user tries to acquire
      const result = await acquireEditLock(projectId, 'user2@example.com', 'session-2');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('locked');
      expect(result.existingLock).toBeDefined();
      expect(result.existingLock?.userEmail).toBe('user1@example.com');
    });

    it('should auto-acquire expired lock', async () => {
      // Create a lock that is already expired
      const expiredTime = new Date(Date.now() - 6 * 60 * 1000);
      const lockDoc = {
        userEmail: 'user1@example.com',
        sessionId: 'session-1',
        acquiredAt: Timestamp.fromDate(expiredTime),
        expiresAt: Timestamp.fromDate(expiredTime),
        lastHeartbeat: Timestamp.fromDate(expiredTime),
      };

      // Manually set expired lock in mock store
      mockLockStore.set(projectId, lockDoc);

      // New user should be able to acquire
      const result = await acquireEditLock(projectId, 'user2@example.com', 'session-2');

      expect(result.success).toBe(true);
      expect(result.lock?.userEmail).toBe('user2@example.com');
    });

    it('should handle race condition - only one user acquires lock', async () => {
      // Simulate two users trying to acquire simultaneously
      const promises = [
        acquireEditLock(projectId, 'user1@example.com', 'session-1'),
        acquireEditLock(projectId, 'user2@example.com', 'session-2'),
      ];

      const results = await Promise.all(promises);

      // Only one should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(1);

      // One should be rejected
      const failureCount = results.filter(r => !r.success).length;
      expect(failureCount).toBe(1);
    });

    it('should allow same user/session to re-acquire their own lock', async () => {
      // First acquisition
      const result1 = await acquireEditLock(projectId, userEmail, sessionId);
      expect(result1.success).toBe(true);

      // Same user/session tries again
      const result2 = await acquireEditLock(projectId, userEmail, sessionId);
      expect(result2.success).toBe(true);
      expect(result2.lock?.sessionId).toBe(sessionId);
    });
  });

  describe('releaseEditLock', () => {
    it('should successfully release own lock', async () => {
      // Acquire lock
      await acquireEditLock(projectId, userEmail, sessionId);

      // Release lock
      const released = await releaseEditLock(projectId, userEmail, sessionId);
      expect(released).toBe(true);

      // Verify lock is released - another user can acquire
      const result = await acquireEditLock(projectId, 'user2@example.com', 'session-2');
      expect(result.success).toBe(true);
    });

    it('should not release lock owned by different user', async () => {
      // User 1 acquires lock
      await acquireEditLock(projectId, 'user1@example.com', 'session-1');

      // User 2 tries to release
      const released = await releaseEditLock(projectId, 'user2@example.com', 'session-2');
      expect(released).toBe(false);

      // Verify lock still exists
      const status = await checkLockStatus(projectId);
      expect(status.isLocked).toBe(true);
      expect(status.lock?.userEmail).toBe('user1@example.com');
    });

    it('should handle releasing non-existent lock gracefully', async () => {
      const released = await releaseEditLock(projectId, userEmail, sessionId);
      expect(released).toBe(false);
    });
  });

  describe('checkLockStatus', () => {
    it('should return unlocked status when no lock exists', async () => {
      const status = await checkLockStatus(projectId);

      expect(status.isLocked).toBe(false);
      expect(status.lock).toBeNull();
    });

    it('should return lock details when lock exists', async () => {
      // Acquire lock
      await acquireEditLock(projectId, userEmail, sessionId);

      // Check status
      const status = await checkLockStatus(projectId);

      expect(status.isLocked).toBe(true);
      expect(status.lock).toBeDefined();
      expect(status.lock?.userEmail).toBe(userEmail);
      expect(status.lock?.sessionId).toBe(sessionId);
    });

    it('should indicate expired lock', async () => {
      // Create a lock that is already expired
      const expiredTime = new Date(Date.now() - 6 * 60 * 1000);
      const lockDoc = {
        userEmail,
        sessionId,
        acquiredAt: Timestamp.fromDate(expiredTime),
        expiresAt: Timestamp.fromDate(expiredTime),
        lastHeartbeat: Timestamp.fromDate(expiredTime),
      };

      // Manually set expired lock in mock store
      mockLockStore.set(projectId, lockDoc);

      const status = await checkLockStatus(projectId);

      // Expired lock should be treated as unlocked
      expect(status.isLocked).toBe(false);
      expect(status.isExpired).toBe(true);
    });
  });

  describe('extendLockExpiration', () => {
    it('should extend expiration for valid lock owner', async () => {
      // Acquire lock
      const acquisition = await acquireEditLock(projectId, userEmail, sessionId);
      const originalExpiration = acquisition.lock?.expiresAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Extend expiration
      const extended = await extendLockExpiration(projectId, userEmail, sessionId);
      expect(extended).toBe(true);

      // Verify new expiration is later
      const status = await checkLockStatus(projectId);
      if (originalExpiration && status.lock?.expiresAt) {
        expect(status.lock.expiresAt.getTime()).toBeGreaterThan(originalExpiration.getTime());
      }
    });

    it('should not extend for non-owner', async () => {
      // User 1 acquires lock
      await acquireEditLock(projectId, 'user1@example.com', 'session-1');

      // User 2 tries to extend
      const extended = await extendLockExpiration(projectId, 'user2@example.com', 'session-2');
      expect(extended).toBe(false);
    });

    it('should not extend non-existent lock', async () => {
      const extended = await extendLockExpiration(projectId, userEmail, sessionId);
      expect(extended).toBe(false);
    });
  });

  describe('forceReleaseLock', () => {
    it('should force release lock with correct admin password', async () => {
      // User acquires lock
      await acquireEditLock(projectId, userEmail, sessionId);

      // Admin forces release
      const result = await forceReleaseLock(projectId, adminPassword);
      expect(result.success).toBe(true);

      // Verify lock is released
      const status = await checkLockStatus(projectId);
      expect(status.isLocked).toBe(false);
    });

    it('should reject force release with incorrect password', async () => {
      // User acquires lock
      await acquireEditLock(projectId, userEmail, sessionId);

      // Try to force release with wrong password
      const result = await forceReleaseLock(projectId, 'wrong-password');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid-password');

      // Verify lock still exists
      const status = await checkLockStatus(projectId);
      expect(status.isLocked).toBe(true);
    });

    it('should handle force release when no lock exists', async () => {
      const result = await forceReleaseLock(projectId, adminPassword);
      expect(result.success).toBe(true); // No-op, but not an error
    });
  });

  describe('Lock expiration timing', () => {
    it('should set expiration to 5 minutes in the future', async () => {
      const before = Date.now();
      const result = await acquireEditLock(projectId, userEmail, sessionId);
      const after = Date.now();

      expect(result.lock?.expiresAt).toBeDefined();

      const expiresAt = result.lock!.expiresAt.getTime();
      const expectedMin = before + 5 * 60 * 1000;
      const expectedMax = after + 5 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin - 1000); // Allow 1s tolerance
      expect(expiresAt).toBeLessThanOrEqual(expectedMax + 1000);
    });
  });

  describe('Heartbeat mechanism', () => {
    it('should support periodic extension via extendLockExpiration', async () => {
      // Acquire lock
      await acquireEditLock(projectId, userEmail, sessionId);

      // Simulate heartbeat every 30 seconds
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const extended = await extendLockExpiration(projectId, userEmail, sessionId);
        expect(extended).toBe(true);
      }

      // Lock should still be valid
      const status = await checkLockStatus(projectId);
      expect(status.isLocked).toBe(true);
    });
  });
});
