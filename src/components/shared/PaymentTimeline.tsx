import { PaymentPhaseCard } from './PaymentPhaseCard';
import { formatCurrency } from '../../utils/formatting';
import type { PhaseCosts } from '../../utils/phaseCostsCalculation';

interface PaymentTimelineProps {
  phaseCosts: PhaseCosts;
  capitalApporte: number;
  monthlyPayment: number;
}

export function PaymentTimeline({
  phaseCosts,
  capitalApporte,
  monthlyPayment,
}: PaymentTimelineProps) {
  const { signature, construction, emmenagement, grandTotal } = phaseCosts;
  const toFinance = Math.max(0, grandTotal - capitalApporte);

  return (
    <div className="mb-6">
      <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-4 text-center">
        MON PARCOURS DE PAIEMENT
      </h3>

      {/* Timeline connector line - 3 dots only (phases, not total) */}
      <div className="relative mb-4">
        <div className="absolute top-3 left-[16%] right-[16%] h-0.5 bg-gray-300" />
        <div className="flex justify-around px-8">
          <div
            data-testid="timeline-dot"
            className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow z-10"
          />
          <div
            data-testid="timeline-dot"
            className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow z-10"
          />
          <div
            data-testid="timeline-dot"
            className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow z-10"
          />
        </div>
      </div>

      {/* Phase cards grid - 3 columns for phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <PaymentPhaseCard
          label="SIGNATURE"
          subtitle="Je deviens propriétaire"
          icon="🔑"
          total={signature.total}
          variant="fixed"
          items={[
            { label: "Part d'achat", amount: signature.purchaseShare },
            { label: 'Enregistrement', amount: signature.registrationFees },
            { label: 'Notaire', amount: signature.notaryFees },
          ]}
        />

        <PaymentPhaseCard
          label="CONSTRUCTION"
          subtitle="Mon logement prend forme"
          icon="🏗️"
          total={construction.total}
          variant="progressive"
          items={[
            { label: 'CASCO', amount: construction.casco },
            { label: 'Travaux communs', amount: construction.travauxCommuns },
            { label: 'Commun', amount: construction.commun },
          ]}
        />

        <PaymentPhaseCard
          label="EMMÉNAGEMENT"
          subtitle="J'emménage chez moi"
          icon="🏠"
          total={emmenagement.total}
          variant="flexible"
          items={[
            { label: 'Parachèvements', amount: emmenagement.parachevements },
          ]}
        />
      </div>

      {/* Summary bar - answers key questions at a glance */}
      <div className="bg-gray-100 rounded-lg border border-gray-300 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
              TOTAL
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(grandTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
              À FINANCER
            </p>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(toFinance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
              MENSUALITÉ
            </p>
            <p className="text-xl font-bold text-blue-700">
              ~{monthlyPayment} €/mois
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
