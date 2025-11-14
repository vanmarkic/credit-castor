import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ParticipantsTimeline } from './ParticipantsTimeline';
import type { Participant } from '../../utils/calculatorUtils';

// Mock the useProjectParamPermissions hook
vi.mock('../../hooks/useFieldPermissions', () => ({
  useProjectParamPermissions: () => ({
    canEdit: true,
    isLocked: false,
    lockReason: undefined,
  }),
}));

describe('ParticipantsTimeline', () => {
  const mockParticipants: Participant[] = [
    {
      name: 'Founder 1',
      unitId: 1,
      surface: 50,
      isFounder: true,
      entryDate: '2024-01-01',
      enabled: true,
    },
    {
      name: 'Newcomer 1',
      unitId: 2,
      surface: 60,
      isFounder: false,
      entryDate: '2024-06-01',
      enabled: true,
    },
  ];

  const defaultProps = {
    participants: mockParticipants,
    deedDate: '2024-01-01',
    renovationStartDate: '2024-03-15',
    onDeedDateChange: vi.fn(),
    onRenovationStartDateChange: vi.fn(),
    onUpdateParticipant: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeline with participants', () => {
    render(<ParticipantsTimeline {...defaultProps} />);
    
    expect(screen.getByText('📅 Timeline des Participants')).toBeInTheDocument();
    expect(screen.getByText('Founder 1')).toBeInTheDocument();
    expect(screen.getByText('Newcomer 1')).toBeInTheDocument();
  });

  it('displays renovation start date card when onRenovationStartDateChange is provided', () => {
    render(<ParticipantsTimeline {...defaultProps} />);
    
    expect(screen.getByText('Début des rénovations')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-03-15')).toBeInTheDocument();
  });

  it('does not display renovation start date card when onRenovationStartDateChange is not provided', () => {
    const { onRenovationStartDateChange, ...propsWithoutCallback } = defaultProps;
    render(<ParticipantsTimeline {...propsWithoutCallback} />);
    
    expect(screen.queryByText('Début des rénovations')).not.toBeInTheDocument();
  });

  describe('timeline dot for renovation start date', () => {
    it('displays orange dot on timeline line when renovation date is set', async () => {
      const { container } = render(<ParticipantsTimeline {...defaultProps} />);
      
      // Wait for the card to be positioned and dot to appear
      await waitFor(() => {
        const dot = container.querySelector('.bg-orange-500.border-orange-200');
        expect(dot).toBeInTheDocument();
      });
    });

    it('dot has correct styling (orange color)', async () => {
      const { container } = render(<ParticipantsTimeline {...defaultProps} />);
      
      await waitFor(() => {
        const dot = container.querySelector('.bg-orange-500.border-orange-200');
        expect(dot).toHaveClass('bg-orange-500');
        expect(dot).toHaveClass('border-orange-200');
        expect(dot).toHaveClass('rounded-full');
        expect(dot).toHaveClass('w-5');
        expect(dot).toHaveClass('h-5');
      });
    });

    it('dot is positioned on the timeline line (left-6)', async () => {
      const { container } = render(<ParticipantsTimeline {...defaultProps} />);
      
      await waitFor(() => {
        const dot = container.querySelector('.bg-orange-500.border-orange-200');
        expect(dot).toHaveClass('absolute');
        expect(dot).toHaveClass('left-6');
      });
    });

    it('dot has z-index higher than timeline entries', async () => {
      const { container } = render(<ParticipantsTimeline {...defaultProps} />);
      
      await waitFor(() => {
        const dot = container.querySelector('.bg-orange-500.border-orange-200');
        expect(dot).toHaveClass('z-30');
      });
    });

    it('dot has tooltip with renovation date', async () => {
      const { container } = render(<ParticipantsTimeline {...defaultProps} />);
      
      await waitFor(() => {
        const dot = container.querySelector('.bg-orange-500.border-orange-200') as HTMLElement;
        expect(dot).toBeInTheDocument();
        expect(dot.title).toContain('Début des rénovations');
        // Date is formatted in French locale (e.g., "15/03/2024"), so check for the formatted version
        expect(dot.title).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Matches DD/MM/YYYY format
      });
    });

    it('dot does not appear when renovation date callback is not provided', () => {
      const { onRenovationStartDateChange, ...propsWithoutCallback } = defaultProps;
      const { container } = render(<ParticipantsTimeline {...propsWithoutCallback} />);
      
      const dot = container.querySelector('.bg-orange-500.border-orange-200');
      expect(dot).not.toBeInTheDocument();
    });
  });

  describe('dynamic spacing', () => {
    it('applies transition classes to timeline entries', () => {
      const { container } = render(<ParticipantsTimeline {...defaultProps} />);
      
      const entries = container.querySelectorAll('.relative.pl-20');
      entries.forEach(entry => {
        expect(entry).toHaveClass('transition-all');
        expect(entry).toHaveClass('duration-300');
        expect(entry).toHaveClass('ease-in-out');
      });
    });
  });
});

