import type { ProjectContext, Participant, Lot, Sale, SaleType } from './types';

export const queries = {
  // ============================================
  // PARTICIPANT QUERIES
  // ============================================

  getFounders(context: ProjectContext): Participant[] {
    return context.participants.filter(p => p.isFounder);
  },

  getNewcomers(context: ProjectContext): Participant[] {
    return context.participants.filter(p => !p.isFounder);
  },

  getParticipant(context: ProjectContext, id: string): Participant | undefined {
    return context.participants.find(p => p.id === id);
  },

  // ============================================
  // LOT QUERIES
  // ============================================

  getLotsByOrigin(context: ProjectContext, origin: 'founder' | 'copro'): Lot[] {
    return context.lots.filter(l => l.origin === origin);
  },

  getAvailableLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.status === 'available');
  },

  getPortageLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.heldForPortage === true && l.status === 'available');
  },

  getHiddenLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.origin === 'copro' && l.status === 'hidden');
  },

  getRevealedCoproLots(context: ProjectContext): Lot[] {
    return context.lots.filter(l => l.origin === 'copro' && l.status !== 'hidden');
  },

  // ============================================
  // SALE TYPE DETECTION
  // ============================================

  getSaleType(context: ProjectContext, lotId: string, sellerId: string): SaleType {
    const lot = context.lots.find(l => l.id === lotId);

    if (!lot) throw new Error('Lot not found');

    if (sellerId === 'copropriete' && lot.origin === 'copro') {
      return 'copro';
    }

    if (lot.heldForPortage) {
      return 'portage';
    }

    return 'classic';
  },

  // ============================================
  // STATE QUERIES
  // ============================================

  canSellPortageLots(context: ProjectContext): boolean {
    return context.acteTranscriptionDate !== null;
  },

  canSellCoproLots(context: ProjectContext): boolean {
    return context.permitEnactedDate !== null &&
           this.getRevealedCoproLots(context).length > 0;
  }
};
