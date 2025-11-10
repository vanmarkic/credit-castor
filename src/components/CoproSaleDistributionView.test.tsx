/**
 * CoproSaleDistributionView Tests
 *
 * Tests copro sale distribution display with RTL and jsdom
 * Verifies correct amounts appear where they should
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import CoproSaleDistributionView from './CoproSaleDistributionView';
import type { CoproSale } from '../stateMachine/types';

describe('CoproSaleDistributionView', () => {
  // Test data: €115,000 sale with 2 founders
  const mockCoproSale: CoproSale = {
    type: 'copro',
    lotId: 'copro-lot-1',
    buyer: 'New Buyer',
    saleDate: new Date('2027-06-01'),
    surface: 50, // 50m² purchased
    pricing: {
      // Old format (backward compatibility)
      baseCostPerSqm: 2000,
      gen1CompensationPerSqm: 0,
      pricePerSqm: 2300,
      surface: 50,
      totalPrice: 115000,

      // New format with distribution
      breakdown: {
        basePrice: 100000,
        indexation: 5000,
        carryingCostRecovery: 10000
      },
      distribution: {
        toCoproReserves: 34500,    // 30% of 115000
        toParticipants: new Map([
          ['Alice', 32200],         // 40% quotité (80m² / 200m²)
          ['Bob', 48300]            // 60% quotité (120m² / 200m²)
        ])
      }
    }
  };

  it('should display the sale header with buyer name and date', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    expect(screen.getByText(/Copropriété Sale to New Buyer/i)).toBeInTheDocument();
    expect(screen.getByText(/01 Jun 2027/i)).toBeInTheDocument();
    expect(screen.getByText(/50m² purchased/i)).toBeInTheDocument();
  });

  it('should display the total price prominently', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    // Should show €115,000 formatted (multiple times is ok - header and breakdown)
    const prices = screen.getAllByText('€115,000');
    expect(prices.length).toBeGreaterThan(0);

    // Should have the main prominently displayed price
    const mainPrice = prices.find(el => el.classList.contains('text-2xl'));
    expect(mainPrice).toBeDefined();
  });

  it('should display pricing formula breakdown with correct amounts', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    // Base price
    const basePrice = screen.getByTestId('base-price');
    expect(basePrice).toHaveTextContent('€100,000');

    // Indexation
    const indexation = screen.getByTestId('indexation');
    expect(indexation).toHaveTextContent('€5,000');

    // Carrying costs
    const carryingCosts = screen.getByTestId('carrying-costs');
    expect(carryingCosts).toHaveTextContent('€10,000');
  });

  it('should display 30% copropriété reserves amount correctly', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    const coproReserves = screen.getByTestId('copro-reserves-amount');
    expect(coproReserves).toHaveTextContent('€34,500');

    // Should be in blue styling
    expect(coproReserves).toHaveClass('text-blue-700');

    // Should have descriptive text
    expect(screen.getByText(/Copropriété Reserves \(30%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reinvested in collective assets/i)).toBeInTheDocument();
  });

  it('should display 70% founders total amount correctly', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    const foundersTotal = screen.getByTestId('founders-total-amount');
    expect(foundersTotal).toHaveTextContent('€80,500');

    // Should be in green styling
    expect(foundersTotal).toHaveClass('text-green-700');

    // Should have descriptive text
    expect(screen.getByText(/Founders Distribution \(70%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Split by quotité/i)).toBeInTheDocument();
  });

  it('should display Alice distribution with correct amount and quotité', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    const aliceRow = screen.getByTestId('founder-distribution-alice');

    // Should show founder name
    expect(within(aliceRow).getByText('Alice')).toBeInTheDocument();

    // Should show quotité: 40% (32200 / 80500 = 40%)
    expect(within(aliceRow).getByText('40.0%')).toBeInTheDocument();

    // Should show amount received
    const aliceAmount = screen.getByTestId('amount-alice');
    expect(aliceAmount).toHaveTextContent('€32,200');
    expect(aliceAmount).toHaveClass('text-green-600'); // Cash received styling
  });

  it('should display Bob distribution with correct amount and quotité', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    const bobRow = screen.getByTestId('founder-distribution-bob');

    // Should show founder name
    expect(within(bobRow).getByText('Bob')).toBeInTheDocument();

    // Should show quotité: 60% (48300 / 80500 = 60%)
    expect(within(bobRow).getByText('60.0%')).toBeInTheDocument();

    // Should show amount received
    const bobAmount = screen.getByTestId('amount-bob');
    expect(bobAmount).toHaveTextContent('€48,300');
    expect(bobAmount).toHaveClass('text-green-600'); // Cash received styling
  });

  it('should verify founder distributions sum to 70% of total', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    // Alice: €32,200 + Bob: €48,300 = €80,500 (70% of €115,000)
    const aliceAmount = screen.getByTestId('amount-alice');
    const bobAmount = screen.getByTestId('amount-bob');

    // Extract numbers from formatted text
    const aliceValue = parseInt(aliceAmount.textContent?.replace(/[€,]/g, '') || '0');
    const bobValue = parseInt(bobAmount.textContent?.replace(/[€,]/g, '') || '0');

    expect(aliceValue + bobValue).toBe(80500);
  });

  it('should display table footer with 100% total and correct sum', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    // Find the table
    const table = screen.getByRole('table');

    // Footer should show 100% and total amount
    expect(within(table).getByText('100.0%')).toBeInTheDocument();
    expect(within(table).getByText('€80,500')).toBeInTheDocument();
  });

  it('should display explanatory note about frozen T0 quotité', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    expect(screen.getByText(/frozen T0 quotité/i)).toBeInTheDocument();
    expect(screen.getByText(/Each founder receives cash that reduces their net position/i)).toBeInTheDocument();
  });

  it('should handle single founder distribution correctly', () => {
    const singleFounderSale: CoproSale = {
      ...mockCoproSale,
      pricing: {
        ...mockCoproSale.pricing,
        distribution: {
          toCoproReserves: 34500,
          toParticipants: new Map([
            ['Solo Founder', 80500] // Gets all 70%
          ])
        }
      }
    };

    render(<CoproSaleDistributionView sale={singleFounderSale} />);

    const soloRow = screen.getByTestId('founder-distribution-solo-founder');

    // Should show 100% quotité
    expect(within(soloRow).getByText('100.0%')).toBeInTheDocument();

    // Should show full 70% amount
    const soloAmount = screen.getByTestId('amount-solo-founder');
    expect(soloAmount).toHaveTextContent('€80,500');
  });

  it('should handle three founders with unequal quotités', () => {
    const threeFounderSale: CoproSale = {
      ...mockCoproSale,
      pricing: {
        ...mockCoproSale.pricing,
        distribution: {
          toCoproReserves: 34500,
          toParticipants: new Map([
            ['Founder A', 12075],    // 15% quotité (30m² / 200m²)
            ['Founder B', 28175],    // 35% quotité (70m² / 200m²)
            ['Founder C', 40250]     // 50% quotité (100m² / 200m²)
          ])
        }
      }
    };

    render(<CoproSaleDistributionView sale={threeFounderSale} />);

    // Verify all three founders appear
    expect(screen.getByTestId('founder-distribution-founder-a')).toBeInTheDocument();
    expect(screen.getByTestId('founder-distribution-founder-b')).toBeInTheDocument();
    expect(screen.getByTestId('founder-distribution-founder-c')).toBeInTheDocument();

    // Verify quotités
    expect(screen.getByTestId('founder-distribution-founder-a')).toHaveTextContent('15.0%');
    expect(screen.getByTestId('founder-distribution-founder-b')).toHaveTextContent('35.0%');
    expect(screen.getByTestId('founder-distribution-founder-c')).toHaveTextContent('50.0%');

    // Verify amounts
    expect(screen.getByTestId('amount-founder-a')).toHaveTextContent('€12,075');
    expect(screen.getByTestId('amount-founder-b')).toHaveTextContent('€28,175');
    expect(screen.getByTestId('amount-founder-c')).toHaveTextContent('€40,250');
  });

  it('should fall back to old format when distribution is missing', () => {
    const oldFormatSale: CoproSale = {
      ...mockCoproSale,
      pricing: {
        baseCostPerSqm: 2000,
        gen1CompensationPerSqm: 200,
        pricePerSqm: 2300,
        surface: 50,
        totalPrice: 115000
        // No breakdown or distribution fields
      }
    };

    render(<CoproSaleDistributionView sale={oldFormatSale} />);

    // Should still show basic info
    expect(screen.getByText(/Copropriété Sale to New Buyer/i)).toBeInTheDocument();
    expect(screen.getByText('€115,000')).toBeInTheDocument();

    // Should NOT show distribution details
    expect(screen.queryByTestId('copro-reserves-amount')).not.toBeInTheDocument();
    expect(screen.queryByTestId('founders-total-amount')).not.toBeInTheDocument();
  });

  it('should use data-testid for easy querying', () => {
    render(<CoproSaleDistributionView sale={mockCoproSale} />);

    // Main container
    expect(screen.getByTestId('copro-sale-distribution')).toBeInTheDocument();

    // Pricing breakdown
    expect(screen.getByTestId('base-price')).toBeInTheDocument();
    expect(screen.getByTestId('indexation')).toBeInTheDocument();
    expect(screen.getByTestId('carrying-costs')).toBeInTheDocument();

    // Distribution
    expect(screen.getByTestId('copro-reserves-amount')).toBeInTheDocument();
    expect(screen.getByTestId('founders-total-amount')).toBeInTheDocument();

    // Individual founders
    expect(screen.getByTestId('founder-distribution-alice')).toBeInTheDocument();
    expect(screen.getByTestId('amount-alice')).toBeInTheDocument();
  });

  it('should format large numbers with thousand separators', () => {
    const largeSale: CoproSale = {
      ...mockCoproSale,
      pricing: {
        ...mockCoproSale.pricing,
        totalPrice: 1500000, // €1.5M
        breakdown: {
          basePrice: 1200000,
          indexation: 150000,
          carryingCostRecovery: 150000
        },
        distribution: {
          toCoproReserves: 450000,    // 30%
          toParticipants: new Map([
            ['Alice', 420000],
            ['Bob', 630000]
          ])
        }
      }
    };

    render(<CoproSaleDistributionView sale={largeSale} />);

    // Should have commas for readability
    expect(screen.getByTestId('base-price')).toHaveTextContent('€1,200,000');
    expect(screen.getByTestId('copro-reserves-amount')).toHaveTextContent('€450,000');
    expect(screen.getByTestId('amount-alice')).toHaveTextContent('€420,000');
  });
});
