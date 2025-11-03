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

describe('Sales Flows', () => {
  // Helper function to navigate to lots_declared state
  const navigateToLotsDelared = (actor: any) => {
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
    actor.send({ type: 'DECLARE_HIDDEN_LOTS', lotIds: ['lot-1', 'lot-2'] });
  };

  describe('Portage Sale Flow', () => {
    it('should transition from lots_declared to sales_active on FIRST_SALE', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      expect(actor.getSnapshot().matches('lots_declared')).toBe(true);

      actor.send({ type: 'FIRST_SALE' });
      expect(actor.getSnapshot().matches({ sales_active: 'awaiting_sale' })).toBe(true);
    });

    it('should complete portage sale: SALE_INITIATED → processing_sale → COMPLETE_SALE', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup portage lot in context
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'portage-lot-1',
        origin: 'founder',
        status: 'available',
        ownerId: 'founder1',
        surface: 50,
        heldForPortage: true
      }];

      // Initiate portage sale
      const saleDate = new Date('2024-01-15');
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'portage-lot-1',
        sellerId: 'founder1',
        buyerId: 'buyer1',
        proposedPrice: 150000,
        saleDate
      });

      const afterInitiation = actor.getSnapshot();
      expect(afterInitiation.matches({ sales_active: 'processing_sale' })).toBe(true);

      // Complete sale
      actor.send({ type: 'COMPLETE_SALE' });
      const afterCompletion = actor.getSnapshot();

      expect(afterCompletion.matches({ sales_active: 'awaiting_sale' })).toBe(true);
      expect(afterCompletion.context.salesHistory.length).toBe(1);

      const sale = afterCompletion.context.salesHistory[0];
      expect(sale.type).toBe('portage');
      expect(sale.lotId).toBe('portage-lot-1');
      expect(sale.buyer).toBe('buyer1');
      expect(sale.saleDate).toEqual(saleDate);
    });

    it('should verify portage sale pricing includes carrying costs and recovery components', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup portage lot with acquisition details
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'portage-lot-1',
        origin: 'founder',
        status: 'available',
        ownerId: 'founder1',
        surface: 50,
        heldForPortage: true,
        acquisition: {
          date: new Date('2023-05-01'),
          totalCost: 100000,
          purchaseShare: 80000,
          registrationFees: 10000,
          constructionCost: 5000,
          fraisCommuns: 5000
        }
      }];

      // Initiate and complete sale
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'portage-lot-1',
        sellerId: 'founder1',
        buyerId: 'buyer1',
        proposedPrice: 150000,
        saleDate: new Date('2024-01-15')
      });
      actor.send({ type: 'COMPLETE_SALE' });

      const sale = actor.getSnapshot().context.salesHistory[0];
      expect(sale.type).toBe('portage');

      if (sale.type === 'portage') {
        expect(sale.pricing).toBeDefined();
        expect(sale.pricing.baseAcquisitionCost).toBeGreaterThan(0);
        expect(sale.pricing.carryingCosts).toBeDefined();
        expect(sale.pricing.carryingCosts.total).toBeGreaterThan(0);
        expect(sale.pricing.registrationFeesRecovery).toBeGreaterThan(0);
        expect(sale.pricing.fraisCommunsRecovery).toBeGreaterThan(0);
        expect(sale.pricing.totalPrice).toBeGreaterThan(0);
      }
    });
  });

  describe('Copropriété Sale Flow', () => {
    it('should complete copro sale: SALE_INITIATED (copro) → COMPLETE_SALE', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup copro lot in context
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'copro-lot-1',
        origin: 'copro',
        status: 'available',
        ownerId: 'copropriete',
        surface: 60,
        heldForPortage: false
      }];

      // Initiate copro sale
      const saleDate = new Date('2024-02-01');
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'copro-lot-1',
        sellerId: 'copropriete',
        buyerId: 'buyer2',
        proposedPrice: 120000,
        saleDate
      });

      const afterInitiation = actor.getSnapshot();
      expect(afterInitiation.matches({ sales_active: 'processing_sale' })).toBe(true);

      // Complete sale
      actor.send({ type: 'COMPLETE_SALE' });
      const afterCompletion = actor.getSnapshot();

      expect(afterCompletion.matches({ sales_active: 'awaiting_sale' })).toBe(true);
      expect(afterCompletion.context.salesHistory.length).toBe(1);

      const sale = afterCompletion.context.salesHistory[0];
      expect(sale.type).toBe('copro');
      expect(sale.lotId).toBe('copro-lot-1');
      expect(sale.buyer).toBe('buyer2');
    });

    it('should verify copro sale has dynamic per-m² pricing with GEN1 compensation', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup copro lot
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'copro-lot-1',
        origin: 'copro',
        status: 'available',
        ownerId: 'copropriete',
        surface: 60,
        heldForPortage: false
      }];

      // Initiate and complete sale
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'copro-lot-1',
        sellerId: 'copropriete',
        buyerId: 'buyer2',
        proposedPrice: 120000,
        saleDate: new Date('2024-02-01')
      });
      actor.send({ type: 'COMPLETE_SALE' });

      const sale = actor.getSnapshot().context.salesHistory[0];
      expect(sale.type).toBe('copro');

      if (sale.type === 'copro') {
        expect(sale.pricing).toBeDefined();
        expect(sale.pricing.baseCostPerSqm).toBeGreaterThan(0);
        expect(sale.pricing.gen1CompensationPerSqm).toBeGreaterThan(0);
        expect(sale.pricing.pricePerSqm).toBe(
          sale.pricing.baseCostPerSqm + sale.pricing.gen1CompensationPerSqm
        );
        expect(sale.pricing.surface).toBe(60);
        expect(sale.pricing.totalPrice).toBe(sale.pricing.pricePerSqm * sale.pricing.surface);
      }
    });
  });

  describe('Classic Sale Flow', () => {
    it('should handle classic sale with buyer approval: SALE_INITIATED → awaiting_buyer_approval → BUYER_APPROVED → COMPLETE_SALE', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup regular lot (not portage, not copro)
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'classic-lot-1',
        origin: 'founder',
        status: 'available',
        ownerId: 'participant1',
        surface: 70,
        heldForPortage: false,
        acquisition: {
          date: new Date('2023-05-01'),
          totalCost: 100000,
          purchaseShare: 80000,
          registrationFees: 10000,
          constructionCost: 5000,
          fraisCommuns: 5000
        }
      }];

      // Initiate classic sale
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'classic-lot-1',
        sellerId: 'participant1',
        buyerId: 'candidate1',
        proposedPrice: 110000,
        saleDate: new Date('2024-03-01')
      });

      const afterInitiation = actor.getSnapshot();
      expect(afterInitiation.matches({ sales_active: 'awaiting_buyer_approval' })).toBe(true);

      // Approve buyer
      actor.send({
        type: 'BUYER_APPROVED',
        candidateId: 'candidate1'
      });

      const afterApproval = actor.getSnapshot();
      expect(afterApproval.matches({ sales_active: 'processing_sale' })).toBe(true);

      // Complete sale
      actor.send({ type: 'COMPLETE_SALE' });
      const afterCompletion = actor.getSnapshot();

      expect(afterCompletion.matches({ sales_active: 'awaiting_sale' })).toBe(true);
      expect(afterCompletion.context.salesHistory.length).toBe(1);

      const sale = afterCompletion.context.salesHistory[0];
      expect(sale.type).toBe('classic');
      expect(sale.lotId).toBe('classic-lot-1');

      if (sale.type === 'classic') {
        expect(sale.seller).toBe('participant1');
        expect(sale.buyerApproval).toBeDefined();
        expect(sale.buyerApproval.candidateId).toBe('candidate1');
        expect(sale.buyerApproval.approved).toBe(true);
      }
    });

    it('should handle buyer rejection: SALE_INITIATED → BUYER_REJECTED → awaiting_sale', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup regular lot
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'classic-lot-1',
        origin: 'founder',
        status: 'available',
        ownerId: 'participant1',
        surface: 70,
        heldForPortage: false
      }];

      // Initiate classic sale
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'classic-lot-1',
        sellerId: 'participant1',
        buyerId: 'candidate1',
        proposedPrice: 110000,
        saleDate: new Date('2024-03-01')
      });

      expect(actor.getSnapshot().matches({ sales_active: 'awaiting_buyer_approval' })).toBe(true);

      // Reject buyer
      actor.send({
        type: 'BUYER_REJECTED',
        candidateId: 'candidate1',
        reason: 'Not aligned with community values'
      });

      const afterRejection = actor.getSnapshot();
      expect(afterRejection.matches({ sales_active: 'awaiting_sale' })).toBe(true);
      expect(afterRejection.context.salesHistory.length).toBe(0);
    });

    it('should enforce price cap on classic sales', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      // Setup lot with acquisition cost
      const snapshot = actor.getSnapshot();
      snapshot.context.lots = [{
        id: 'classic-lot-1',
        origin: 'founder',
        status: 'available',
        ownerId: 'participant1',
        surface: 70,
        heldForPortage: false,
        acquisition: {
          date: new Date('2023-05-01'),
          totalCost: 100000,
          purchaseShare: 80000,
          registrationFees: 10000,
          constructionCost: 5000,
          fraisCommuns: 5000
        }
      }];

      // Initiate, approve and complete sale
      actor.send({
        type: 'SALE_INITIATED',
        lotId: 'classic-lot-1',
        sellerId: 'participant1',
        buyerId: 'candidate1',
        proposedPrice: 110000,
        saleDate: new Date('2024-03-01')
      });
      actor.send({ type: 'BUYER_APPROVED', candidateId: 'candidate1' });
      actor.send({ type: 'COMPLETE_SALE' });

      const sale = actor.getSnapshot().context.salesHistory[0];
      expect(sale.type).toBe('classic');

      if (sale.type === 'classic') {
        expect(sale.priceCap).toBeDefined();
        expect(sale.priceCap).toBeGreaterThanOrEqual(100000);
        expect(sale.price).toBeLessThanOrEqual(sale.priceCap);
      }
    });
  });

  describe('Sales Completion', () => {
    it('should transition to completed state when ALL_LOTS_SOLD', () => {
      const actor = createActor(creditCastorMachine);
      actor.start();

      navigateToLotsDelared(actor);
      actor.send({ type: 'FIRST_SALE' });

      expect(actor.getSnapshot().matches({ sales_active: 'awaiting_sale' })).toBe(true);

      // All lots sold
      actor.send({ type: 'ALL_LOTS_SOLD' });
      expect(actor.getSnapshot().matches('completed')).toBe(true);
    });
  });
});

describe('Individual Loan Financing', () => {
  it('should allow participant to apply for purchase loan during compromis_period', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    // Sign compromis
    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    expect(actor.getSnapshot().matches('compromis_period')).toBe(true);

    // Apply for loan
    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant1',
      loanDetails: {
        amount: 100000,
        rate: 0.035,
        duration: 25,
        bankName: 'BNP Paribas Fortis'
      }
    });

    const snapshot = actor.getSnapshot();
    const loanApp = snapshot.context.financingApplications.get('participant1');

    expect(loanApp).toBeDefined();
    expect(loanApp?.status).toBe('pending');
    expect(loanApp?.loanAmount).toBe(100000);
    expect(loanApp?.bankName).toBe('BNP Paribas Fortis');
    expect(loanApp?.purpose).toBe('purchase');
  });

  it('should handle loan approval flow: APPLY_FOR_LOAN → BANK_APPROVES → financing approved', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    // Apply for loan
    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant1',
      loanDetails: {
        amount: 100000,
        rate: 0.035,
        duration: 25,
        bankName: 'KBC'
      }
    });

    let snapshot = actor.getSnapshot();
    expect(snapshot.context.approvedFinancing).toBe(0);

    // Bank approves
    actor.send({
      type: 'BANK_APPROVES',
      participantId: 'participant1'
    });

    snapshot = actor.getSnapshot();
    const loanApp = snapshot.context.financingApplications.get('participant1');

    expect(loanApp?.status).toBe('approved');
    expect(loanApp?.approvalDate).toBeInstanceOf(Date);
    expect(snapshot.context.approvedFinancing).toBe(100000);
  });

  it('should handle loan rejection flow: APPLY_FOR_LOAN → BANK_REJECTS → participant notified', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    // Apply for loan
    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant1',
      loanDetails: {
        amount: 100000,
        rate: 0.035,
        duration: 25,
        bankName: 'ING'
      }
    });

    // Bank rejects
    actor.send({
      type: 'BANK_REJECTS',
      participantId: 'participant1',
      reason: 'Insufficient income'
    });

    const snapshot = actor.getSnapshot();
    const loanApp = snapshot.context.financingApplications.get('participant1');

    expect(loanApp?.status).toBe('rejected');
    expect(loanApp?.rejectionReason).toBe('Insufficient income');
    expect(snapshot.context.approvedFinancing).toBe(0);
  });

  it('should require all participants to have approved financing before ALL_CONDITIONS_MET can proceed', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    // Manually set required financing (in real app, this would be calculated from participants' needs)
    const snapshot = actor.getSnapshot();
    snapshot.context.requiredFinancing = 200000;

    // Apply for loans
    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant1',
      loanDetails: {
        amount: 100000,
        rate: 0.035,
        duration: 25,
        bankName: 'BNP Paribas Fortis'
      }
    });

    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant2',
      loanDetails: {
        amount: 100000,
        rate: 0.035,
        duration: 25,
        bankName: 'KBC'
      }
    });

    // Only one loan approved - should not proceed
    actor.send({
      type: 'BANK_APPROVES',
      participantId: 'participant1'
    });

    expect(actor.getSnapshot().context.approvedFinancing).toBe(100000);

    // Try to proceed - should fail guard
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    expect(actor.getSnapshot().matches('compromis_period')).toBe(true);

    // Approve second loan
    actor.send({
      type: 'BANK_APPROVES',
      participantId: 'participant2'
    });

    expect(actor.getSnapshot().context.approvedFinancing).toBe(200000);

    // Now should succeed
    actor.send({ type: 'ALL_CONDITIONS_MET' });
    expect(actor.getSnapshot().matches('ready_for_deed')).toBe(true);
  });

  it('should support split loan scenario: participant applies for second (renovation) loan later', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    actor.send({
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    });

    // Apply for first loan (purchase)
    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant1',
      loanDetails: {
        amount: 127000,
        rate: 0.035,
        duration: 25,
        bankName: 'BNP Paribas Fortis'
      }
    });

    let snapshot = actor.getSnapshot();
    let loanApp = snapshot.context.financingApplications.get('participant1');

    expect(loanApp?.purpose).toBe('purchase');
    expect(loanApp?.loanAmount).toBe(127000);

    // Approve first loan
    actor.send({
      type: 'BANK_APPROVES',
      participantId: 'participant1'
    });

    // Navigate to later stage and apply for second loan (renovation)
    // This would typically happen 1-2 years later during renovation phase
    actor.send({
      type: 'APPLY_FOR_LOAN',
      participantId: 'participant1',
      loanDetails: {
        amount: 43000,
        rate: 0.035,
        duration: 25,
        bankName: 'BNP Paribas Fortis'
      }
    });

    snapshot = actor.getSnapshot();

    // The new loan application should replace the old one in the Map
    // In real implementation, we might want to track multiple loans per participant
    loanApp = snapshot.context.financingApplications.get('participant1');
    expect(loanApp?.loanAmount).toBe(43000);
  });
});

describe('ACP Collective Loan Financing', () => {
  // Helper function to navigate to copro_established state
  const navigateToCoproEstablished = (actor: any) => {
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
  };

  it('should allow ACP loan proposal: PROPOSE_ACP_LOAN → voting scheduled', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    navigateToCoproEstablished(actor);

    // Propose ACP loan
    actor.send({
      type: 'PROPOSE_ACP_LOAN',
      loanDetails: {
        purpose: 'roof',
        description: 'Complete roof renovation',
        totalAmount: 50000,
        capitalRequired: 15000
      }
    });

    const snapshot = actor.getSnapshot();
    const acpLoans = Array.from(snapshot.context.acpLoans.values());

    expect(acpLoans.length).toBe(1);
    expect(acpLoans[0].status).toBe('proposed');
    expect(acpLoans[0].purpose).toBe('roof');
    expect(acpLoans[0].totalAmount).toBe(50000);
    expect(acpLoans[0].capitalRequired).toBe(15000);
  });

  it('should handle voting flow with hybrid method: vote → calculate scores → determine outcome', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    navigateToCoproEstablished(actor);

    // Setup participants with quotités
    const snapshot = actor.getSnapshot();
    snapshot.context.participants = [
      {
        id: 'p1',
        name: 'Alice',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot1', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 50 }],
        loans: []
      },
      {
        id: 'p2',
        name: 'Bob',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot2', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 30 }],
        loans: []
      },
      {
        id: 'p3',
        name: 'Carol',
        isFounder: false,
        entryDate: new Date('2023-06-01'),
        lotsOwned: [{ lotId: 'lot3', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 20 }],
        loans: []
      }
    ];

    snapshot.context.lots = [
      { id: 'lot1', origin: 'founder', status: 'sold', ownerId: 'p1', surface: 50, heldForPortage: false },
      { id: 'lot2', origin: 'founder', status: 'sold', ownerId: 'p2', surface: 30, heldForPortage: false },
      { id: 'lot3', origin: 'copro', status: 'sold', ownerId: 'p3', surface: 20, heldForPortage: false }
    ];

    // Propose ACP loan
    actor.send({
      type: 'PROPOSE_ACP_LOAN',
      loanDetails: {
        purpose: 'facade',
        description: 'Facade restoration',
        totalAmount: 40000,
        capitalRequired: 12000
      }
    });

    let acpLoanSnapshot = actor.getSnapshot();
    const loanId = Array.from(acpLoanSnapshot.context.acpLoans.keys())[0];

    // Schedule vote
    actor.send({
      type: 'SCHEDULE_VOTE',
      votingDate: new Date('2023-09-01')
    });

    acpLoanSnapshot = actor.getSnapshot();
    let loan = acpLoanSnapshot.context.acpLoans.get(loanId);
    expect(loan?.status).toBe('voting');
    expect(loan?.votingDate).toBeInstanceOf(Date);

    // Participants vote
    actor.send({
      type: 'VOTE_ON_LOAN',
      participantId: 'p1',
      vote: 'for'
    });

    actor.send({
      type: 'VOTE_ON_LOAN',
      participantId: 'p2',
      vote: 'for'
    });

    actor.send({
      type: 'VOTE_ON_LOAN',
      participantId: 'p3',
      vote: 'against'
    });

    // Complete voting
    actor.send({ type: 'VOTING_COMPLETE' });

    acpLoanSnapshot = actor.getSnapshot();
    loan = acpLoanSnapshot.context.acpLoans.get(loanId);

    expect(loan?.votingResults).toBeDefined();
    expect(loan?.votingResults?.quorumReached).toBe(true);
    expect(loan?.votingResults?.majorityReached).toBe(true);
    expect(loan?.approvedByCoowners).toBe(true);
    expect(loan?.status).toBe('capital_gathering');
  });

  it('should track capital gathering: participants pledge and pay capital', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    navigateToCoproEstablished(actor);

    // Setup participants
    const snapshot = actor.getSnapshot();
    snapshot.context.participants = [
      {
        id: 'p1',
        name: 'Alice',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot1', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 50 }],
        loans: []
      },
      {
        id: 'p2',
        name: 'Bob',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot2', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 50 }],
        loans: []
      }
    ];

    snapshot.context.lots = [
      { id: 'lot1', origin: 'founder', status: 'sold', ownerId: 'p1', surface: 50, heldForPortage: false },
      { id: 'lot2', origin: 'founder', status: 'sold', ownerId: 'p2', surface: 50, heldForPortage: false }
    ];

    // Propose and approve loan
    actor.send({
      type: 'PROPOSE_ACP_LOAN',
      loanDetails: {
        purpose: 'staircases',
        description: 'Staircase renovation',
        totalAmount: 30000,
        capitalRequired: 9000
      }
    });

    const loanId = Array.from(actor.getSnapshot().context.acpLoans.keys())[0];

    actor.send({ type: 'SCHEDULE_VOTE', votingDate: new Date('2023-09-01') });
    actor.send({ type: 'VOTE_ON_LOAN', participantId: 'p1', vote: 'for' });
    actor.send({ type: 'VOTE_ON_LOAN', participantId: 'p2', vote: 'for' });
    actor.send({ type: 'VOTING_COMPLETE' });

    // Pledge capital
    actor.send({
      type: 'PLEDGE_CAPITAL',
      participantId: 'p1',
      amount: 4500
    });

    actor.send({
      type: 'PLEDGE_CAPITAL',
      participantId: 'p2',
      amount: 4500
    });

    let acpLoanSnapshot = actor.getSnapshot();
    let loan = acpLoanSnapshot.context.acpLoans.get(loanId);

    expect(loan?.contributions.get('p1')?.amountPledged).toBe(4500);
    expect(loan?.contributions.get('p2')?.amountPledged).toBe(4500);

    // Pay capital
    actor.send({
      type: 'PAY_CAPITAL',
      participantId: 'p1',
      amount: 4500
    });

    actor.send({
      type: 'PAY_CAPITAL',
      participantId: 'p2',
      amount: 4500
    });

    acpLoanSnapshot = actor.getSnapshot();
    loan = acpLoanSnapshot.context.acpLoans.get(loanId);

    expect(loan?.contributions.get('p1')?.amountPaid).toBe(4500);
    expect(loan?.contributions.get('p2')?.amountPaid).toBe(4500);
    expect(loan?.capitalGathered).toBe(9000);
  });

  it('should handle loan application and disbursement once capital gathered', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    navigateToCoproEstablished(actor);

    // Setup participants
    const snapshot = actor.getSnapshot();
    snapshot.context.participants = [
      {
        id: 'p1',
        name: 'Alice',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot1', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 100 }],
        loans: []
      }
    ];

    snapshot.context.lots = [
      { id: 'lot1', origin: 'founder', status: 'sold', ownerId: 'p1', surface: 100, heldForPortage: false }
    ];

    // Propose and approve loan
    actor.send({
      type: 'PROPOSE_ACP_LOAN',
      loanDetails: {
        purpose: 'common_areas',
        description: 'Common area improvements',
        totalAmount: 20000,
        capitalRequired: 6000
      }
    });

    const loanId = Array.from(actor.getSnapshot().context.acpLoans.keys())[0];

    actor.send({ type: 'SCHEDULE_VOTE', votingDate: new Date('2023-09-01') });
    actor.send({ type: 'VOTE_ON_LOAN', participantId: 'p1', vote: 'for' });
    actor.send({ type: 'VOTING_COMPLETE' });
    actor.send({ type: 'PLEDGE_CAPITAL', participantId: 'p1', amount: 6000 });
    actor.send({ type: 'PAY_CAPITAL', participantId: 'p1', amount: 6000 });

    // Apply for ACP loan
    actor.send({
      type: 'APPLY_FOR_ACP_LOAN',
      loanId
    });

    let acpLoanSnapshot = actor.getSnapshot();
    let loan = acpLoanSnapshot.context.acpLoans.get(loanId);
    expect(loan?.status).toBe('loan_application');

    // Loan approved
    actor.send({
      type: 'ACP_LOAN_APPROVED',
      loanId
    });

    acpLoanSnapshot = actor.getSnapshot();
    loan = acpLoanSnapshot.context.acpLoans.get(loanId);
    expect(loan?.status).toBe('approved');
    expect(loan?.approvalDate).toBeInstanceOf(Date);

    // Disburse loan
    actor.send({
      type: 'DISBURSE_ACP_LOAN',
      loanId
    });

    acpLoanSnapshot = actor.getSnapshot();
    loan = acpLoanSnapshot.context.acpLoans.get(loanId);
    expect(loan?.status).toBe('disbursed');
    expect(loan?.disbursementDate).toBeInstanceOf(Date);

    // Should add loan amount to ACP bank account
    expect(acpLoanSnapshot.context.acpBankAccount).toBe(14000); // 20000 - 6000
  });

  it('should reject ACP loan if voting fails', () => {
    const actor = createActor(creditCastorMachine);
    actor.start();

    navigateToCoproEstablished(actor);

    // Setup participants
    const snapshot = actor.getSnapshot();
    snapshot.context.participants = [
      {
        id: 'p1',
        name: 'Alice',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot1', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 50 }],
        loans: []
      },
      {
        id: 'p2',
        name: 'Bob',
        isFounder: true,
        entryDate: new Date('2023-01-01'),
        lotsOwned: [{ lotId: 'lot2', acquisitionDate: new Date(), acquisitionCost: 100000, surface: 50 }],
        loans: []
      }
    ];

    snapshot.context.lots = [
      { id: 'lot1', origin: 'founder', status: 'sold', ownerId: 'p1', surface: 50, heldForPortage: false },
      { id: 'lot2', origin: 'founder', status: 'sold', ownerId: 'p2', surface: 50, heldForPortage: false }
    ];

    // Propose loan
    actor.send({
      type: 'PROPOSE_ACP_LOAN',
      loanDetails: {
        purpose: 'other',
        description: 'Unnecessary renovation',
        totalAmount: 100000,
        capitalRequired: 30000
      }
    });

    const loanId = Array.from(actor.getSnapshot().context.acpLoans.keys())[0];

    actor.send({ type: 'SCHEDULE_VOTE', votingDate: new Date('2023-09-01') });

    // Majority votes against
    actor.send({ type: 'VOTE_ON_LOAN', participantId: 'p1', vote: 'against' });
    actor.send({ type: 'VOTE_ON_LOAN', participantId: 'p2', vote: 'against' });

    actor.send({ type: 'VOTING_COMPLETE' });

    const acpLoanSnapshot = actor.getSnapshot();
    const loan = acpLoanSnapshot.context.acpLoans.get(loanId);

    expect(loan?.votingResults?.majorityReached).toBe(false);
    expect(loan?.approvedByCoowners).toBe(false);
    expect(loan?.status).toBe('rejected');
  });
});
