import type { Participant, ParticipantCalculation } from '../../utils/calculatorUtils';

interface TwoLoanFinancingSectionProps {
  participant: Participant;
  participantCalc?: ParticipantCalculation;
  personalRenovationCost: number;
  validationErrors: {
    loanDelay?: string;
    renovationAmount?: string;
    capitalAllocation?: string;
  };
  onUpdateParticipant: (updated: Participant) => void;
}

/**
 * Two-loan financing configuration section
 * Allows participants to split their financing into two loans with different timings
 */
export function TwoLoanFinancingSection({
  participant,
  participantCalc,
  personalRenovationCost,
  validationErrors,
  onUpdateParticipant
}: TwoLoanFinancingSectionProps) {
  // Domain calculations: constraints and remaining amounts
  const capitalForLoan1 = participant.capitalForLoan1 || 0;
  const capitalForLoan2 = participant.capitalForLoan2 || 0;
  const totalCapitalAllocated = capitalForLoan1 + capitalForLoan2;
  const remainingCapital = (participant.capitalApporte || 0) - totalCapitalAllocated;
  
  const loan2RenovationAmount = participant.loan2RenovationAmount || 0;
  const loan1RenovationAmount = Math.max(0, personalRenovationCost - loan2RenovationAmount);
  const remainingRenovation = personalRenovationCost - loan2RenovationAmount;
  
  const loan2DelayYears = participant.loan2DelayYears ?? 2;
  const loan2DurationYears = (participant.durationYears || 0) - loan2DelayYears;

  // Calculated loan values (if available)
  const loan1Amount = participantCalc?.loan1Amount;
  const loan2Amount = participantCalc?.loan2Amount;
  const loan1MonthlyPayment = participantCalc?.loan1MonthlyPayment;
  const loan2MonthlyPayment = participantCalc?.loan2MonthlyPayment;

  return (
    <div className="border-t pt-4 mt-4">
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={participant.useTwoLoans || false}
          onChange={(e) => {
            onUpdateParticipant({ ...participant, useTwoLoans: e.target.checked });
          }}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <span className="font-semibold text-sm">Financement en deux prêts</span>
      </label>

      {participant.useTwoLoans && (
        <div className="ml-6 mt-3 space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
          {/* Section 1: Loan Timing - Principle: Common Region (grouped by domain concept) */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Calendrier des prêts
              </label>
              {loan2DurationYears > 0 && (
                <span className="text-xs text-gray-500">
                  Durée prêt 2: <span className="font-semibold text-blue-700">{loan2DurationYears} ans</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Prêt 2 commence après (années)</label>
                <input
                  type="number"
                  value={loan2DelayYears}
                  onChange={(e) => {
                    onUpdateParticipant({ ...participant, loan2DelayYears: parseFloat(e.target.value) || 2 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  min="1"
                  step="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">Durée totale: {participant.durationYears || 0} ans</p>
              </div>
              {loan2DurationYears > 0 && (
                <div className="flex items-end">
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">Durée prêt 2 calculée</p>
                    <p className="text-sm font-semibold text-blue-700">{loan2DurationYears} ans</p>
                  </div>
                </div>
              )}
            </div>
            {validationErrors.loanDelay && (
              <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded border border-red-200">
                ⚠️ {validationErrors.loanDelay}
              </div>
            )}
          </div>

          {/* Section 2: Renovation Cost Split - Principle: Proximity + Connectedness (slider connected to breakdown) */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Répartition des coûts de rénovation
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Ajustez le curseur pour équilibrer les coûts de rénovation entre les deux prêts.
            </p>
            
            {/* Slider for renovation allocation - Principle: Continuity (visual flow from slider to breakdown) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600 font-medium">Prêt 1</span>
                </div>
                <div className="flex-1 mx-3 relative">
                  {/* Visual split indicator */}
                  {personalRenovationCost > 0 && (
                    <div className="relative h-2 bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 rounded-full">
                      <div 
                        className="absolute top-0 h-full bg-blue-200 transition-all duration-150 rounded-l-full"
                        style={{
                          left: 0,
                          width: `${(loan1RenovationAmount / personalRenovationCost) * 100}%`
                        }}
                      />
                      <div 
                        className="absolute top-0 h-full bg-blue-500 transition-all duration-150 rounded-r-full"
                        style={{
                          left: `${(loan1RenovationAmount / personalRenovationCost) * 100}%`,
                          width: `${(loan2RenovationAmount / personalRenovationCost) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-700"></div>
                  <span className="text-xs text-gray-600 font-medium">Prêt 2</span>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={personalRenovationCost || 0}
                  step="1000"
                  value={loan2RenovationAmount}
                  onChange={(e) => {
                    onUpdateParticipant({ 
                      ...participant, 
                      loan2RenovationAmount: parseFloat(e.target.value) || 0 
                    });
                  }}
                  className="w-full h-3 bg-transparent appearance-none cursor-pointer renovation-slider"
                />
                <style>{`
                  .renovation-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                    transition: transform 0.1s ease;
                  }
                  .renovation-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    background: #2563eb;
                  }
                  .renovation-slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                    transition: transform 0.1s ease;
                  }
                  .renovation-slider::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    background: #2563eb;
                  }
                  .renovation-slider::-ms-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                  }
                  .renovation-slider::-webkit-slider-runnable-track {
                    height: 3px;
                    background: transparent;
                  }
                  .renovation-slider::-moz-range-track {
                    height: 3px;
                    background: transparent;
                  }
                `}</style>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">€0 (tout dans prêt 1)</span>
                <span className="text-xs font-semibold text-blue-700 px-2 py-1 bg-blue-50 rounded">
                  €{loan2RenovationAmount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">€{(personalRenovationCost || 0).toLocaleString()} (tout dans prêt 2)</span>
              </div>
            </div>

            {/* Renovation Breakdown - Principle: Similarity (consistent styling) + Figure-Ground (emphasis on allocation) */}
            <div className="pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`text-center p-3 rounded-lg border-2 ${
                  remainingRenovation >= 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-gray-600 mb-1.5">Dans prêt 1</p>
                  <p className={`text-base font-bold ${remainingRenovation >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    €{loan1RenovationAmount.toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${remainingRenovation >= 0 ? 'text-gray-500' : 'text-red-600'}`}>
                    {personalRenovationCost > 0 
                      ? `${Math.round((loan1RenovationAmount / personalRenovationCost) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-1.5">Total</p>
                  <p className="text-base font-bold text-gray-900">€{personalRenovationCost?.toLocaleString() || '0'}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-gray-600 mb-1.5">Dans prêt 2</p>
                  <p className="text-base font-bold text-blue-700">€{loan2RenovationAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {personalRenovationCost > 0 
                      ? `${Math.round((loan2RenovationAmount / personalRenovationCost) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </div>
            {validationErrors.renovationAmount && (
              <div className="text-red-600 text-xs mt-3 p-2 bg-red-50 rounded border border-red-200">
                ⚠️ {validationErrors.renovationAmount}
              </div>
            )}
          </div>

          {/* Section 3: Capital Allocation - Principle: Common Region + Focal Point (constraint emphasized) */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Répartition du capital apporté
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Allouez votre capital disponible entre les deux prêts.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Capital pour prêt 1 (€)</label>
                <input
                  type="number"
                  value={capitalForLoan1}
                  onChange={(e) => {
                    onUpdateParticipant({ ...participant, capitalForLoan1: parseFloat(e.target.value) || 0 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Capital pour prêt 2 (€)</label>
                <input
                  type="number"
                  value={capitalForLoan2}
                  onChange={(e) => {
                    onUpdateParticipant({ ...participant, capitalForLoan2: parseFloat(e.target.value) || 0 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* Capital Summary - Principle: Focal Point (constraint visualization) */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Capital alloué:</span>
                <span className={`text-sm font-semibold ${
                  totalCapitalAllocated <= (participant.capitalApporte || 0)
                    ? 'text-gray-900' 
                    : 'text-red-700'
                }`}>
                  €{totalCapitalAllocated.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Capital disponible:</span>
                <span className="text-sm font-bold text-green-700">€{(participant.capitalApporte || 0).toLocaleString()}</span>
              </div>
              {remainingCapital !== 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {remainingCapital > 0 ? 'Capital non alloué:' : 'Dépassement:'}
                  </span>
                  <span className={`text-xs font-semibold ${
                    remainingCapital >= 0 
                      ? 'text-gray-600' 
                      : 'text-red-700'
                  }`}>
                    €{Math.abs(remainingCapital).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {validationErrors.capitalAllocation && (
              <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded border border-red-200">
                ⚠️ {validationErrors.capitalAllocation}
              </div>
            )}
          </div>

          {/* Section 4: Calculated Loan Summary - Principle: Figure-Ground (calculated results emphasized) */}
          {(loan1Amount !== undefined || loan2Amount !== undefined) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Résultats calculés</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Prêt 1</p>
                  <p className="text-xs text-gray-500 mb-0.5">Montant à emprunter:</p>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">
                    {loan1Amount !== undefined ? `€${loan1Amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : '—'}
                  </p>
                  {loan1MonthlyPayment !== undefined && loan1Amount > 0 && (
                    <p className="text-xs text-gray-500">
                      Mensualité: €{loan1MonthlyPayment.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                    </p>
                  )}
                  {loan1Amount === 0 && (
                    <p className="text-xs text-green-600 font-medium">Entièrement couvert par le capital</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Prêt 2</p>
                  {loan2RenovationAmount > 0 && (
                    <div className="mb-1">
                      <p className="text-xs text-gray-500 mb-0.5">Rénovation allouée:</p>
                      <p className="text-xs font-semibold text-blue-700">€{loan2RenovationAmount.toLocaleString()}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mb-0.5">Montant à emprunter:</p>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">
                    {loan2Amount !== undefined ? `€${loan2Amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : '—'}
                  </p>
                  {loan2MonthlyPayment !== undefined && loan2Amount > 0 && (
                    <p className="text-xs text-gray-500">
                      Mensualité: €{loan2MonthlyPayment.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} 
                      <span className="text-gray-400"> ({loan2DurationYears} ans)</span>
                    </p>
                  )}
                  {loan2Amount === 0 && loan2RenovationAmount > 0 && (
                    <p className="text-xs text-green-600 font-medium">Entièrement couvert par le capital</p>
                  )}
                  {loan2Amount === 0 && loan2RenovationAmount === 0 && (
                    <p className="text-xs text-gray-400">Aucune rénovation allouée</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
