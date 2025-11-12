import { useRef, useCallback } from 'react';
import type { TrackableField, FieldChangeTracker } from '../services/firestoreSync';

/**
 * Hook for tracking which fields have changed since last save
 *
 * Enables granular Firestore updates by tracking dirty state
 * per field instead of saving entire document.
 */
export function useDirtyTracking() {
  const trackerRef = useRef<FieldChangeTracker>({
    changedFields: new Set(),
    lastSaveTimestamp: Date.now(),
  });

  /**
   * Mark a field as dirty (changed)
   */
  const markDirty = useCallback((field: TrackableField) => {
    trackerRef.current.changedFields.add(field);
  }, []);

  /**
   * Mark multiple fields as dirty
   */
  const markMultipleDirty = useCallback((fields: TrackableField[]) => {
    fields.forEach(field => trackerRef.current.changedFields.add(field));
  }, []);

  /**
   * Clear all dirty flags (after successful save)
   */
  const clearDirty = useCallback(() => {
    trackerRef.current.changedFields.clear();
    trackerRef.current.lastSaveTimestamp = Date.now();
  }, []);

  /**
   * Get currently dirty fields
   */
  const getDirtyFields = useCallback((): TrackableField[] => {
    return Array.from(trackerRef.current.changedFields);
  }, []);

  /**
   * Check if any fields are dirty
   */
  const isDirty = useCallback((): boolean => {
    return trackerRef.current.changedFields.size > 0;
  }, []);

  /**
   * Check if specific field is dirty
   */
  const isFieldDirty = useCallback((field: TrackableField): boolean => {
    return trackerRef.current.changedFields.has(field);
  }, []);

  return {
    markDirty,
    markMultipleDirty,
    clearDirty,
    getDirtyFields,
    isDirty,
    isFieldDirty,
  };
}
