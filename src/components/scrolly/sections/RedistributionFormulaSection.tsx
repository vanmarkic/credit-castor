import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const founders = [
  { name: 'Alice', quotite: 0.40, color: '#3b82f6' },
  { name: 'Bob', quotite: 0.30, color: '#a855f7' },
  { name: 'Charlie', quotite: 0.20, color: '#f59e0b' },
  { name: 'Diana', quotite: 0.10, color: '#10b981' }
];

export default function RedistributionFormulaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const formulaRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Animate formulas
    formulaRefs.current.forEach((formula) => {
      if (!formula) return;
      gsap.from(formula, {
        opacity: 0,
        x: -30,
        scrollTrigger: {
          trigger: formula,
          start: 'top 80%',
          end: 'top 60%',
          scrub: 1
        }
      });
    });

  }, []);

  const paymentAmount = 40000;
  const reservePercent = 30;
  const reserveAmount = paymentAmount * (reservePercent / 100);
  const redistributionAmount = paymentAmount - reserveAmount;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-slate-900 to-slate-950"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            Calcul de la Redistribution
          </span>
        </h2>

        <p className="text-xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Eva achète un lot pour <strong className="text-white">40,000€</strong>.
          <br />
          Voici <strong className="text-green-400">comment calculer</strong> la redistribution aux fondateurs.
        </p>

        <div className="space-y-8">
          {/* Step 1: Payment received */}
          <div
            ref={el => formulaRefs.current[0] = el}
            className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-3xl p-8 border border-green-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-xl">1</span>
              Paiement Reçu
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6">
              <div className="text-lg text-slate-300 mb-4">
                Eva paie <strong className="text-white">40,000€</strong> pour son lot de 50m².
              </div>
              <div className="font-mono text-center text-4xl text-green-400 font-bold">
                40,000€
              </div>
            </div>
          </div>

          {/* Step 2: Reserve calculation */}
          <div
            ref={el => formulaRefs.current[1] = el}
            className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 rounded-3xl p-8 border border-amber-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-xl">2</span>
              Réserves de la Copropriété
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-4">
              <div className="text-lg text-slate-300 mb-6">
                <strong className="text-amber-400">30% du paiement</strong> va dans les réserves de la copropriété pour les travaux communs futurs.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Formule</div>
                  <div className="font-mono text-center text-lg text-white">
                    Réserves = Paiement × 30%
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Calcul</div>
                  <div className="font-mono text-white space-y-2 text-center">
                    <div>= 40,000€ × 0.30</div>
                    <div className="text-2xl text-amber-400 font-bold pt-2 border-t border-slate-600">
                      = 12,000€
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-amber-900/20 rounded-xl p-4 border border-amber-500/20">
              <span className="text-lg text-white">→ Réserves copropriété</span>
              <span className="text-2xl font-bold text-amber-400">12,000€</span>
            </div>
          </div>

          {/* Step 3: Amount to redistribute */}
          <div
            ref={el => formulaRefs.current[2] = el}
            className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-3xl p-8 border border-blue-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl">3</span>
              Montant à Redistribuer
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-4">
              <div className="text-lg text-slate-300 mb-6">
                Le reste (<strong className="text-blue-400">70%</strong>) est redistribué aux fondateurs selon leur quotité.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Formule</div>
                  <div className="font-mono text-center text-lg text-white">
                    À redistribuer = Paiement - Réserves
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Calcul</div>
                  <div className="font-mono text-white space-y-2 text-center">
                    <div>= 40,000€ - 12,000€</div>
                    <div className="text-2xl text-blue-400 font-bold pt-2 border-t border-slate-600">
                      = 28,000€
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-blue-900/20 rounded-xl p-4 border border-blue-500/20">
              <span className="text-lg text-white">→ Aux fondateurs</span>
              <span className="text-2xl font-bold text-blue-400">28,000€</span>
            </div>
          </div>

          {/* Step 4: Distribution per founder */}
          <div
            ref={el => formulaRefs.current[3] = el}
            className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-3xl p-8 border border-purple-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-xl">4</span>
              Distribution par Quotité
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-6">
              <div className="text-lg text-slate-300 mb-6">
                Chaque fondateur reçoit une part <strong className="text-white">proportionnelle à sa quotité</strong>.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-slate-400 mb-2">Formule générale</div>
                  <div className="font-mono text-center text-lg text-white">
                    Part<sub>fondateur</sub> = Montant × Quotité<sub>fondateur</sub>
                  </div>
                </div>

                {founders.map((founder, index) => {
                  const share = redistributionAmount * founder.quotite;
                  return (
                    <div
                      key={founder.name}
                      className="bg-slate-800/50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: founder.color }}
                        />
                        <div className="flex-1">
                          <div className="font-bold text-white">{founder.name}</div>
                          <div className="text-sm text-slate-400">Quotité: {(founder.quotite * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <div className="font-mono text-white space-y-1 pl-11">
                        <div className="text-sm text-slate-300">
                          = 28,000€ × {(founder.quotite * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-slate-300">
                          = 28,000€ × {founder.quotite.toFixed(2)}
                        </div>
                        <div
                          className="text-xl font-bold pt-2 border-t border-slate-600"
                          style={{ color: founder.color }}
                        >
                          = {share.toLocaleString('fr-BE')}€
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg text-white">Total redistribué</span>
                <span className="text-xl font-bold text-purple-400">
                  {(founders.reduce((sum, f) => sum + (redistributionAmount * f.quotite), 0)).toLocaleString('fr-BE')}€
                </span>
              </div>
              <div className="text-sm text-slate-400 text-center">
                ✓ Vérifié : 11,200€ + 8,400€ + 5,600€ + 2,800€ = 28,000€
              </div>
            </div>
          </div>

          {/* Visual summary */}
          <div
            ref={el => formulaRefs.current[4] = el}
            className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-3xl p-8 border-2 border-green-500/50"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Récapitulatif Visuel
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-900/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center flex-1">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-green-400">40,000€</div>
                    <div className="text-sm text-slate-400">Paiement Eva</div>
                  </div>
                  <div className="text-3xl text-slate-600">→</div>
                  <div className="text-center flex-1">
                    <div className="text-3xl mb-2">🏦</div>
                    <div className="text-2xl font-bold text-amber-400">12,000€</div>
                    <div className="text-sm text-slate-400">Réserves (30%)</div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-2xl font-bold text-blue-400">28,000€</div>
                    <div className="text-sm text-slate-400">Aux fondateurs (70%)</div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {founders.map(founder => {
                      const share = redistributionAmount * founder.quotite;
                      return (
                        <div
                          key={founder.name}
                          className="bg-slate-800/50 rounded-xl p-3 text-center border"
                          style={{ borderColor: founder.color + '40' }}
                        >
                          <div className="text-xs text-slate-400 mb-1">{founder.name}</div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: founder.color }}
                          >
                            {share.toLocaleString('fr-BE')}€
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/20">
                <p className="text-center text-slate-300">
                  💡 <strong className="text-white">Le mécanisme vertueux</strong> :
                  Plus il y a de nouveaux venus, plus les fondateurs sont remboursés !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
