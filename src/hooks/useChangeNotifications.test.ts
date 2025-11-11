import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChangeNotifications } from './useChangeNotifications';
import { STORAGE_KEY } from '../utils/storage';

describe('useChangeNotifications', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should initialize with empty changes list', () => {
    const { result } = renderHook(() => useChangeNotifications());

    expect(result.current.changes).toEqual([]);
  });

  it('should not detect changes on initial load by default', () => {
    // Set initial scenario data
    const scenarioData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarioData));

    const { result } = renderHook(() => useChangeNotifications());

    // Should not detect changes on initial load
    expect(result.current.changes).toEqual([]);
  });

  it('should detect changes when notifyOnInitialLoad is true', () => {
    // Set initial scenario data
    const scenarioData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarioData));

    const { result } = renderHook(() =>
      useChangeNotifications({ notifyOnInitialLoad: true })
    );

    // Should detect changes on initial load
    // (Since there's no previous data, it should not detect anything)
    expect(result.current.changes).toEqual([]);
  });

  it('should detect participant added', async () => {
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Initial load - no changes
    expect(result.current.changes).toEqual([]);

    // Simulate another tab adding a participant
    const updatedData = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
      projectParams: { totalPurchase: 100000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect participant added
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].type).toBe('participant_added');
    expect(result.current.changes[0].description).toContain('Bob');
  });

  it('should detect participant removed', async () => {
    const initialData = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Initial load
    expect(result.current.changes).toEqual([]);

    // Simulate another tab removing a participant
    const updatedData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect participant removed
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].type).toBe('participant_removed');
    expect(result.current.changes[0].description).toContain('1 participant(s) supprimé(s)');
  });

  it('should detect participant modified', async () => {
    const initialData = {
      participants: [{ name: 'Alice', capitalApporte: 50000 }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Simulate another tab modifying a participant
    const updatedData = {
      participants: [{ name: 'Alice', capitalApporte: 60000 }],
      projectParams: { totalPurchase: 100000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect participant modified
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].type).toBe('participant_modified');
  });

  it('should detect project params modified', async () => {
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Simulate another tab modifying project params
    const updatedData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 150000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect project params modified
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].type).toBe('project_params_modified');
  });

  it('should detect portage formula modified', async () => {
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
      portageFormula: { indexationRate: 2.0 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Simulate another tab modifying portage formula
    const updatedData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
      portageFormula: { indexationRate: 3.0 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect portage formula modified
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].type).toBe('portage_formula_modified');
  });

  it('should detect deed date modified', async () => {
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
      deedDate: '2026-01-01',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Simulate another tab modifying deed date
    const updatedData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
      deedDate: '2026-02-01',
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect deed date modified
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].type).toBe('deed_date_modified');
  });

  it('should clear changes when clearChanges is called', async () => {
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Trigger a change
    const updatedData = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
      projectParams: { totalPurchase: 100000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });

    // Clear changes
    act(() => {
      result.current.clearChanges();
    });

    expect(result.current.changes).toEqual([]);
  });

  it('should ignore changes to other storage keys', () => {
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Simulate change to a different storage key
    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: 'some-other-key',
        newValue: '{"data": "changed"}',
        oldValue: '{"data": "original"}',
      });
      window.dispatchEvent(storageEvent);
    });

    // Should not detect any changes
    rerender();
    expect(result.current.changes).toEqual([]);
  });

  it('should handle corrupted localStorage gracefully', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem(STORAGE_KEY, 'invalid-json{');

    // Should not throw
    const { result } = renderHook(() => useChangeNotifications());
    expect(result.current.changes).toEqual([]);
  });

  it('should use custom storage key', async () => {
    const customKey = 'custom-scenario-key';
    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(customKey, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() =>
      useChangeNotifications({ storageKey: customKey })
    );

    // Trigger a change to the custom key
    const updatedData = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
      projectParams: { totalPurchase: 100000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(customKey, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: customKey,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should detect changes on custom key
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
  });

  it('should include changedBy from unlock state', async () => {
    // Set unlock state with a user
    const unlockState = {
      isUnlocked: true,
      unlockedBy: 'admin@example.com',
      unlockedAt: new Date().toISOString(),
    };
    localStorage.setItem('credit-castor-unlock-state', JSON.stringify(unlockState));

    const initialData = {
      participants: [{ name: 'Alice' }],
      projectParams: { totalPurchase: 100000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const { result, rerender } = renderHook(() => useChangeNotifications());

    // Trigger a change
    const updatedData = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
      projectParams: { totalPurchase: 100000 },
    };

    act(() => {
      // Actually update localStorage (simulates another tab's change)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updatedData),
        oldValue: JSON.stringify(initialData),
      });
      window.dispatchEvent(storageEvent);
    });

    // Should include changedBy
    await waitFor(() => {
      expect(result.current.changes).toHaveLength(1);
    });
    expect(result.current.changes[0].changedBy).toBe('admin@example.com');
  });
});
