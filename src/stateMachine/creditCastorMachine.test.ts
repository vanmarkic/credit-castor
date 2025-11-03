import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { creditCastorMachine } from './creditCastorMachine';

describe('Credit Castor Machine', () => {
  it('should start in pre_purchase state', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    expect(actor.getSnapshot().matches('pre_purchase')).toBe(true);
  });

  it('should transition to compromis_period on COMPROMIS_SIGNED', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    expect(actor.getSnapshot().matches('compromis_period')).toBe(true);
  });
});

describe('Legal Milestone Flow', () => {
  it('should transition through deed registration', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to ready_for_deed
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date(), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });

    expect(actor.getSnapshot().matches('ready_for_deed')).toBe(true);

    // Sign deed
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date(), notaryId: 'notary1' });
    expect(actor.getSnapshot().matches('deed_registration_pending')).toBe(true);

    // Register deed
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date() });
    expect(actor.getSnapshot().matches('ownership_transferred')).toBe(true);
  });
});

describe('Copropriété Creation Flow', () => {
  it('should transition through complete copropriété creation process', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to ownership_transferred
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date('2023-01-01'), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date('2023-05-01'), notaryId: 'notary1' });
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date('2023-05-10') });

    expect(actor.getSnapshot().matches('ownership_transferred')).toBe(true);

    // Start copropriété creation
    actor.send({ type: 'START_COPRO_CREATION' });
    expect(actor.getSnapshot().matches({ copro_creation: 'awaiting_technical_report' })).toBe(true);

    // Technical report ready
    actor.send({ type: 'TECHNICAL_REPORT_READY' });
    expect(actor.getSnapshot().matches({ copro_creation: 'awaiting_precad' })).toBe(true);

    // Request PRECAD
    actor.send({ type: 'PRECAD_REQUESTED', referenceNumber: 'PRECAD-2023-001' });
    const snapshotAfterPrecadRequest = actor.getSnapshot();
    expect(snapshotAfterPrecadRequest.matches({ copro_creation: 'precad_review' })).toBe(true);
    expect(snapshotAfterPrecadRequest.context.precadReferenceNumber).toBe('PRECAD-2023-001');
    expect(snapshotAfterPrecadRequest.context.precadRequestDate).toBeInstanceOf(Date);

    // PRECAD approved
    const approvalDate = new Date('2023-07-15');
    actor.send({ type: 'PRECAD_APPROVED', approvalDate });
    const snapshotAfterApproval = actor.getSnapshot();
    expect(snapshotAfterApproval.matches({ copro_creation: 'drafting_acte' })).toBe(true);
    expect(snapshotAfterApproval.context.precadApprovalDate).toEqual(approvalDate);

    // Acte drafted
    actor.send({ type: 'ACTE_DRAFTED' });
    expect(actor.getSnapshot().matches({ copro_creation: 'awaiting_signatures' })).toBe(true);

    // Acte signed (this is the acte de base)
    const signatureDate = new Date('2023-08-01');
    actor.send({ type: 'ACTE_SIGNED', signatureDate });
    const snapshotAfterSigning = actor.getSnapshot();
    expect(snapshotAfterSigning.matches({ copro_creation: 'awaiting_transcription' })).toBe(true);
    expect(snapshotAfterSigning.context.acteDeBaseDate).toEqual(signatureDate);

    // Acte transcribed (creates legal personality)
    const transcriptionDate = new Date('2023-08-15');
    const acpNumber = 'ACP-BE-2023-12345';
    actor.send({ type: 'ACTE_TRANSCRIBED', transcriptionDate, acpNumber });
    const finalSnapshot = actor.getSnapshot();
    expect(finalSnapshot.matches('copro_established')).toBe(true);
    expect(finalSnapshot.context.acteTranscriptionDate).toEqual(transcriptionDate);
    expect(finalSnapshot.context.acpEnterpriseNumber).toBe(acpNumber);
  });

  it('should record all copropriété milestones in context', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to ownership_transferred
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date(), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date(), notaryId: 'notary1' });
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date() });

    // Go through copropriété flow
    actor.send({ type: 'START_COPRO_CREATION' });
    actor.send({ type: 'TECHNICAL_REPORT_READY' });

    const precadRef = 'PRECAD-TEST-001';
    actor.send({ type: 'PRECAD_REQUESTED', referenceNumber: precadRef });

    const approvalDate = new Date('2023-07-15');
    actor.send({ type: 'PRECAD_APPROVED', approvalDate });

    actor.send({ type: 'ACTE_DRAFTED' });

    const signatureDate = new Date('2023-08-01');
    actor.send({ type: 'ACTE_SIGNED', signatureDate });

    const transcriptionDate = new Date('2023-08-15');
    const acpNumber = 'ACP-BE-123';
    actor.send({ type: 'ACTE_TRANSCRIBED', transcriptionDate, acpNumber });

    const context = actor.getSnapshot().context;

    expect(context.precadReferenceNumber).toBe(precadRef);
    expect(context.precadRequestDate).toBeInstanceOf(Date);
    expect(context.precadApprovalDate).toEqual(approvalDate);
    expect(context.acteDeBaseDate).toEqual(signatureDate);
    expect(context.acteTranscriptionDate).toEqual(transcriptionDate);
    expect(context.acpEnterpriseNumber).toBe(acpNumber);
  });
});

describe('Permit Process Flow', () => {
  it('should transition through complete permit process: REQUEST_PERMIT → PERMIT_GRANTED → PERMIT_ENACTED', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to copro_established
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date('2023-01-01'), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date('2023-05-01'), notaryId: 'notary1' });
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date('2023-05-10') });
    actor.send({ type: 'START_COPRO_CREATION' });
    actor.send({ type: 'TECHNICAL_REPORT_READY' });
    actor.send({ type: 'PRECAD_REQUESTED', referenceNumber: 'PRECAD-2023-001' });
    actor.send({ type: 'PRECAD_APPROVED', approvalDate: new Date('2023-07-15') });
    actor.send({ type: 'ACTE_DRAFTED' });
    actor.send({ type: 'ACTE_SIGNED', signatureDate: new Date('2023-08-01') });
    actor.send({ type: 'ACTE_TRANSCRIBED', transcriptionDate: new Date('2023-08-15'), acpNumber: 'ACP-BE-123' });

    expect(actor.getSnapshot().matches('copro_established')).toBe(true);

    // Request permit
    actor.send({ type: 'REQUEST_PERMIT' });
    const afterRequest = actor.getSnapshot();
    expect(afterRequest.matches({ permit_process: 'permit_review' })).toBe(true);
    expect(afterRequest.context.permitRequestedDate).toBeInstanceOf(Date);

    // Permit granted
    const grantDate = new Date('2023-10-01');
    actor.send({ type: 'PERMIT_GRANTED', grantDate });
    const afterGrant = actor.getSnapshot();
    expect(afterGrant.matches({ permit_process: 'awaiting_enactment' })).toBe(true);
    expect(afterGrant.context.permitGrantedDate).toEqual(grantDate);

    // Permit enacted
    const enactmentDate = new Date('2023-11-01');
    actor.send({ type: 'PERMIT_ENACTED', enactmentDate });
    const afterEnactment = actor.getSnapshot();
    expect(afterEnactment.matches('permit_active')).toBe(true);
    expect(afterEnactment.context.permitEnactedDate).toEqual(enactmentDate);
  });

  it('should handle permit rejection flow: REQUEST_PERMIT → PERMIT_REJECTED', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to copro_established
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date('2023-01-01'), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date('2023-05-01'), notaryId: 'notary1' });
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date('2023-05-10') });
    actor.send({ type: 'START_COPRO_CREATION' });
    actor.send({ type: 'TECHNICAL_REPORT_READY' });
    actor.send({ type: 'PRECAD_REQUESTED', referenceNumber: 'PRECAD-2023-001' });
    actor.send({ type: 'PRECAD_APPROVED', approvalDate: new Date('2023-07-15') });
    actor.send({ type: 'ACTE_DRAFTED' });
    actor.send({ type: 'ACTE_SIGNED', signatureDate: new Date('2023-08-01') });
    actor.send({ type: 'ACTE_TRANSCRIBED', transcriptionDate: new Date('2023-08-15'), acpNumber: 'ACP-BE-123' });

    // Request permit
    actor.send({ type: 'REQUEST_PERMIT' });
    expect(actor.getSnapshot().matches({ permit_process: 'permit_review' })).toBe(true);

    // Permit rejected - should return to permit_process initial state
    actor.send({ type: 'PERMIT_REJECTED', reason: 'Non-compliance with zoning regulations' });
    const afterRejection = actor.getSnapshot();
    expect(afterRejection.matches({ permit_process: 'awaiting_request' })).toBe(true);
  });

  it('should handle hidden lots declaration: PERMIT_ENACTED → DECLARE_HIDDEN_LOTS → lots_declared', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to permit_active
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date('2023-01-01'), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date('2023-05-01'), notaryId: 'notary1' });
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date('2023-05-10') });
    actor.send({ type: 'START_COPRO_CREATION' });
    actor.send({ type: 'TECHNICAL_REPORT_READY' });
    actor.send({ type: 'PRECAD_REQUESTED', referenceNumber: 'PRECAD-2023-001' });
    actor.send({ type: 'PRECAD_APPROVED', approvalDate: new Date('2023-07-15') });
    actor.send({ type: 'ACTE_DRAFTED' });
    actor.send({ type: 'ACTE_SIGNED', signatureDate: new Date('2023-08-01') });
    actor.send({ type: 'ACTE_TRANSCRIBED', transcriptionDate: new Date('2023-08-15'), acpNumber: 'ACP-BE-123' });
    actor.send({ type: 'REQUEST_PERMIT' });
    actor.send({ type: 'PERMIT_GRANTED', grantDate: new Date('2023-10-01') });
    actor.send({ type: 'PERMIT_ENACTED', enactmentDate: new Date('2023-11-01') });

    expect(actor.getSnapshot().matches('permit_active')).toBe(true);

    // Declare hidden lots
    actor.send({ type: 'DECLARE_HIDDEN_LOTS', lotIds: ['lot-1', 'lot-2', 'lot-3'] });
    expect(actor.getSnapshot().matches('lots_declared')).toBe(true);
  });

  it('should record all permit milestones in context', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Navigate to copro_established
    actor.send({ type: 'COMPROMIS_SIGNED', compromisDate: new Date('2023-01-01'), deposit: 50000 });
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    actor.send({ type: 'DEED_SIGNED', deedDate: new Date('2023-05-01'), notaryId: 'notary1' });
    actor.send({ type: 'DEED_REGISTERED', registrationDate: new Date('2023-05-10') });
    actor.send({ type: 'START_COPRO_CREATION' });
    actor.send({ type: 'TECHNICAL_REPORT_READY' });
    actor.send({ type: 'PRECAD_REQUESTED', referenceNumber: 'PRECAD-2023-001' });
    actor.send({ type: 'PRECAD_APPROVED', approvalDate: new Date('2023-07-15') });
    actor.send({ type: 'ACTE_DRAFTED' });
    actor.send({ type: 'ACTE_SIGNED', signatureDate: new Date('2023-08-01') });
    actor.send({ type: 'ACTE_TRANSCRIBED', transcriptionDate: new Date('2023-08-15'), acpNumber: 'ACP-BE-123' });

    // Request permit and track dates
    actor.send({ type: 'REQUEST_PERMIT' });
    const requestSnapshot = actor.getSnapshot();
    expect(requestSnapshot.context.permitRequestedDate).toBeInstanceOf(Date);

    const grantDate = new Date('2023-10-01');
    actor.send({ type: 'PERMIT_GRANTED', grantDate });
    const grantSnapshot = actor.getSnapshot();
    expect(grantSnapshot.context.permitGrantedDate).toEqual(grantDate);

    const enactmentDate = new Date('2023-11-01');
    actor.send({ type: 'PERMIT_ENACTED', enactmentDate });
    const enactmentSnapshot = actor.getSnapshot();
    expect(enactmentSnapshot.context.permitEnactedDate).toEqual(enactmentDate);

    // Verify all permit dates are recorded
    const context = enactmentSnapshot.context;
    expect(context.permitRequestedDate).toBeInstanceOf(Date);
    expect(context.permitGrantedDate).toEqual(grantDate);
    expect(context.permitEnactedDate).toEqual(enactmentDate);
  });
});
