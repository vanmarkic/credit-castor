import type {
  Participant,
  CalculationResults,
  PortageFormulaParams
} from './calculatorUtils'
import type { TimelineTransaction } from '../types/timeline'
import {
  calculatePortageTransaction,
  calculateCooproTransaction
} from './transactionCalculations'

/**
 * Represents a copropriété inventory snapshot at a specific date.
 * Only created when inventory changes (sales occur).
 */
export interface CoproSnapshot {
  date: Date
  availableLots: number
  totalSurface: number
  soldThisDate: string[] // Names of participants who bought this date
  reserveIncrease: number // 30% of sale proceeds
  colorZone: number // Index for color-coding related events
}

/**
 * Represents a participant's financial snapshot at a specific date.
 */
export interface TimelineSnapshot {
  date: Date
  participantName: string
  participantIndex: number
  totalCost: number
  loanNeeded: number
  monthlyPayment: number
  isT0: boolean
  colorZone: number // Index for color-coding related events
  transaction?: TimelineTransaction
  showFinancingDetails: boolean // Hide for redistribution cards
}

/**
 * Extract unique dates from participants and sort chronologically.
 * Uses deedDate as fallback for participants without entryDate.
 *
 * @param participants - Array of all participants
 * @param deedDate - Default date for founders (ISO string)
 * @returns Sorted array of unique dates
 */
export function getUniqueSortedDates(
  participants: Participant[],
  deedDate: string
): Date[] {
  const dates = [
    ...new Set(
      participants.map(p =>
        p.entryDate
          ? new Date(p.entryDate).toISOString().split('T')[0]
          : deedDate
      )
    )
  ].sort()

  return dates.map(d => new Date(d))
}

/**
 * Generate copropriété snapshots showing inventory changes over time.
 * Only creates snapshots when copro inventory changes (lots sold).
 *
 * @param participants - Array of all participants
 * @param calculations - Calculation results for all participants
 * @param deedDate - Initial deed date (ISO string)
 * @returns Array of copro snapshots
 */
export function generateCoproSnapshots(
  participants: Participant[],
  calculations: CalculationResults,
  deedDate: string
): CoproSnapshot[] {
  const snapshots: CoproSnapshot[] = []

  const dates = [
    ...new Set(
      participants.map(p =>
        p.entryDate
          ? new Date(p.entryDate).toISOString().split('T')[0]
          : deedDate
      )
    )
  ].sort()

  let previousLots = 0
  let previousSurface = 0

  dates.forEach((dateStr, idx) => {
    const date = new Date(dateStr)

    // Find participants who joined from copro at this date
    const joinedFromCopro = participants.filter(p => {
      const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate)
      return (
        pEntryDate.toISOString().split('T')[0] === dateStr &&
        p.purchaseDetails?.buyingFrom === 'Copropriété'
      )
    })

    // Calculate 30% reserve increase from copro sales
    const reserveIncrease = joinedFromCopro.reduce((sum, p) => {
      const purchasePrice = p.purchaseDetails?.purchasePrice || 0
      return sum + purchasePrice * 0.3
    }, 0)

    // Calculate remaining lots/surface
    const soldLots = participants.filter(p => {
      const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate)
      return (
        pEntryDate <= date &&
        p.purchaseDetails?.buyingFrom === 'Copropriété'
      )
    }).length

    const soldSurface = participants
      .filter(p => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate)
        return (
          pEntryDate <= date &&
          p.purchaseDetails?.buyingFrom === 'Copropriété'
        )
      })
      .reduce((sum, p) => sum + (p.surface || 0), 0)

    const availableLots = Math.max(0, participants.length - soldLots)
    const totalSurface = calculations.totalSurface - soldSurface

    // Only add snapshot if copro inventory changed or it's T0
    if (
      idx === 0 ||
      availableLots !== previousLots ||
      totalSurface !== previousSurface
    ) {
      snapshots.push({
        date,
        availableLots,
        totalSurface,
        soldThisDate: joinedFromCopro.map(p => p.name),
        reserveIncrease,
        colorZone: idx
      })

      previousLots = availableLots
      previousSurface = totalSurface
    }
  })

  return snapshots
}

/**
 * Determine which participants are affected at a specific date/event.
 *
 * Rules:
 * - T0: All founders get cards
 * - Copro sale: Newcomer + all active participants (redistribution affects everyone)
 * - Portage sale: Only buyer and seller
 *
 * @param joiningParticipants - Participants joining at this date
 * @param allParticipants - All participants in the project
 * @param date - Event date
 * @param deedDate - Initial deed date (ISO string)
 * @param isT0 - Whether this is the T0 event
 * @returns Array of affected participants (deduplicated)
 */
export function determineAffectedParticipants(
  joiningParticipants: Participant[],
  allParticipants: Participant[],
  date: Date,
  deedDate: string,
  isT0: boolean
): Participant[] {
  if (isT0) {
    // T0: All founders get cards
    return joiningParticipants.filter(p => p.isFounder)
  }

  // Later events: only show affected participants
  const affectedParticipants: Participant[] = []

  joiningParticipants.forEach(newcomer => {
    // Add the newcomer
    affectedParticipants.push(newcomer)

    if (newcomer.purchaseDetails?.buyingFrom === 'Copropriété') {
      // Copro sale: ALL active participants are affected (shared costs redistribute)
      const allActive = allParticipants.filter(p => {
        const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate)
        return pEntryDate < date // Active before this date
      })
      affectedParticipants.push(...allActive)
    } else if (newcomer.purchaseDetails?.buyingFrom) {
      // Portage sale: only buyer and seller affected
      const seller = allParticipants.find(
        p => p.name === newcomer.purchaseDetails!.buyingFrom
      )
      if (seller) {
        affectedParticipants.push(seller)
      }
    }
  })

  // Remove duplicates
  return Array.from(new Set(affectedParticipants))
}

/**
 * Generate timeline snapshots for all participants showing their financial state
 * at each key event date (T0, purchases, sales, redistributions).
 *
 * @param participants - Array of all participants
 * @param calculations - Calculation results for all participants
 * @param deedDate - Initial deed date (ISO string)
 * @param formulaParams - Portage formula parameters
 * @returns Map of participant name to array of snapshots
 */
export function generateParticipantSnapshots(
  participants: Participant[],
  calculations: CalculationResults,
  deedDate: string,
  formulaParams: PortageFormulaParams
): Map<string, TimelineSnapshot[]> {
  const result: Map<string, TimelineSnapshot[]> = new Map()
  const previousSnapshots: Map<string, TimelineSnapshot> = new Map()

  // Get unique dates sorted
  const dates = [
    ...new Set(
      participants.map(p =>
        p.entryDate
          ? new Date(p.entryDate).toISOString().split('T')[0]
          : deedDate
      )
    )
  ].sort()

  // For each date, create snapshots ONLY for affected participants
  dates.forEach((dateStr, dateIdx) => {
    const date = new Date(dateStr)

    // Find participants who joined at this exact date
    const joiningParticipants = participants.filter(p => {
      const pEntryDate = p.entryDate ? new Date(p.entryDate) : new Date(deedDate)
      return pEntryDate.toISOString().split('T')[0] === dateStr
    })

    // Determine who is affected at this moment
    const affectedParticipants = determineAffectedParticipants(
      joiningParticipants,
      participants,
      date,
      deedDate,
      dateIdx === 0
    )

    // Create snapshots for affected participants
    affectedParticipants.forEach(p => {
      const pIdx = participants.indexOf(p)
      const breakdown = calculations.participantBreakdown[pIdx]

      if (!breakdown) return

      // Detect if participant is involved in a transaction
      let transaction: TimelineTransaction | undefined

      // Check if selling portage lot
      const isSeller = joiningParticipants.some(
        np => np.purchaseDetails?.buyingFrom === p.name
      )

      // Check if buying portage lot
      const isBuyer =
        joiningParticipants.includes(p) &&
        p.purchaseDetails?.buyingFrom &&
        p.purchaseDetails.buyingFrom !== 'Copropriété'

      // Check if buying from copro
      const isCoproBuyer =
        joiningParticipants.includes(p) &&
        p.purchaseDetails?.buyingFrom === 'Copropriété'

      // Check if affected by copro sale (but not the buyer)
      const coproSale = joiningParticipants.find(
        np => np.purchaseDetails?.buyingFrom === 'Copropriété'
      )

      // Show financing details only for:
      // - T0 founders
      // - Direct buyers (portage or copro)
      // Hide for:
      // - Direct sellers (portage) - they only see the transaction delta
      // - Participants only affected by redistribution
      const showFinancingDetails = dateIdx === 0 || isBuyer || isCoproBuyer

      if (isSeller) {
        const buyer = joiningParticipants.find(
          np => np.purchaseDetails?.buyingFrom === p.name
        )
        if (buyer) {
          const buyerIdx = participants.indexOf(buyer)
          const buyerBreakdown = calculations.participantBreakdown[buyerIdx]
          const sellerEntryDate = p.entryDate
            ? new Date(p.entryDate)
            : new Date(deedDate)

          if (buyerBreakdown) {
            transaction = calculatePortageTransaction(
              p,
              buyer,
              date,
              breakdown,
              buyerBreakdown,
              sellerEntryDate,
              formulaParams,
              participants.length
            )
          }
        }
      } else if (isBuyer) {
        const seller = participants.find(
          ps => ps.name === p.purchaseDetails?.buyingFrom
        )
        if (seller) {
          const sellerIdx = participants.indexOf(seller)
          const sellerBreakdown = calculations.participantBreakdown[sellerIdx]
          const sellerEntryDate = seller.entryDate
            ? new Date(seller.entryDate)
            : new Date(deedDate)

          if (sellerBreakdown) {
            transaction = calculatePortageTransaction(
              seller,
              p,
              date,
              sellerBreakdown,
              breakdown,
              sellerEntryDate,
              formulaParams,
              participants.length
            )
          }
        }
      } else if (coproSale && !isCoproBuyer) {
        const prevSnapshot = previousSnapshots.get(p.name)
        if (prevSnapshot) {
          // Only include participants who have joined by this date
          const activeParticipants = participants.filter(participant => {
            const participantEntryDate = participant.entryDate
              ? new Date(participant.entryDate)
              : new Date(deedDate)
            return participantEntryDate <= date
          })

          transaction = calculateCooproTransaction(
            p,
            coproSale,
            prevSnapshot,
            activeParticipants
          )
        }
      }

      const snapshot: TimelineSnapshot = {
        date,
        participantName: p.name,
        participantIndex: pIdx,
        totalCost: breakdown.totalCost,
        loanNeeded: breakdown.loanNeeded,
        monthlyPayment: breakdown.monthlyPayment,
        isT0: dateIdx === 0 && p.isFounder === true,
        colorZone: dateIdx, // Each date gets its own color zone
        transaction,
        showFinancingDetails
      }

      if (!result.has(p.name)) {
        result.set(p.name, [])
      }
      result.get(p.name)!.push(snapshot)

      // Store for next iteration
      previousSnapshots.set(p.name, snapshot)
    })
  })

  return result
}
