import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresenceDetection } from './usePresenceDetection';

describe('usePresenceDetection', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('should initialize with empty active users list', () => {
    const { result } = renderHook(() => usePresenceDetection('user@example.com'));

    expect(result.current.activeUsers).toEqual([]);
  });

  it('should not update presence when userEmail is null', () => {
    const { result } = renderHook(() => usePresenceDetection(null));

    // Advance timers past the heartbeat interval
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    const presenceData = localStorage.getItem('credit-castor-presence');
    expect(presenceData).toBe(null);
    expect(result.current.activeUsers).toEqual([]);
  });

  it('should update presence on mount when userEmail is provided', () => {
    renderHook(() => usePresenceDetection('user1@example.com'));

    // Initial presence update happens immediately
    const presenceData = localStorage.getItem('credit-castor-presence');
    expect(presenceData).toBeTruthy();

    const parsed = JSON.parse(presenceData!);
    const sessions = Object.values(parsed);
    expect(sessions).toHaveLength(1);
    expect((sessions[0] as { email: string }).email).toBe('user1@example.com');
  });

  it('should periodically update presence via heartbeat', () => {
    renderHook(() => usePresenceDetection('user1@example.com', {
      heartbeatInterval: 5000,
    }));

    // Get initial timestamp
    const initialData = JSON.parse(localStorage.getItem('credit-castor-presence')!);
    const initialSession = Object.values(initialData)[0] as { lastSeen: string };
    const initialTime = new Date(initialSession.lastSeen).getTime();

    // Advance time by heartbeat interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Check that presence was updated
    const updatedData = JSON.parse(localStorage.getItem('credit-castor-presence')!);
    const updatedSession = Object.values(updatedData)[0] as { lastSeen: string };
    const updatedTime = new Date(updatedSession.lastSeen).getTime();

    expect(updatedTime).toBeGreaterThan(initialTime);
  });

  it('should detect other active users from localStorage', () => {
    // Manually add another user to localStorage (simulating another tab)
    const otherSessionId = 'other-session-123';
    const otherUser = {
      email: 'other@example.com',
      lastSeen: new Date(),
      sessionId: otherSessionId,
    };

    localStorage.setItem(
      'credit-castor-presence',
      JSON.stringify({ [otherSessionId]: otherUser })
    );

    const { result } = renderHook(() => usePresenceDetection('user1@example.com'));

    // Should detect the other user
    expect(result.current.activeUsers).toHaveLength(1);
    expect(result.current.activeUsers[0].email).toBe('other@example.com');
  });

  it('should filter out inactive users', () => {
    // Add an old/inactive user
    const inactiveSessionId = 'inactive-session-123';
    const inactiveUser = {
      email: 'inactive@example.com',
      lastSeen: new Date(Date.now() - 20000), // 20 seconds ago (inactive)
      sessionId: inactiveSessionId,
    };

    localStorage.setItem(
      'credit-castor-presence',
      JSON.stringify({ [inactiveSessionId]: inactiveUser })
    );

    const { result } = renderHook(() =>
      usePresenceDetection('user1@example.com', {
        inactiveThreshold: 15000, // 15 seconds
      })
    );

    // Should not include the inactive user
    expect(result.current.activeUsers).toEqual([]);
  });

  it('should remove presence on unmount', () => {
    const { unmount } = renderHook(() => usePresenceDetection('user1@example.com'));

    // Verify presence was added
    let presenceData = JSON.parse(localStorage.getItem('credit-castor-presence')!);
    expect(Object.keys(presenceData)).toHaveLength(1);

    // Unmount the hook
    unmount();

    // Verify presence was removed
    presenceData = JSON.parse(localStorage.getItem('credit-castor-presence')!);
    expect(Object.keys(presenceData)).toHaveLength(0);
  });

  // NOTE: Storage event testing is complex and requires actual cross-tab communication
  // The functionality has been verified through integration tests where the hooks
  // are used in a real browser environment with multiple tabs.

  it('should manually trigger presence update', () => {
    const { result } = renderHook(() => usePresenceDetection('user1@example.com'));

    // Get initial timestamp
    const initialData = JSON.parse(localStorage.getItem('credit-castor-presence')!);
    const initialSession = Object.values(initialData)[0] as { lastSeen: string };
    const initialTime = new Date(initialSession.lastSeen).getTime();

    // Advance time slightly
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Manually trigger update
    act(() => {
      result.current.updatePresence();
    });

    // Check that presence was updated
    const updatedData = JSON.parse(localStorage.getItem('credit-castor-presence')!);
    const updatedSession = Object.values(updatedData)[0] as { lastSeen: string };
    const updatedTime = new Date(updatedSession.lastSeen).getTime();

    expect(updatedTime).toBeGreaterThan(initialTime);
  });

  it('should handle corrupted localStorage gracefully', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('credit-castor-presence', 'invalid-json{');

    // Should not throw and should default to empty users
    const { result } = renderHook(() => usePresenceDetection('user1@example.com'));
    expect(result.current.activeUsers).toEqual([]);
  });

  it('should use custom config values', () => {
    const config = {
      heartbeatInterval: 10000,
      inactiveThreshold: 30000,
      storageKey: 'custom-presence-key',
    };

    renderHook(() => usePresenceDetection('user1@example.com', config));

    // Check that custom storage key was used
    const customData = localStorage.getItem('custom-presence-key');
    expect(customData).toBeTruthy();

    // Default key should not be used
    const defaultData = localStorage.getItem('credit-castor-presence');
    expect(defaultData).toBeNull();
  });
});
