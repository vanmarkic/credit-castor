import { describe, it, expect } from 'vitest';
import type { ProjectEvents, PurchaseEvents, SalesEvents, FinancingEvents } from './events';

describe('Event Types', () => {
  it('should create purchase event', () => {
    const event: PurchaseEvents = {
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    };

    expect(event.type).toBe('COMPROMIS_SIGNED');
  });

  it('should create sale event', () => {
    const event: SalesEvents = {
      type: 'SALE_INITIATED',
      lotId: 'lot1',
      sellerId: 'p1',
      buyerId: 'p2',
      proposedPrice: 150000,
      saleDate: new Date()
    };

    expect(event.type).toBe('SALE_INITIATED');
  });

  it('should create financing event', () => {
    const event: FinancingEvents = {
      type: 'APPLY_FOR_LOAN',
      participantId: 'p1',
      loanDetails: {
        amount: 200000,
        rate: 0.035,
        duration: 25,
        bankName: 'KBC'
      }
    };

    expect(event.type).toBe('APPLY_FOR_LOAN');
  });

  it('should support all event types in union', () => {
    const purchaseEvent: ProjectEvents = {
      type: 'COMPROMIS_SIGNED',
      compromisDate: new Date('2023-01-01'),
      deposit: 50000
    };

    const salesEvent: ProjectEvents = {
      type: 'FIRST_SALE'
    };

    expect(purchaseEvent.type).toBe('COMPROMIS_SIGNED');
    expect(salesEvent.type).toBe('FIRST_SALE');
  });
});
