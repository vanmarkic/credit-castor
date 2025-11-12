/**
 * Participant operations hook
 * Provides pure functions for participant manipulation
 */

import type { Participant } from '../utils/calculatorUtils';

export interface ParticipantOperations {
  addParticipant: (
    participants: Participant[],
    deedDate: string
  ) => Participant[];

  removeParticipant: (
    participants: Participant[],
    index: number
  ) => Participant[];

  updateParticipantName: (
    participants: Participant[],
    index: number,
    name: string
  ) => Participant[];

  updateParticipantSurface: (
    participants: Participant[],
    index: number,
    surface: number
  ) => Participant[];

  updateCapital: (
    participants: Participant[],
    index: number,
    value: number
  ) => Participant[];

  updateNotaryRate: (
    participants: Participant[],
    index: number,
    value: number
  ) => Participant[];

  updateInterestRate: (
    participants: Participant[],
    index: number,
    value: number
  ) => Participant[];

  updateDuration: (
    participants: Participant[],
    index: number,
    value: number
  ) => Participant[];

  updateQuantity: (
    participants: Participant[],
    index: number,
    value: number
  ) => Participant[];

  updateParachevementsPerM2: (
    participants: Participant[],
    index: number,
    value: number
  ) => Participant[];

  updateCascoSqm: (
    participants: Participant[],
    index: number,
    value: number | undefined
  ) => Participant[];

  updateParachevementsSqm: (
    participants: Participant[],
    index: number,
    value: number | undefined
  ) => Participant[];

  addPortageLot: (
    participants: Participant[],
    participantIndex: number,
    deedDate: string,
    participantCalc?: {
      purchaseShare: number;
      droitEnregistrements: number;
      casco: number;
    }
  ) => Participant[];

  removePortageLot: (
    participants: Participant[],
    participantIndex: number,
    lotId: number
  ) => Participant[];

  updatePortageLotSurface: (
    participants: Participant[],
    participantIndex: number,
    lotId: number,
    surface: number
  ) => Participant[];

  updatePortageLotConstructionPayment: (
    participants: Participant[],
    participantIndex: number,
    lotId: number,
    founderPaysCasco: boolean,
    founderPaysParachèvement: boolean
  ) => Participant[];
}

/**
 * Add a new participant
 */
export function addParticipant(
  participants: Participant[],
  deedDate: string
): Participant[] {
  const newId = Math.max(...participants.map(p => p.unitId || 0), 0) + 1;

  return [...participants, {
    name: 'Participant·e ' + (participants.length + 1),
    capitalApporte: 100000,
    registrationFeesRate: 12.5,
    unitId: newId,
    surface: 100,
    interestRate: 4.5,
    durationYears: 25,
    quantity: 1,
    parachevementsPerM2: 500,
    isFounder: true,
    entryDate: new Date(deedDate)
  }];
}

/**
 * Remove a participant by index
 */
export function removeParticipant(
  participants: Participant[],
  index: number
): Participant[] {
  if (participants.length <= 1) {
    return participants;
  }
  return participants.filter((_, i) => i !== index);
}

/**
 * Update participant name
 */
export function updateParticipantName(
  participants: Participant[],
  index: number,
  name: string
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], name };
  return newParticipants;
}

/**
 * Update participant surface
 */
export function updateParticipantSurface(
  participants: Participant[],
  index: number,
  surface: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], surface };
  return newParticipants;
}

/**
 * Update participant capital
 */
export function updateCapital(
  participants: Participant[],
  index: number,
  value: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], capitalApporte: value };
  return newParticipants;
}

/**
 * Update participant notary rate
 */
export function updateNotaryRate(
  participants: Participant[],
  index: number,
  value: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], registrationFeesRate: value };
  return newParticipants;
}

/**
 * Update participant interest rate
 */
export function updateInterestRate(
  participants: Participant[],
  index: number,
  value: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], interestRate: value };
  return newParticipants;
}

/**
 * Update participant loan duration
 */
export function updateDuration(
  participants: Participant[],
  index: number,
  value: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], durationYears: value };
  return newParticipants;
}

/**
 * Update participant quantity
 */
export function updateQuantity(
  participants: Participant[],
  index: number,
  value: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = {
    ...newParticipants[index],
    quantity: Math.max(1, value)
  };
  return newParticipants;
}

/**
 * Update participant parachevements per m2
 */
export function updateParachevementsPerM2(
  participants: Participant[],
  index: number,
  value: number
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], parachevementsPerM2: value };
  return newParticipants;
}

/**
 * Update participant casco sqm
 */
export function updateCascoSqm(
  participants: Participant[],
  index: number,
  value: number | undefined
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], cascoSqm: value };
  return newParticipants;
}

/**
 * Update participant parachevements sqm
 */
export function updateParachevementsSqm(
  participants: Participant[],
  index: number,
  value: number | undefined
): Participant[] {
  const newParticipants = [...participants];
  newParticipants[index] = { ...newParticipants[index], parachevementsSqm: value };
  return newParticipants;
}

/**
 * Add a portage lot to a participant
 */
export function addPortageLot(
  participants: Participant[],
  participantIndex: number,
  deedDate: string,
  participantCalc?: {
    purchaseShare: number;
    droitEnregistrements: number;
    casco: number;
  }
): Participant[] {
  const newParticipants = [...participants];
  const participant = { ...newParticipants[participantIndex] };

  const newLotId = Math.max(
    ...participants.flatMap(p => p.lotsOwned?.map(l => l.lotId) || []),
    0
  ) + 1;

  if (!participant.lotsOwned) {
    participant.lotsOwned = [];
  } else {
    participant.lotsOwned = [...participant.lotsOwned];
  }

  const currentQuantity = participant.quantity || 1;
  participant.quantity = currentQuantity + 1;

  participant.lotsOwned.push({
    lotId: newLotId,
    surface: 0,
    unitId: participant.unitId || 0,
    isPortage: true,
    allocatedSurface: 0,
    acquiredDate: new Date(deedDate),
    originalPrice: participantCalc?.purchaseShare,
    originalNotaryFees: participantCalc?.droitEnregistrements,
    originalConstructionCost: participantCalc?.casco
  });

  newParticipants[participantIndex] = participant;
  return newParticipants;
}

/**
 * Remove a portage lot from a participant
 */
export function removePortageLot(
  participants: Participant[],
  participantIndex: number,
  lotId: number
): Participant[] {
  const newParticipants = [...participants];
  const participant = { ...newParticipants[participantIndex] };

  if (!participant.lotsOwned) {
    return participants;
  }

  const lotToRemove = participant.lotsOwned.find(l => l.lotId === lotId);
  participant.lotsOwned = participant.lotsOwned.filter(l => l.lotId !== lotId);

  const currentQuantity = participant.quantity || 1;
  participant.quantity = Math.max(1, currentQuantity - 1);

  if (lotToRemove) {
    const currentSurface = participant.surface || 0;
    participant.surface = Math.max(0, currentSurface - (lotToRemove.surface || 0));
  }

  newParticipants[participantIndex] = participant;
  return newParticipants;
}

/**
 * Update portage lot surface
 */
export function updatePortageLotSurface(
  participants: Participant[],
  participantIndex: number,
  lotId: number,
  surface: number
): Participant[] {
  const newParticipants = [...participants];
  const participant = { ...newParticipants[participantIndex] };

  if (!participant.lotsOwned) {
    return participants;
  }

  participant.lotsOwned = [...participant.lotsOwned];
  const lot = participant.lotsOwned.find(l => l.lotId === lotId);

  if (lot) {
    const oldSurface = lot.surface || 0;
    const surfaceChange = surface - oldSurface;

    lot.surface = surface;
    lot.allocatedSurface = surface;

    const currentTotalSurface = participant.surface || 0;
    participant.surface = currentTotalSurface + surfaceChange;
  }

  newParticipants[participantIndex] = participant;
  return newParticipants;
}

/**
 * Update portage lot construction payment configuration
 * Enforces dependency: parachèvement requires CASCO
 */
export function updatePortageLotConstructionPayment(
  participants: Participant[],
  participantIndex: number,
  lotId: number,
  founderPaysCasco: boolean,
  founderPaysParachèvement: boolean
): Participant[] {
  const newParticipants = [...participants];
  const participant = { ...newParticipants[participantIndex] };

  if (!participant.lotsOwned) {
    return participants;
  }

  participant.lotsOwned = [...participant.lotsOwned];
  const lot = participant.lotsOwned.find(l => l.lotId === lotId);

  if (lot) {
    // Enforce dependency: if parachèvement is checked, CASCO must be checked
    lot.founderPaysCasco = founderPaysCasco;
    lot.founderPaysParachèvement = founderPaysParachèvement && founderPaysCasco;
  }

  newParticipants[participantIndex] = participant;
  return newParticipants;
}

/**
 * Hook that provides participant operation functions
 */
export function useParticipantOperations(): ParticipantOperations {
  return {
    addParticipant,
    removeParticipant,
    updateParticipantName,
    updateParticipantSurface,
    updateCapital,
    updateNotaryRate,
    updateInterestRate,
    updateDuration,
    updateQuantity,
    updateParachevementsPerM2,
    updateCascoSqm,
    updateParachevementsSqm,
    addPortageLot,
    removePortageLot,
    updatePortageLotSurface,
    updatePortageLotConstructionPayment
  };
}
