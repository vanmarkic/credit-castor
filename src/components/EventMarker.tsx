import { useState } from 'react';
import { ArrowDown, UserPlus, Eye, Info } from 'lucide-react';
import type { DomainEvent, NewcomerJoinsEvent, HiddenLotRevealedEvent } from '../types/timeline';

interface EventMarkerProps {
  event: DomainEvent;
}

export default function EventMarker({ event }: EventMarkerProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getEventIcon = () => {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        return <Home className="w-5 h-5" />;
      case 'NEWCOMER_JOINS':
        return <UserPlus className="w-5 h-5" />;
      case 'HIDDEN_LOT_REVEALED':
        return <Eye className="w-5 h-5" />;
      case 'PORTAGE_SETTLEMENT':
        return <ArrowDown className="w-5 h-5" />;
      case 'COPRO_TAKES_LOAN':
        return <DollarSign className="w-5 h-5" />;
      case 'PARTICIPANT_EXITS':
        return <UserMinus className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        return 'blue';
      case 'NEWCOMER_JOINS':
        return 'green';
      case 'HIDDEN_LOT_REVEALED':
        return 'purple';
      case 'PORTAGE_SETTLEMENT':
        return 'orange';
      case 'COPRO_TAKES_LOAN':
        return 'red';
      case 'PARTICIPANT_EXITS':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getEventTitle = () => {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        return 'Initial Purchase';
      case 'NEWCOMER_JOINS':
        return 'Newcomer Joins';
      case 'HIDDEN_LOT_REVEALED':
        return 'Hidden Lot Revealed';
      case 'PORTAGE_SETTLEMENT':
        return 'Portage Settlement';
      case 'COPRO_TAKES_LOAN':
        return 'Copropriété Takes Loan';
      case 'PARTICIPANT_EXITS':
        return 'Participant Exits';
      default:
        return 'Unknown Event';
    }
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const renderEventDetails = () => {
    switch (event.type) {
      case 'NEWCOMER_JOINS': {
        const e = event as NewcomerJoinsEvent;
        return (
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-900">{e.buyer.name} joined the project</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Purchased from</div>
                <div className="font-medium text-gray-900">{e.acquisition.from}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Lot</div>
                <div className="font-medium text-gray-900">#{e.acquisition.lotId}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Purchase Price</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(e.acquisition.purchasePrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Notary Fees</div>
                <div className="font-medium text-gray-900">{formatCurrency(e.notaryFees)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Surface</div>
                <div className="font-medium text-gray-900">{e.buyer.surface} m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Capital Brought</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(e.financing.capitalApporte)}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 font-medium mb-2">Price Breakdown</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price:</span>
                  <span>{formatCurrency(e.acquisition.breakdown.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Indexation:</span>
                  <span>{formatCurrency(e.acquisition.breakdown.indexation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrying Cost Recovery:</span>
                  <span>{formatCurrency(e.acquisition.breakdown.carryingCostRecovery)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fees Recovery:</span>
                  <span>{formatCurrency(e.acquisition.breakdown.feesRecovery)}</span>
                </div>
                {e.acquisition.breakdown.renovations > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Renovations:</span>
                    <span>{formatCurrency(e.acquisition.breakdown.renovations)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'HIDDEN_LOT_REVEALED': {
        const e = event as HiddenLotRevealedEvent;
        return (
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-900">
              Hidden lot #{e.lotId} sold to {e.buyer.name}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Sale Price</div>
                <div className="font-medium text-gray-900">{formatCurrency(e.salePrice)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Notary Fees</div>
                <div className="font-medium text-gray-900">{formatCurrency(e.notaryFees)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Buyer Surface</div>
                <div className="font-medium text-gray-900">{e.buyer.surface} m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Capital Brought</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(e.buyer.capitalApporte)}
                </div>
              </div>
            </div>

            {/* Redistribution */}
            {Object.keys(e.redistribution).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-2">
                  Proceeds Redistributed
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(e.redistribution).map(([name, dist]) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-gray-600">
                        {name} ({(dist.quotite * 100).toFixed(1)}%):
                      </span>
                      <span className="font-medium">{formatCurrency(dist.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="text-sm text-gray-600">
            Event details not implemented for {event.type}
          </div>
        );
    }
  };

  const color = getEventColor();
  const colorClasses = {
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
  }[color];

  return (
    <div className="flex items-start gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="w-px h-4 bg-gray-300" />
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${colorClasses.icon}`}
        >
          {getEventIcon()}
        </div>
        <div className="w-px h-4 bg-gray-300" />
      </div>

      {/* Event card */}
      <div className="flex-1">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`
            w-full text-left border-2 rounded-lg p-3 transition-all
            ${colorClasses.border} ${colorClasses.bg} ${colorClasses.hover}
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-semibold ${colorClasses.text}`}>{getEventTitle()}</div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(event.date).toLocaleString()}
              </div>
            </div>
            <Info
              className={`w-4 h-4 ${colorClasses.text} ${
                showDetails ? 'rotate-180' : ''
              } transition-transform`}
            />
          </div>
        </button>

        {/* Expanded details */}
        {showDetails && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4 animate-fadeIn">
            {renderEventDetails()}
          </div>
        )}
      </div>
    </div>
  );
}

// Missing icon imports placeholders
function Home({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function DollarSign({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UserMinus({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
      />
    </svg>
  );
}
