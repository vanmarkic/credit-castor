import { describe, it, expect } from 'vitest';
import {
  isCollectiveField,
  isIndividualField,
  isFieldEditable,
  getLockReason,
  getParticipantFieldPath,
  getProjectParamFieldPath,
  getPortageFormulaFieldPath,
} from './fieldPermissions';

describe('fieldPermissions', () => {
  describe('isCollectiveField', () => {
    it('should identify project params as collective', () => {
      expect(isCollectiveField('projectParams')).toBe(true);
      expect(isCollectiveField('projectParams.totalPurchase')).toBe(true);
      expect(isCollectiveField('projectParams.globalCascoPerM2')).toBe(true);
      expect(isCollectiveField('projectParams.fraisGeneraux3ans')).toBe(true);
    });

    it('should identify portage formula as collective', () => {
      expect(isCollectiveField('portageFormula')).toBe(true);
      expect(isCollectiveField('portageFormula.indexationRate')).toBe(true);
      expect(isCollectiveField('portageFormula.carryingCostRecovery')).toBe(true);
    });

    it('should identify deedDate as collective', () => {
      expect(isCollectiveField('deedDate')).toBe(true);
    });

    it('should identify participant financing terms as collective', () => {
      expect(isCollectiveField('participants.0.interestRate')).toBe(true);
      expect(isCollectiveField('participants.1.durationYears')).toBe(true);
      expect(isCollectiveField('participants.2.registrationFeesRate')).toBe(true);
      expect(isCollectiveField('participants.5.interestRate')).toBe(true);
    });

    it('should identify two-loan fields as collective', () => {
      expect(isCollectiveField('participants.0.useTwoLoans')).toBe(true);
      expect(isCollectiveField('participants.0.loan2DelayYears')).toBe(true);
      expect(isCollectiveField('participants.0.loan2RenovationAmount')).toBe(true);
    });

    it('should identify timeline fields as collective', () => {
      expect(isCollectiveField('participants.0.isFounder')).toBe(true);
      expect(isCollectiveField('participants.0.entryDate')).toBe(true);
      expect(isCollectiveField('participants.0.exitDate')).toBe(true);
    });

    it('should not identify individual fields as collective', () => {
      expect(isCollectiveField('participants.0.capitalApporte')).toBe(false);
      expect(isCollectiveField('participants.0.name')).toBe(false);
      expect(isCollectiveField('participants.0.surface')).toBe(false);
    });
  });

  describe('isIndividualField', () => {
    it('should identify capitalApporte as individual', () => {
      expect(isIndividualField('participants.0.capitalApporte')).toBe(true);
      expect(isIndividualField('participants.1.capitalApporte')).toBe(true);
      expect(isIndividualField('participants.10.capitalApporte')).toBe(true);
    });

    it('should identify personal information as individual', () => {
      expect(isIndividualField('participants.0.name')).toBe(true);
      expect(isIndividualField('participants.0.surface')).toBe(true);
      expect(isIndividualField('participants.0.quantity')).toBe(true);
      expect(isIndividualField('participants.0.unitId')).toBe(true);
    });

    it('should identify lot ownership as individual', () => {
      expect(isIndividualField('participants.0.lotsOwned')).toBe(true);
      expect(isIndividualField('participants.0.lotsOwned.0')).toBe(true);
      expect(isIndividualField('participants.0.lotsOwned.1')).toBe(true);
    });

    it('should identify purchase details as individual', () => {
      expect(isIndividualField('participants.0.purchaseDetails')).toBe(true);
      expect(isIndividualField('participants.0.purchaseDetails.lotId')).toBe(true);
    });

    it('should identify construction cost overrides as individual', () => {
      expect(isIndividualField('participants.0.parachevementsPerM2')).toBe(true);
      expect(isIndividualField('participants.0.cascoSqm')).toBe(true);
      expect(isIndividualField('participants.0.parachevementsSqm')).toBe(true);
    });

    it('should identify two-loan capital allocation as individual', () => {
      expect(isIndividualField('participants.0.capitalForLoan1')).toBe(true);
      expect(isIndividualField('participants.0.capitalForLoan2')).toBe(true);
    });

    it('should not identify collective fields as individual', () => {
      expect(isIndividualField('projectParams.totalPurchase')).toBe(false);
      expect(isIndividualField('portageFormula.indexationRate')).toBe(false);
      expect(isIndividualField('participants.0.interestRate')).toBe(false);
    });
  });

  describe('isFieldEditable', () => {
    it('should allow editing individual fields regardless of unlock state', () => {
      expect(isFieldEditable('participants.0.capitalApporte', false)).toBe(true);
      expect(isFieldEditable('participants.0.capitalApporte', true)).toBe(true);
      expect(isFieldEditable('participants.0.name', false)).toBe(true);
      expect(isFieldEditable('participants.0.name', true)).toBe(true);
    });

    it('should block collective fields when locked', () => {
      expect(isFieldEditable('projectParams.totalPurchase', false)).toBe(false);
      expect(isFieldEditable('portageFormula.indexationRate', false)).toBe(false);
      expect(isFieldEditable('participants.0.interestRate', false)).toBe(false);
    });

    it('should allow collective fields when unlocked', () => {
      expect(isFieldEditable('projectParams.totalPurchase', true)).toBe(true);
      expect(isFieldEditable('portageFormula.indexationRate', true)).toBe(true);
      expect(isFieldEditable('participants.0.interestRate', true)).toBe(true);
    });

    it('should default to editable for unknown fields (fail open)', () => {
      expect(isFieldEditable('unknownField', false)).toBe(true);
      expect(isFieldEditable('someRandomPath', false)).toBe(true);
    });
  });

  describe('getLockReason', () => {
    it('should return null for editable fields', () => {
      expect(getLockReason('participants.0.capitalApporte', false)).toBeNull();
      expect(getLockReason('projectParams.totalPurchase', true)).toBeNull();
    });

    it('should return French lock reason for locked collective fields', () => {
      const reason = getLockReason('projectParams.totalPurchase', false);
      expect(reason).toBeTruthy();
      expect(reason).toContain('verrouillé');
      expect(reason).toContain('administrateur');
    });
  });

  describe('path helper functions', () => {
    it('should build participant field paths', () => {
      expect(getParticipantFieldPath('capitalApporte', 0)).toBe('participants.0.capitalApporte');
      expect(getParticipantFieldPath('interestRate', 5)).toBe('participants.5.interestRate');
      expect(getParticipantFieldPath('name', 10)).toBe('participants.10.name');
    });

    it('should build project param field paths', () => {
      expect(getProjectParamFieldPath('totalPurchase')).toBe('projectParams.totalPurchase');
      expect(getProjectParamFieldPath('globalCascoPerM2')).toBe('projectParams.globalCascoPerM2');
    });

    it('should build portage formula field paths', () => {
      expect(getPortageFormulaFieldPath('indexationRate')).toBe('portageFormula.indexationRate');
      expect(getPortageFormulaFieldPath('carryingCostRecovery')).toBe('portageFormula.carryingCostRecovery');
    });
  });
});
