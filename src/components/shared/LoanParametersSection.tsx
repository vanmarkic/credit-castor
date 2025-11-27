import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';
import type { TwoLoanValidationErrors } from '../../utils/twoLoanValidation';
import { TwoLoanFinancingSection } from './TwoLoanFinancingSection';

interface LoanParametersSectionProps {
  participant: Participant;
  participantCalc: ParticipantCalculation;
  participantIndex: number;
  validationErrors: TwoLoanValidationErrors;
  onUpdateNotaryRate: (rate: number) => void;
  onUpdateInterestRate: (rate: number) => void;
  onUpdateDuration: (years: number) => void;
  onUpdateParticipant: (updated: Participant) => void;
  defaultExpanded?: boolean;
}

export function LoanParametersSection({
  participant,
  participantCalc: p,
  participantIndex: idx,
  validationErrors,
  onUpdateNotaryRate,
  onUpdateInterestRate,
  onUpdateDuration,
  onUpdateParticipant,
  defaultExpanded = false,
}: LoanParametersSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const useTwoLoans = participant.useTwoLoans ?? false;
  const summaryText = useTwoLoans
    ? `${p.interestRate}% · ${p.durationYears}ans · 2 prêts`
    : `${p.interestRate}% · ${p.durationYears}ans`;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>🏦</span>
          <span className="font-medium text-gray-700">Paramètres du prêt</span>
          <span className="text-sm text-gray-500">({summaryText})</span>
        </div>
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200 space-y-4">
          {/* Basic loan parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Registration fees */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Frais d'enregistrement
              </label>
              <div className="flex items-center gap-2 mb-1">
                <label
                  className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: p.registrationFeesRate === 3 ? '#9ca3af' : '#e5e7eb',
                    backgroundColor: p.registrationFeesRate === 3 ? '#f3f4f6' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name={`notaryRate-${idx}`}
                    value="3"
                    checked={p.registrationFeesRate === 3}
                    onChange={(e) => onUpdateNotaryRate(parseFloat(e.target.value))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-700 text-sm">3%</span>
                </label>
                <label
                  className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border rounded-lg transition-colors hover:bg-gray-100"
                  style={{
                    borderColor: p.registrationFeesRate === 12.5 ? '#9ca3af' : '#e5e7eb',
                    backgroundColor: p.registrationFeesRate === 12.5 ? '#f3f4f6' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name={`notaryRate-${idx}`}
                    value="12.5"
                    checked={p.registrationFeesRate === 12.5}
                    onChange={(e) => onUpdateNotaryRate(parseFloat(e.target.value))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-700 text-sm">12.5%</span>
                </label>
              </div>
              <div className="text-sm text-gray-600">= {formatCurrency(p.droitEnregistrements)}</div>
            </div>

            {/* Interest rate */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Taux d'intérêt (%)</label>
              <input
                type="number"
                step="0.1"
                value={p.interestRate}
                onChange={(e) => onUpdateInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Durée (années)</label>
              <input
                type="number"
                value={p.durationYears}
                onChange={(e) => onUpdateDuration(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Two-Loan configuration */}
          <TwoLoanFinancingSection
            participant={participant}
            participantCalc={p}
            personalRenovationCost={p.personalRenovationCost || 0}
            validationErrors={validationErrors}
            onUpdateParticipant={onUpdateParticipant}
          />
        </div>
      )}
    </div>
  );
}
