import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import * as Tooltip from '@radix-ui/react-tooltip';
import { FormulaTooltip } from './FormulaTooltip';

describe('FormulaTooltip', () => {
  const formula = ['Total = Base + Fees', '€100,000 = €90,000 + €10,000', 'Tax rate: 12.5%'];

  // Ensure cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it('renders children correctly', () => {
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={formula}>€100,000</FormulaTooltip>
      </Tooltip.Provider>
    );
    expect(screen.getByText('€100,000')).toBeInTheDocument();
  });

  it('renders Info icon', () => {
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={formula}>€100,000</FormulaTooltip>
      </Tooltip.Provider>
    );
    // Info icon from lucide-react renders as an SVG
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('w-3', 'h-3', 'text-gray-400');
  });

  it('renders formula lines in tooltip content when hovered', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={formula}>€100,000</FormulaTooltip>
      </Tooltip.Provider>
    );

    // Hover over the trigger to open the tooltip
    const trigger = screen.getByText('€100,000').closest('span');
    expect(trigger).toBeInTheDocument();
    await user.hover(trigger!);

    // Wait for tooltip to appear and check all formula lines are rendered
    await waitFor(() => {
      const lines = screen.getAllByText('Total = Base + Fees');
      // Should find at least one visible tooltip content
      expect(lines.length).toBeGreaterThan(0);
    });

    // Check all formula lines exist
    expect(screen.getAllByText('€100,000 = €90,000 + €10,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tax rate: 12.5%').length).toBeGreaterThan(0);
  });

  it('first line has bold styling when tooltip is open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={formula}>€100,000</FormulaTooltip>
      </Tooltip.Provider>
    );

    const trigger = screen.getByText('€100,000').closest('span');
    await user.hover(trigger!);

    await waitFor(() => {
      const firstLines = screen.getAllByText('Total = Base + Fees');
      // Find the visible one (in the portal content)
      const visibleLine = firstLines.find(el => el.className.includes('font-semibold'));
      expect(visibleLine).toHaveClass('font-semibold', 'mb-1');
    });
  });

  it('subsequent lines do not have bold styling when tooltip is open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={formula}>€100,000</FormulaTooltip>
      </Tooltip.Provider>
    );

    const trigger = screen.getByText('€100,000').closest('span');
    await user.hover(trigger!);

    await waitFor(() => {
      const secondLines = screen.getAllByText('€100,000 = €90,000 + €10,000');
      expect(secondLines.length).toBeGreaterThan(0);
    });

    // Get all instances and check the visible one in content
    const secondLines = screen.getAllByText('€100,000 = €90,000 + €10,000');
    const thirdLines = screen.getAllByText('Tax rate: 12.5%');

    // Find the div elements (in content, not in screen reader span)
    const secondLine = secondLines.find(el => el.tagName === 'DIV');
    const thirdLine = thirdLines.find(el => el.tagName === 'DIV');

    expect(secondLine).not.toHaveClass('font-semibold');
    expect(secondLine).not.toHaveClass('mb-1');
    expect(thirdLine).not.toHaveClass('font-semibold');
    expect(thirdLine).not.toHaveClass('mb-1');
  });

  it('renders with single line formula when tooltip is open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={['Simple formula']}>€50,000</FormulaTooltip>
      </Tooltip.Provider>
    );

    const trigger = screen.getByText('€50,000').closest('span');
    await user.hover(trigger!);

    await waitFor(() => {
      const lines = screen.getAllByText('Simple formula');
      const visibleLine = lines.find(el => el.className.includes('font-semibold'));
      expect(visibleLine).toBeInTheDocument();
      expect(visibleLine).toHaveClass('font-semibold', 'mb-1');
    });
  });

  it('renders empty formula array', () => {
    render(
      <Tooltip.Provider>
        <FormulaTooltip formula={[]}>€0</FormulaTooltip>
      </Tooltip.Provider>
    );

    expect(screen.getByText('€0')).toBeInTheDocument();
  });
});
