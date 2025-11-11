import { ArrowDown, UserPlus, Eye } from 'lucide-react';
import { Home, DollarSign, UserMinus } from './icons';

/**
 * Event configuration mapping
 * Centralizes icon, color, and title for each event type
 */
export const EVENT_CONFIG = {
  INITIAL_PURCHASE: {
    icon: Home,
    color: 'blue' as const,
    title: 'Initial Purchase'
  },
  NEWCOMER_JOINS: {
    icon: UserPlus,
    color: 'green' as const,
    title: 'Newcomer Joins'
  },
  HIDDEN_LOT_REVEALED: {
    icon: Eye,
    color: 'purple' as const,
    title: 'Hidden Lot Revealed'
  },
  PORTAGE_SETTLEMENT: {
    icon: ArrowDown,
    color: 'orange' as const,
    title: 'Portage Settlement'
  },
  COPRO_TAKES_LOAN: {
    icon: DollarSign,
    color: 'red' as const,
    title: 'Copropriété Takes Loan'
  },
  PARTICIPANT_EXITS: {
    icon: UserMinus,
    color: 'gray' as const,
    title: 'Participant Exits'
  }
} as const;

export type EventType = keyof typeof EVENT_CONFIG;
export type EventColor = typeof EVENT_CONFIG[EventType]['color'];

/**
 * Color classes for event styling
 */
export const COLOR_CLASSES: Record<EventColor, {
  border: string;
  bg: string;
  text: string;
  icon: string;
  hover: string;
}> = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: 'bg-blue-500 text-white',
    hover: 'hover:bg-blue-50'
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: 'bg-green-500 text-white',
    hover: 'hover:bg-green-50'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: 'bg-purple-500 text-white',
    hover: 'hover:bg-purple-50'
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: 'bg-orange-500 text-white',
    hover: 'hover:bg-orange-50'
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: 'bg-red-500 text-white',
    hover: 'hover:bg-red-50'
  },
  gray: {
    border: 'border-gray-500',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: 'bg-gray-500 text-white',
    hover: 'hover:bg-gray-50'
  }
};
