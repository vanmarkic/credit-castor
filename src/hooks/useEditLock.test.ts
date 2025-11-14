/**
 * useEditLock Hook Tests
 *
 * Tests for React hook that manages edit lock state with real-time sync
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditLock } from './useEditLock';

// Mock the edit lock service
vi.mock('../services/editLockService', () => ({
  acquireEditLock: vi.fn(),
  releaseEditLock: vi.fn(),
  extendLockExpiration: vi.fn(),
  checkLockStatus: vi.fn(),
  HEARTBEAT_INTERVAL_MS: 30000,
}));

// Mock firebase
vi.mock('../services/firebase', () => ({
  db: {},
  isFirebaseConfigured: () => true,
}));

// Mock Firestore onSnapshot
const mockUnsubscribe = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => mockUnsubscribe),
  Timestamp: class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    static now() {
      return new Timestamp(Date.now() / 1000, 0);
    }
    static fromDate(date: Date) {
      return new Timestamp(date.getTime() / 1000, 0);
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

describe('useEditLock', () => {
  const projectId = 'test-project-123';
  const userEmail = 'user@example.com';
  const sessionId = 'session-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with unlocked state', () => {
    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    expect(result.current.isLocked).toBe(false);
    expect(result.current.lockOwner).toBeNull();
    expect(result.current.isOwnLock).toBe(false);
  });

  it('should acquire lock successfully', async () => {
    const { acquireEditLock } = await import('../services/editLockService');
    (acquireEditLock as any).mockResolvedValue({
      success: true,
      lock: {
        userEmail,
        sessionId,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastHeartbeat: new Date(),
      },
    });

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    await act(async () => {
      const acquired = await result.current.acquireLock();
      expect(acquired).toBe(true);
    });

    expect(acquireEditLock).toHaveBeenCalledWith(projectId, userEmail, sessionId);
  });

  it('should fail to acquire lock when locked by another user', async () => {
    const { acquireEditLock } = await import('../services/editLockService');
    (acquireEditLock as any).mockResolvedValue({
      success: false,
      reason: 'locked',
      existingLock: {
        userEmail: 'other@example.com',
        sessionId: 'other-session',
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastHeartbeat: new Date(),
      },
    });

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    await act(async () => {
      const acquired = await result.current.acquireLock();
      expect(acquired).toBe(false);
    });
  });

  it('should release lock successfully', async () => {
    const { releaseEditLock } = await import('../services/editLockService');
    (releaseEditLock as any).mockResolvedValue(true);

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    await act(async () => {
      const released = await result.current.releaseLock();
      expect(released).toBe(true);
    });

    expect(releaseEditLock).toHaveBeenCalledWith(projectId, userEmail, sessionId);
  });

  it('should start heartbeat after acquiring lock', async () => {
    const { acquireEditLock, extendLockExpiration } = await import('../services/editLockService');
    (acquireEditLock as any).mockResolvedValue({
      success: true,
      lock: {
        userEmail,
        sessionId,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastHeartbeat: new Date(),
      },
    });
    (extendLockExpiration as any).mockResolvedValue(true);

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    await act(async () => {
      await result.current.acquireLock();
    });

    // Fast-forward 30 seconds to trigger heartbeat
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(extendLockExpiration).toHaveBeenCalledWith(projectId, userEmail, sessionId);
  });

  it('should stop heartbeat after releasing lock', async () => {
    const { acquireEditLock, releaseEditLock, extendLockExpiration } = await import('../services/editLockService');
    (acquireEditLock as any).mockResolvedValue({
      success: true,
      lock: {
        userEmail,
        sessionId,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastHeartbeat: new Date(),
      },
    });
    (releaseEditLock as any).mockResolvedValue(true);
    (extendLockExpiration as any).mockResolvedValue(true);

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    await act(async () => {
      await result.current.acquireLock();
    });

    // Release lock
    await act(async () => {
      await result.current.releaseLock();
    });

    // Clear previous calls
    (extendLockExpiration as any).mockClear();

    // Fast-forward 30 seconds - heartbeat should NOT be called
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(extendLockExpiration).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', async () => {
    // Use real timers for this test to avoid issues with cleanup
    vi.useRealTimers();

    const { onSnapshot } = await import('firebase/firestore');
    const { acquireEditLock, releaseEditLock } = await import('../services/editLockService');

    let snapshotCallback: any;
    (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return mockUnsubscribe;
    });

    (acquireEditLock as any).mockResolvedValue({
      success: true,
      lock: {
        userEmail,
        sessionId,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastHeartbeat: new Date(),
      },
    });
    (releaseEditLock as any).mockResolvedValue(true);

    const { result, unmount } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    // Wait for subscription to be set up
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await act(async () => {
      await result.current.acquireLock();
    });

    // Simulate onSnapshot callback to update lock state
    await act(async () => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          userEmail,
          sessionId,
          acquiredAt: { toDate: () => new Date() },
          expiresAt: { toDate: () => new Date(Date.now() + 5 * 60 * 1000) },
          lastHeartbeat: { toDate: () => new Date() },
        }),
      });
    });

    // Wait for the isOwnLockRef to be updated
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    unmount();

    // Should have released lock and unsubscribed
    expect(releaseEditLock).toHaveBeenCalledWith(projectId, userEmail, sessionId);
    expect(mockUnsubscribe).toHaveBeenCalled();

    // Restore fake timers for other tests
    vi.useFakeTimers();
  });

  it('should handle real-time lock updates', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    const { onSnapshot } = await import('firebase/firestore');
    let snapshotCallback: any;

    (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    // Wait for subscription to be set up
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Simulate lock acquired by another user
    await act(async () => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          userEmail: 'other@example.com',
          sessionId: 'other-session',
          acquiredAt: { toDate: () => new Date() },
          expiresAt: { toDate: () => new Date(Date.now() + 5 * 60 * 1000) },
          lastHeartbeat: { toDate: () => new Date() },
        }),
      });
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockOwner).toBe('other@example.com');
    expect(result.current.isOwnLock).toBe(false);

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('should detect own lock from real-time updates', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    const { onSnapshot } = await import('firebase/firestore');
    let snapshotCallback: any;

    (onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId));

    // Wait for subscription to be set up
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Simulate lock acquired by current user
    await act(async () => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          userEmail,
          sessionId,
          acquiredAt: { toDate: () => new Date() },
          expiresAt: { toDate: () => new Date(Date.now() + 5 * 60 * 1000) },
          lastHeartbeat: { toDate: () => new Date() },
        }),
      });
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockOwner).toBe(userEmail);
    expect(result.current.isOwnLock).toBe(true);

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('should handle notification callback', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    const { acquireEditLock } = await import('../services/editLockService');
    const onNotification = vi.fn();

    (acquireEditLock as any).mockResolvedValue({
      success: false,
      reason: 'locked',
      existingLock: {
        userEmail: 'other@example.com',
        sessionId: 'other-session',
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastHeartbeat: new Date(),
      },
    });

    const { result } = renderHook(() => useEditLock(projectId, userEmail, sessionId, onNotification));

    await act(async () => {
      await result.current.acquireLock();
    });

    expect(onNotification).toHaveBeenCalledWith({
      type: 'lock-denied',
      message: expect.stringContaining('other@example.com'),
      lockOwner: 'other@example.com',
    });

    // Restore fake timers
    vi.useFakeTimers();
  });
});
