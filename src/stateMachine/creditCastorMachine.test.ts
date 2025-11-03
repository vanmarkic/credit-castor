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
