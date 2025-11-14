/**
 * Tests for subcollection migration utility
 *
 * Tests migration from legacy array architecture to subcollection architecture.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  migrateToSubcollections,
  isAlreadyMigrated,
  validateMigration,
  type MigrationResult,
} from './subcollectionMigration';
import type { Participant } from '../utils/calculatorUtils';

// Mock Firebase
vi.mock('./firebase', () => ({
  getDb: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}));

import { getDb } from './firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';

describe('subcollectionMigration', () => {
  const mockDb = { type: 'firestore' };
  const mockProjectId = 'test-project';
  const mockUserEmail = 'test@example.com';

  const mockParticipants: Participant[] = [
    {
      id: '0',
      name: 'Alice',
      surface: 100,
      capitalApporte: 50000,
      isFounder: true,
      enabled: true,
      lotsOwned: [],
    },
    {
      id: '1',
      name: 'Bob',
      surface: 150,
      capitalApporte: 75000,
      isFounder: true,
      enabled: true,
      lotsOwned: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAlreadyMigrated', () => {
    it('should return true if participantsInSubcollection flag is set', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);
      vi.mocked(doc).mockReturnValue({ type: 'documentRef' } as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ participantsInSubcollection: true }),
      } as any);

      const result = await isAlreadyMigrated(mockProjectId);

      expect(result).toBe(true);
    });

    it('should return false if participantsInSubcollection flag is not set', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);
      vi.mocked(doc).mockReturnValue({ type: 'documentRef' } as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ participantsInSubcollection: false }),
      } as any);

      const result = await isAlreadyMigrated(mockProjectId);

      expect(result).toBe(false);
    });

    it('should return false if project does not exist', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);
      vi.mocked(doc).mockReturnValue({ type: 'documentRef' } as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await isAlreadyMigrated(mockProjectId);

      expect(result).toBe(false);
    });

    it('should return false if Firebase is not configured', async () => {
      vi.mocked(getDb).mockReturnValue(null);

      const result = await isAlreadyMigrated(mockProjectId);

      expect(result).toBe(false);
    });
  });

  describe('migrateToSubcollections', () => {
    it('should successfully migrate participants to subcollection', async () => {
      // Setup mocks
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      // Mock isAlreadyMigrated = false
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ participantsInSubcollection: false }),
      } as any);

      // Mock loading participants
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participants: mockParticipants,
          participantsInSubcollection: false,
        }),
      } as any);

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      // Run migration
      const result = await migrateToSubcollections(mockProjectId, mockUserEmail);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);
      expect(result.alreadyMigrated).toBe(false);

      // Verify batch operations
      expect(mockBatch.set).toHaveBeenCalledTimes(3); // 2 participants + 1 main document
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should skip migration if already migrated', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      // Mock isAlreadyMigrated = true
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ participantsInSubcollection: true }),
      } as any);

      const result = await migrateToSubcollections(mockProjectId, mockUserEmail);

      expect(result.success).toBe(true);
      expect(result.alreadyMigrated).toBe(true);
      expect(result.migratedCount).toBe(0);
      expect(writeBatch).not.toHaveBeenCalled();
    });

    it('should fail if Firebase is not configured', async () => {
      vi.mocked(getDb).mockReturnValue(null);

      const result = await migrateToSubcollections(mockProjectId, mockUserEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase not configured');
    });

    it('should fail if project document does not exist', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      // Mock isAlreadyMigrated = false
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ participantsInSubcollection: false }),
      } as any);

      // Mock project not found
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await migrateToSubcollections(mockProjectId, mockUserEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project document does not exist');
    });

    it('should fail if no participants array found', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      // Mock isAlreadyMigrated = false
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ participantsInSubcollection: false }),
      } as any);

      // Mock project with no participants
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participantsInSubcollection: false,
          // No participants array
        }),
      } as any);

      const result = await migrateToSubcollections(mockProjectId, mockUserEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No participants array found in project document');
    });

    it('should preserve all participant fields during migration', async () => {
      const participantWithAllFields: Participant = {
        id: '0',
        name: 'Charlie',
        surface: 200,
        capitalApporte: 100000,
        isFounder: false,
        enabled: true,
        lotsOwned: [{ lotId: 'lot1', purchaseDate: '2024-01-01' }],
        entryDate: '2024-01-15',
        exitDate: '2025-01-15',
        unitId: 'duplex',
        cascoPerM2: 1200,
        parachevementsPerM2: 400,
        cascoSqm: 180,
        parachevementsSqm: 180,
        purchaseDetails: {
          terrainCost: 50000,
          notaryFees: 5000,
        },
      };

      vi.mocked(getDb).mockReturnValue(mockDb as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ participantsInSubcollection: false }),
      } as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participants: [participantWithAllFields],
          participantsInSubcollection: false,
        }),
      } as any);

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      await migrateToSubcollections(mockProjectId, mockUserEmail);

      // Verify all fields preserved
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Charlie',
          surface: 200,
          capitalApporte: 100000,
          isFounder: false,
          enabled: true,
          lotsOwned: [{ lotId: 'lot1', purchaseDate: '2024-01-01' }],
          entryDate: '2024-01-15',
          exitDate: '2025-01-15',
          unitId: 'duplex',
          cascoPerM2: 1200,
          parachevementsPerM2: 400,
          cascoSqm: 180,
          parachevementsSqm: 180,
          purchaseDetails: {
            terrainCost: 50000,
            notaryFees: 5000,
          },
          version: 1,
          displayOrder: 0,
        })
      );
    });

    it('should handle participants without enabled field', async () => {
      const participantWithoutEnabled = {
        id: '0',
        name: 'Dave',
        surface: 100,
        capitalApporte: 50000,
        isFounder: true,
        lotsOwned: [],
        // No enabled field
      } as Participant;

      vi.mocked(getDb).mockReturnValue(mockDb as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ participantsInSubcollection: false }),
      } as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participants: [participantWithoutEnabled],
          participantsInSubcollection: false,
        }),
      } as any);

      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);

      await migrateToSubcollections(mockProjectId, mockUserEmail);

      // Verify enabled defaults to true
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });

  describe('validateMigration', () => {
    it('should validate successful migration', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      // Mock main document
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participantsInSubcollection: true,
          participants: [],
        }),
      } as any);

      // Mock participant documents
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Test' }),
      } as any);

      const result = await validateMigration(mockProjectId, 2);

      expect(result.valid).toBe(true);
      expect(result.actualCount).toBe(2);
    });

    it('should fail validation if flag not set', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participantsInSubcollection: false,
          participants: [],
        }),
      } as any);

      const result = await validateMigration(mockProjectId, 2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('participantsInSubcollection flag not set');
    });

    it('should fail validation if participants array not cleared', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participantsInSubcollection: true,
          participants: mockParticipants, // Not cleared!
        }),
      } as any);

      const result = await validateMigration(mockProjectId, 2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('participants array not cleared');
    });

    it('should fail validation if participant count mismatch', async () => {
      vi.mocked(getDb).mockReturnValue(mockDb as any);

      // Mock main document
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participantsInSubcollection: true,
          participants: [],
        }),
      } as any);

      // Mock only 1 participant exists (expecting 2)
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'Test' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => false, // Second participant missing
        } as any);

      const result = await validateMigration(mockProjectId, 2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Expected 2 participants, found 1');
      expect(result.actualCount).toBe(1);
    });
  });
});
