import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnlockState, getUnlockState } from './useUnlockState';

// Use the default fallback password from the hook ('admin2025')

describe('useUnlockState', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should initialize with locked state', () => {
    const { result } = renderHook(() => useUnlockState());

    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.unlockedAt).toBeNull();
    expect(result.current.unlockedBy).toBeNull();
  });

  it('should unlock with correct password', () => {
    const { result } = renderHook(() => useUnlockState());

    act(() => {
      const success = result.current.unlock('admin2025', 'user@example.com');
      expect(success).toBe(true);
    });

    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.unlockedBy).toBe('user@example.com');
    expect(result.current.unlockedAt).toBeInstanceOf(Date);
  });

  it('should reject unlock with incorrect password', () => {
    const { result } = renderHook(() => useUnlockState());

    act(() => {
      const success = result.current.unlock('wrong-password', 'user@example.com');
      expect(success).toBe(false);
    });

    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.unlockedBy).toBeNull();
    expect(result.current.unlockedAt).toBeNull();
  });

  it('should lock when already unlocked', () => {
    const { result } = renderHook(() => useUnlockState());

    // First unlock
    act(() => {
      result.current.unlock('admin2025', 'user@example.com');
    });

    expect(result.current.isUnlocked).toBe(true);

    // Then lock
    act(() => {
      result.current.lock();
    });

    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.unlockedBy).toBeNull();
    expect(result.current.unlockedAt).toBeNull();
  });

  it('should persist unlock state to localStorage', () => {
    const { result } = renderHook(() => useUnlockState());

    act(() => {
      result.current.unlock('admin2025', 'user@example.com');
    });

    // Check localStorage
    const stored = localStorage.getItem('credit-castor-unlock-state');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.isUnlocked).toBe(true);
    expect(parsed.unlockedBy).toBe('user@example.com');
    expect(parsed.unlockedAt).toBeTruthy();
  });

  it('should load unlock state from localStorage on init', () => {
    // Manually set localStorage
    const testDate = new Date('2025-01-15T10:00:00Z');
    localStorage.setItem(
      'credit-castor-unlock-state',
      JSON.stringify({
        isUnlocked: true,
        unlockedBy: 'admin@example.com',
        unlockedAt: testDate.toISOString(),
      })
    );

    // Render hook
    const { result } = renderHook(() => useUnlockState());

    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.unlockedBy).toBe('admin@example.com');
    expect(result.current.unlockedAt).toEqual(testDate);
  });

  it('should handle corrupted localStorage gracefully', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('credit-castor-unlock-state', 'invalid-json{');

    const { result } = renderHook(() => useUnlockState());

    // Should fall back to locked state
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.unlockedAt).toBeNull();
    expect(result.current.unlockedBy).toBeNull();
  });

  it('should validate password without unlocking', () => {
    const { result } = renderHook(() => useUnlockState());

    expect(result.current.validatePassword('admin2025')).toBe(true);
    expect(result.current.validatePassword('wrong-password')).toBe(false);

    // Should not have unlocked
    expect(result.current.isUnlocked).toBe(false);
  });

  describe('getUnlockState', () => {
    it('should return current unlock state without hook', () => {
      // Set state in localStorage
      localStorage.setItem(
        'credit-castor-unlock-state',
        JSON.stringify({
          isUnlocked: true,
          unlockedBy: 'test@example.com',
          unlockedAt: new Date().toISOString(),
        })
      );

      const state = getUnlockState();
      expect(state.isUnlocked).toBe(true);
      expect(state.unlockedBy).toBe('test@example.com');
    });

    it('should return locked state if nothing in localStorage', () => {
      const state = getUnlockState();
      expect(state.isUnlocked).toBe(false);
      expect(state.unlockedAt).toBeNull();
      expect(state.unlockedBy).toBeNull();
    });
  });

  describe('clearUnlockState', () => {
    it('should clear unlock state from localStorage', () => {
      // Set state
      localStorage.setItem(
        'credit-castor-unlock-state',
        JSON.stringify({
          isUnlocked: true,
          unlockedBy: 'test@example.com',
          unlockedAt: new Date().toISOString(),
        })
      );

      // Clear
      clearUnlockState();

      // Check it's gone
      expect(localStorage.getItem('credit-castor-unlock-state')).toBeNull();
    });
  });

  it('should maintain state across multiple renders', () => {
    const { result, rerender } = renderHook(() => useUnlockState());

    act(() => {
      result.current.unlock('admin2025', 'user@example.com');
    });

    expect(result.current.isUnlocked).toBe(true);

    // Rerender
    rerender();

    // State should still be unlocked
    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.unlockedBy).toBe('user@example.com');
  });
});
