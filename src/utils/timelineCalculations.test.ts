import { describe, it, expect } from 'vitest'
import {
  getUniqueSortedDates,
  generateCoproSnapshots,
  determineAffectedParticipants,
  generateParticipantSnapshots
} from './timelineCalculations'
import type { Participant, CalculationResults } from './calculatorUtils'
import { DEFAULT_PORTAGE_FORMULA } from './calculatorUtils'

// Test fixtures
const deedDate = '2024-01-15'

const createMockParticipant = (overrides: Partial<Participant> = {}): Participant => ({
  name: 'Test Participant',
  surface: 100,
  capitalApporte: 50000,
  registrationFeesRate: 0.125,
  interestRate: 0.025,
  durationYears: 25,
  isFounder: false,
  lotsOwned: [],
  ...overrides
})

const createMockCalculations = (
  participantCount: number,
  totalSurface: number = 300
): CalculationResults => {
  const participantBreakdown = Array.from({ length: participantCount }, (_, i) => ({
    name: `Participant ${i + 1}`,
    surface: totalSurface / participantCount,
    capitalApporte: 50000,
    registrationFeesRate: 0.125,
    interestRate: 0.025,
    durationYears: 25,
    isFounder: false,
    lotsOwned: [],
    pricePerM2: 2000,
    purchaseShare: 1 / participantCount,
    droitEnregistrements: 5000,
    fraisNotaireFixe: 1000,
    casco: 80000,
    parachevements: 20000,
    personalRenovationCost: 100000,
    constructionCost: 100000,
    constructionCostPerUnit: 90000,
    travauxCommunsPerUnit: 10000,
    sharedCosts: 30000,
    totalCost: 200000 + i * 10000,
    loanNeeded: 150000 + i * 5000,
    financingRatio: 0.75,
    monthlyPayment: 800 + i * 50,
    totalRepayment: 240000,
    totalInterest: 90000
  }))

  return {
    totalSurface,
    pricePerM2: 2000,
    sharedCosts: 90000,
    sharedPerPerson: 90000 / participantCount,
    participantBreakdown,
    totals: {
      purchase: totalSurface * 2000,
      totalDroitEnregistrements: 15000,
      construction: 600000,
      shared: 90000,
      totalTravauxCommuns: 30000,
      travauxCommunsPerUnit: 10000,
      total: participantBreakdown.reduce((sum, p) => sum + p.totalCost, 0),
      capitalTotal: 50000 * participantCount,
      totalLoansNeeded: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0),
      averageLoan: participantBreakdown.reduce((sum, p) => sum + p.loanNeeded, 0) / participantCount,
      averageCapital: 50000
    }
  }
}

describe('timelineCalculations', () => {
  describe('getUniqueSortedDates', () => {
    it('should return unique dates sorted chronologically', () => {
      const participants: Participant[] = [
        createMockParticipant({ name: 'Alice', entryDate: new Date('2024-03-01') }),
        createMockParticipant({ name: 'Bob', entryDate: new Date('2024-01-15') }),
        createMockParticipant({ name: 'Charlie', entryDate: new Date('2024-02-10') }),
        createMockParticipant({ name: 'Diana', entryDate: new Date('2024-03-01') }) // Duplicate date
      ]

      const dates = getUniqueSortedDates(participants, deedDate)

      expect(dates).toHaveLength(3)
      expect(dates[0]).toEqual(new Date('2024-01-15'))
      expect(dates[1]).toEqual(new Date('2024-02-10'))
      expect(dates[2]).toEqual(new Date('2024-03-01'))
    })

    it('should use deedDate for founders, deedDate + 1 for non-founders without entryDate', () => {
      const participants: Participant[] = [
        createMockParticipant({ name: 'Founder', entryDate: undefined, isFounder: true }),
        createMockParticipant({ name: 'NonFounder', entryDate: undefined, isFounder: false }),
        createMockParticipant({ name: 'Bob', entryDate: new Date('2024-02-01') })
      ]

      const dates = getUniqueSortedDates(participants, deedDate)

      expect(dates).toHaveLength(3)
      // Founder without entryDate uses deedDate (2024-01-15)
      expect(dates[0]).toEqual(new Date('2024-01-15'))
      // Non-founder without entryDate uses deedDate + 1 (2024-01-16)
      expect(dates[1]).toEqual(new Date('2024-01-16'))
      expect(dates[2]).toEqual(new Date('2024-02-01'))
    })

    it('should handle empty participant list', () => {
      const dates = getUniqueSortedDates([], deedDate)
      expect(dates).toHaveLength(0)
    })

    it('should handle all participants with same date', () => {
      const participants: Participant[] = [
        createMockParticipant({ name: 'Alice', entryDate: new Date('2024-01-15') }),
        createMockParticipant({ name: 'Bob', entryDate: new Date('2024-01-15') })
      ]

      const dates = getUniqueSortedDates(participants, deedDate)

      expect(dates).toHaveLength(1)
      expect(dates[0]).toEqual(new Date('2024-01-15'))
    })
  })

  describe('generateCoproSnapshots', () => {
    it('should generate snapshots when copro inventory changes', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder 1',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Founder 2',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Buyer 1',
          surface: 100,
          entryDate: new Date('2024-03-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 150000,
            lotId: 1
          }
        })
      ]

      const calculations = createMockCalculations(3, 300)
      const snapshots = generateCoproSnapshots(participants, calculations, deedDate)

      expect(snapshots.length).toBeGreaterThanOrEqual(2)

      // T0 snapshot
      expect(snapshots[0].date).toEqual(new Date(deedDate))
      expect(snapshots[0].availableLots).toBe(3) // All lots available initially
      expect(snapshots[0].totalSurface).toBe(300)
      expect(snapshots[0].soldThisDate).toHaveLength(0)
      expect(snapshots[0].reserveIncrease).toBe(0)

      // After first copro sale
      const saleSnapshot = snapshots.find(s =>
        s.date.toISOString().split('T')[0] === '2024-03-01'
      )
      expect(saleSnapshot).toBeDefined()
      expect(saleSnapshot!.soldThisDate).toContain('Buyer 1')
      expect(saleSnapshot!.reserveIncrease).toBe(150000 * 0.3) // 30% of sale price
    })

    it('should calculate correct reserve increase for multiple sales on same date', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Buyer 1',
          surface: 50,
          entryDate: new Date('2024-03-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 100000,
            lotId: 1
          }
        }),
        createMockParticipant({
          name: 'Buyer 2',
          surface: 50,
          entryDate: new Date('2024-03-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 120000,
            lotId: 2
          }
        })
      ]

      const calculations = createMockCalculations(2, 100)
      const snapshots = generateCoproSnapshots(participants, calculations, deedDate)

      const saleSnapshot = snapshots.find(s =>
        s.date.toISOString().split('T')[0] === '2024-03-01'
      )

      expect(saleSnapshot).toBeDefined()
      expect(saleSnapshot!.soldThisDate).toHaveLength(2)
      expect(saleSnapshot!.reserveIncrease).toBe((100000 + 120000) * 0.3)
    })

    it('should only create snapshots when inventory changes', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder',
          surface: 100,
          entryDate: undefined,
          isFounder: true,
          lotsOwned: [{
            lotId: 1,
            surface: 100,
            unitId: 1,
            isPortage: false,
            acquiredDate: new Date(deedDate),
            originalPrice: 100000,
            originalNotaryFees: 5000,
            originalConstructionCost: 50000
          }]
        }),
        createMockParticipant({
          name: 'Buyer 1',
          surface: 100,
          entryDate: new Date('2024-03-01'),
          purchaseDetails: {
            buyingFrom: 'Founder', // Portage sale, not copro
            purchasePrice: 150000,
            lotId: 1
          }
        })
      ]

      const calculations = createMockCalculations(2, 200)
      const snapshots = generateCoproSnapshots(participants, calculations, deedDate)

      // Should only have T0 snapshot since portage sales don't affect copro inventory
      expect(snapshots).toHaveLength(1)
      expect(snapshots[0].date).toEqual(new Date(deedDate))
      expect(snapshots[0].soldThisDate).toHaveLength(0)
    })

    it('should show remaining lots AFTER sales on the same date', () => {
      // Scenario: 10 total participants, 5 buy from copro on same date
      // Card should show remaining lots AFTER those 5 bought, not before
      const saleDate = '2024-02-01'
      const participants: Participant[] = [
        // 5 founders
        ...Array.from({ length: 5 }, (_, i) =>
          createMockParticipant({
            name: `Founder ${i + 1}`,
            surface: 100,
            entryDate: undefined,
            isFounder: true
          })
        ),
        // 5 buyers from copro on same date
        ...Array.from({ length: 5 }, (_, i) =>
          createMockParticipant({
            name: `Participant-e ${i + 6}`,
            surface: 100,
            entryDate: new Date(saleDate),
            purchaseDetails: {
              buyingFrom: 'Copropriété',
              purchasePrice: 150000,
              lotId: i + 1
            }
          })
        )
      ]

      const calculations = createMockCalculations(10, 1000) // 10 participants, 1000m² total
      const snapshots = generateCoproSnapshots(participants, calculations, deedDate)

      // Find the sale snapshot
      const saleSnapshot = snapshots.find(s =>
        s.date.toISOString().split('T')[0] === saleDate
      )

      expect(saleSnapshot).toBeDefined()
      // Should show 5 buyers
      expect(saleSnapshot!.soldThisDate).toHaveLength(5)
      
      // CRITICAL: availableLots should be AFTER the 5 sales
      // 10 total - 5 sold = 5 remaining
      expect(saleSnapshot!.availableLots).toBe(5)
      
      // CRITICAL: totalSurface should be AFTER the 5 sales
      // 1000m² total - (5 * 100m²) = 500m² remaining
      expect(saleSnapshot!.totalSurface).toBe(500)

      // Verify T0 snapshot shows all 10 lots available
      const t0Snapshot = snapshots.find(s => s.date.toISOString().split('T')[0] === deedDate)
      expect(t0Snapshot).toBeDefined()
      expect(t0Snapshot!.availableLots).toBe(10)
      expect(t0Snapshot!.totalSurface).toBe(1000)
    })
  })

  describe('determineAffectedParticipants', () => {
    const allParticipants: Participant[] = [
      createMockParticipant({
        name: 'Founder 1',
        entryDate: undefined,
        isFounder: true
      }),
      createMockParticipant({
        name: 'Founder 2',
        entryDate: undefined,
        isFounder: true
      }),
      createMockParticipant({
        name: 'Early Buyer',
        entryDate: new Date('2024-02-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          purchasePrice: 100000,
          lotId: 1
        }
      })
    ]

    it('should return all founders at T0', () => {
      const joiningParticipants = [allParticipants[0], allParticipants[1]]
      const date = new Date(deedDate)

      const affected = determineAffectedParticipants(
        joiningParticipants,
        allParticipants,
        date,
        deedDate,
        true
      )

      expect(affected).toHaveLength(2)
      expect(affected.map(p => p.name)).toContain('Founder 1')
      expect(affected.map(p => p.name)).toContain('Founder 2')
    })

    it('should include newcomer and all active participants for copro sale', () => {
      const newcomer = createMockParticipant({
        name: 'New Buyer',
        entryDate: new Date('2024-03-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          purchasePrice: 150000,
          lotId: 2
        }
      })
      const joiningParticipants = [newcomer]
      const date = new Date('2024-03-01')

      const affected = determineAffectedParticipants(
        joiningParticipants,
        allParticipants,
        date,
        deedDate,
        false
      )

      // Should include: newcomer + all active participants (Founder 1, Founder 2, Early Buyer)
      expect(affected.length).toBeGreaterThanOrEqual(3)
      expect(affected.map(p => p.name)).toContain('New Buyer')
      expect(affected.map(p => p.name)).toContain('Founder 1')
      expect(affected.map(p => p.name)).toContain('Founder 2')
    })

    it('should include only buyer and seller for portage sale', () => {
      const buyer = createMockParticipant({
        name: 'Portage Buyer',
        entryDate: new Date('2024-04-01'),
        purchaseDetails: {
          buyingFrom: 'Founder 1',
          purchasePrice: 200000,
          lotId: 5
        }
      })
      const joiningParticipants = [buyer]
      const date = new Date('2024-04-01')
      const allWithBuyer = [...allParticipants, buyer]

      const affected = determineAffectedParticipants(
        joiningParticipants,
        allWithBuyer,
        date,
        deedDate,
        false
      )

      // Should include buyer and seller only
      expect(affected).toHaveLength(2)
      expect(affected.map(p => p.name)).toContain('Portage Buyer')
      expect(affected.map(p => p.name)).toContain('Founder 1')
    })

    it('should remove duplicate participants', () => {
      // Two newcomers buying from copro on same date
      const newcomer1 = createMockParticipant({
        name: 'Buyer 1',
        entryDate: new Date('2024-03-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          purchasePrice: 100000,
          lotId: 3
        }
      })
      const newcomer2 = createMockParticipant({
        name: 'Buyer 2',
        entryDate: new Date('2024-03-01'),
        purchaseDetails: {
          buyingFrom: 'Copropriété',
          purchasePrice: 120000,
          lotId: 4
        }
      })
      const joiningParticipants = [newcomer1, newcomer2]
      const date = new Date('2024-03-01')

      const affected = determineAffectedParticipants(
        joiningParticipants,
        allParticipants,
        date,
        deedDate,
        false
      )

      // Should not have duplicates (Founder 1 and Founder 2 appear in both "affected" lists)
      const uniqueNames = new Set(affected.map(p => p.name))
      expect(affected.length).toBe(uniqueNames.size)
    })
  })

  describe('generateParticipantSnapshots', () => {
    it('should generate snapshots for founders at T0', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder 1',
          surface: 150,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Founder 2',
          surface: 150,
          entryDate: undefined,
          isFounder: true
        })
      ]

      const calculations = createMockCalculations(2, 300)
      const snapshots = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        DEFAULT_PORTAGE_FORMULA
      )

      expect(snapshots.size).toBe(2)
      expect(snapshots.has('Founder 1')).toBe(true)
      expect(snapshots.has('Founder 2')).toBe(true)

      const founder1Snapshots = snapshots.get('Founder 1')!
      expect(founder1Snapshots).toHaveLength(1)
      expect(founder1Snapshots[0].isT0).toBe(true)
      expect(founder1Snapshots[0].showFinancingDetails).toBe(true)
    })

    it('should create snapshots for buyer and seller in portage sale', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Seller',
          surface: 100,
          entryDate: undefined,
          isFounder: true,
          lotsOwned: [{
            lotId: 1,
            surface: 100,
            unitId: 1,
            isPortage: false,
            acquiredDate: new Date(deedDate),
            originalPrice: 100000,
            originalNotaryFees: 5000,
            originalConstructionCost: 50000
          }]
        }),
        createMockParticipant({
          name: 'Buyer',
          surface: 100,
          entryDate: new Date('2024-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            purchasePrice: 180000,
            lotId: 1
          }
        })
      ]

      const calculations = createMockCalculations(2, 200)
      const snapshots = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        DEFAULT_PORTAGE_FORMULA
      )

      expect(snapshots.has('Seller')).toBe(true)
      expect(snapshots.has('Buyer')).toBe(true)

      const sellerSnapshots = snapshots.get('Seller')!
      expect(sellerSnapshots.length).toBeGreaterThanOrEqual(2) // T0 + sale event

      const buyerSnapshots = snapshots.get('Buyer')!
      expect(buyerSnapshots).toHaveLength(1)
      expect(buyerSnapshots[0].showFinancingDetails).toBe(true) // Buyer shows financing
    })

    it('should create snapshots for all active participants on copro sale', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder 1',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Founder 2',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Copro Buyer',
          surface: 100,
          entryDate: new Date('2024-05-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 150000,
            lotId: 3
          }
        })
      ]

      const calculations = createMockCalculations(3, 300)
      const snapshots = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        DEFAULT_PORTAGE_FORMULA
      )

      expect(snapshots.size).toBe(3)

      // Founders should have redistribution cards
      const founder1Snapshots = snapshots.get('Founder 1')!
      expect(founder1Snapshots.length).toBeGreaterThanOrEqual(2) // T0 + redistribution

      const redistributionSnapshot = founder1Snapshots.find(s => !s.isT0)
      expect(redistributionSnapshot).toBeDefined()
      expect(redistributionSnapshot!.showFinancingDetails).toBe(false) // No financing for redistribution
      expect(redistributionSnapshot!.transaction?.type).toBe('copro_sale')
    })

    it('should hide financing details for portage sellers', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Seller',
          surface: 100,
          entryDate: undefined,
          isFounder: true,
          lotsOwned: [{
            lotId: 1,
            surface: 100,
            unitId: 1,
            isPortage: false,
            acquiredDate: new Date(deedDate),
            originalPrice: 100000,
            originalNotaryFees: 5000,
            originalConstructionCost: 50000
          }]
        }),
        createMockParticipant({
          name: 'Buyer',
          surface: 100,
          entryDate: new Date('2024-06-01'),
          purchaseDetails: {
            buyingFrom: 'Seller',
            purchasePrice: 180000,
            lotId: 1
          }
        })
      ]

      const calculations = createMockCalculations(2, 200)
      const snapshots = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        DEFAULT_PORTAGE_FORMULA
      )

      const sellerSnapshots = snapshots.get('Seller')!
      const saleSnapshot = sellerSnapshots.find(s => !s.isT0)

      expect(saleSnapshot).toBeDefined()
      expect(saleSnapshot!.showFinancingDetails).toBe(false) // Seller doesn't show financing
      expect(saleSnapshot!.transaction?.type).toBe('portage_sale')
    })

    it('should handle empty participant list', () => {
      const calculations = createMockCalculations(0, 0)
      const snapshots = generateParticipantSnapshots(
        [],
        calculations,
        deedDate,
        DEFAULT_PORTAGE_FORMULA
      )

      expect(snapshots.size).toBe(0)
    })

    it('should assign correct colorZone per date', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Buyer 1',
          surface: 50,
          entryDate: new Date('2024-03-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 75000,
            lotId: 1
          }
        }),
        createMockParticipant({
          name: 'Buyer 2',
          surface: 50,
          entryDate: new Date('2024-06-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 80000,
            lotId: 2
          }
        })
      ]

      const calculations = createMockCalculations(3, 200)
      const snapshots = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        DEFAULT_PORTAGE_FORMULA
      )

      const founderSnapshots = snapshots.get('Founder')!
      expect(founderSnapshots).toHaveLength(3) // T0 + 2 redistribution events

      expect(founderSnapshots[0].colorZone).toBe(0) // T0
      expect(founderSnapshots[1].colorZone).toBe(1) // March event
      expect(founderSnapshots[2].colorZone).toBe(2) // June event
    })

    it('should respect coproReservesShare in transaction delta calculations', () => {
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder 1',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Founder 2',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Copro Buyer',
          surface: 100,
          entryDate: new Date('2024-05-01'),
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 100000,
            lotId: 3
          }
        })
      ]

      const calculations = createMockCalculations(3, 300)

      // Test with default 30% to reserves (70% to participants)
      const snapshotsDefault = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        { ...DEFAULT_PORTAGE_FORMULA, coproReservesShare: 30 }
      )

      const founder1Snapshots = snapshotsDefault.get('Founder 1')!
      const redistributionSnapshot = founder1Snapshots.find(s => !s.isT0)
      expect(redistributionSnapshot).toBeDefined()
      expect(redistributionSnapshot!.transaction).toBeDefined()

      // With 30% to reserves, 70% goes to participants
      // Two founders with equal surface, so each gets 35% of purchase price
      // Delta is negative (cash received)
      expect(redistributionSnapshot!.transaction!.delta.totalCost).toBe(-35000)

      // Test with 60% to reserves (40% to participants)
      const snapshotsCustom = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        { ...DEFAULT_PORTAGE_FORMULA, coproReservesShare: 60 }
      )

      const founder1SnapshotsCustom = snapshotsCustom.get('Founder 1')!
      const redistributionSnapshotCustom = founder1SnapshotsCustom.find(s => !s.isT0)
      expect(redistributionSnapshotCustom).toBeDefined()
      expect(redistributionSnapshotCustom!.transaction).toBeDefined()

      // With 60% to reserves, 40% goes to participants
      // Two founders with equal surface, so each gets 20% of purchase price
      expect(redistributionSnapshotCustom!.transaction!.delta.totalCost).toBe(-20000)
    })

    it('should aggregate multiple copro sales on same date into single transaction with total', () => {
      const sameDate = new Date('2024-06-01')
      const participants: Participant[] = [
        createMockParticipant({
          name: 'Founder 1',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Founder 2',
          surface: 100,
          entryDate: undefined,
          isFounder: true
        }),
        createMockParticipant({
          name: 'Copro Buyer 1',
          surface: 50,
          entryDate: sameDate,
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 100000, // First sale: 100k
            lotId: 1
          }
        }),
        createMockParticipant({
          name: 'Copro Buyer 2',
          surface: 50,
          entryDate: sameDate, // Same date!
          purchaseDetails: {
            buyingFrom: 'Copropriété',
            purchasePrice: 150000, // Second sale: 150k
            lotId: 2
          }
        })
      ]

      const calculations = createMockCalculations(4, 300)
      const snapshots = generateParticipantSnapshots(
        participants,
        calculations,
        deedDate,
        { ...DEFAULT_PORTAGE_FORMULA, coproReservesShare: 30 }
      )

      const founder1Snapshots = snapshots.get('Founder 1')!
      expect(founder1Snapshots).toHaveLength(2) // T0 + aggregated redistribution

      const redistributionSnapshot = founder1Snapshots.find(s => !s.isT0)
      expect(redistributionSnapshot).toBeDefined()
      expect(redistributionSnapshot!.transaction).toBeDefined()

      // With 30% to reserves, 70% goes to participants
      // Two founders with equal surface (100m² each), so each gets 50% of participants' share
      // First sale: 100k * 0.7 * 0.5 = 35k per founder
      // Second sale: 150k * 0.7 * 0.5 = 52.5k per founder
      // Total: 35k + 52.5k = 87.5k per founder
      const expectedTotal = (100000 * 0.7 * 0.5) + (150000 * 0.7 * 0.5)
      expect(redistributionSnapshot!.transaction!.delta.totalCost).toBeCloseTo(-expectedTotal, 2)

      // Reason should indicate multiple buyers or show total
      const reason = redistributionSnapshot!.transaction!.delta.reason
      expect(reason).toContain('copro sale')
      // Should mention both buyers or indicate it's a total
      expect(reason).toMatch(/Copro Buyer|total|multiple/i)
    })
  })
})
