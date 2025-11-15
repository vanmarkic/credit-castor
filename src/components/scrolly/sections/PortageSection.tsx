import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function PortageSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const costBarsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Animate timeline
    if (timelineRef.current) {
      gsap.from(timelineRef.current.children, {
        opacity: 0,
        x: -100,
        stagger: 0.2,
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 70%',
          end: 'top 40%',
          scrub: 1
        }
      });
    }

    // Animate cost bars
    costBarsRef.current.forEach((bar, index) => {
      if (!bar) return;
      gsap.from(bar, {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1,
        delay: index * 0.2,
        scrollTrigger: {
          trigger: bar,
          start: 'top 75%'
        }
      });
    });

  }, []);

  const costs = [
    { label: 'Prix de base', amount: 152500, color: 'bg-blue-500', percentage: 65 },
    { label: 'Indexation 2%/an', amount: 7686, color: 'bg-purple-500', percentage: 3 },
    { label: 'Frais de portage', amount: 20970, color: 'bg-pink-500', percentage: 9 }
  ];

  const total = costs.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-orange-400">
            Le Portage
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Alice veut garder un 2ème lot pour le vendre plus tard.
          <br />
          En attendant, elle paie des <strong className="text-pink-400">frais de portage</strong>.
        </p>

        {/* Timeline */}
        <div ref={timelineRef} className="mb-16 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏠</span>
            </div>
            <div className="flex-1 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-bold">T0 - Achat du lot</p>
              <p className="text-slate-400">Alice acquiert le lot pour 152,500€</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="flex-1 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-bold">Pendant 2.5 ans</p>
              <p className="text-slate-400">Frais mensuels: taxes, assurance, intérêts...</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <div className="flex-1 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-bold">Vente</p>
              <p className="text-slate-400">Prix final: {total.toLocaleString('fr-BE')}€</p>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center text-white mb-4">Décomposition du prix</h3>
          {costs.map((cost, index) => (
            <div key={cost.label}>
              <div className="flex justify-between mb-2">
                <span className="text-white font-medium">{cost.label}</span>
                <span className="text-slate-300 font-mono">{cost.amount.toLocaleString('fr-BE')}€</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  ref={(el) => { costBarsRef.current[index] = el; }}
                  className={`h-full ${cost.color} rounded-full`}
                  style={{ width: `${cost.percentage * 10}%` }}
                />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-white">Total</span>
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-orange-400">
                {total.toLocaleString('fr-BE')}€
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
