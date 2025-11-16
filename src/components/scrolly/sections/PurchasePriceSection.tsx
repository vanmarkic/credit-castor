import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function PurchasePriceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const formulaRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Animate formulas one by one
    formulaRefs.current.forEach(formula => {
      if (!formula) return;
      gsap.from(formula, {
        opacity: 0,
        x: -50,
        scrollTrigger: {
          trigger: formula,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1
        }
      });
    });

  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            Le Prix d'Achat
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Quand on achète un bien immobilier, le <strong className="text-white">prix ne se limite pas</strong> au prix de vente.
          <br />
          Il faut ajouter les <strong className="text-blue-400">frais de notaire</strong>.
        </p>

        {/* Example */}
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-3xl p-8 mb-12 border border-blue-500/30">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Exemple : Alice achète 200m²</h3>

          <div className="space-y-6">
            {/* Step 1: Purchase price */}
            <div
              ref={el => {
                formulaRefs.current[0] = el;
              }}
              className="bg-slate-800/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg text-slate-300">Prix de vente</span>
                <span className="text-2xl font-mono text-white">150,000€</span>
              </div>
              <p className="text-sm text-slate-400">
                Prix négocié avec le vendeur pour 200m²
              </p>
            </div>

            {/* Step 2: Notary fees formula */}
            <div
              ref={el => {
                formulaRefs.current[1] = el;
              }}
              className="bg-slate-800/50 rounded-2xl p-6"
            >
              <div className="mb-4">
                <h4 className="text-lg font-bold text-blue-400 mb-2">Formule des frais de notaire</h4>
                <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-center">
                  <div className="text-xl text-white mb-2">
                    Frais = <span className="text-blue-400">Prix</span> × <span className="text-cyan-400">12.5%</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    (Wallonie, ancien bien)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg text-slate-300">Frais de notaire (12.5%)</span>
                <span className="text-2xl font-mono text-blue-400">+ 18,750€</span>
              </div>
            </div>

            {/* Step 3: Total calculation */}
            <div
              ref={el => {
                formulaRefs.current[2] = el;
              }}
              className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-6 border-2 border-blue-500/50"
            >
              <div className="mb-4">
                <h4 className="text-lg font-bold text-white mb-2">Calcul du prix total</h4>
                <div className="bg-slate-900/80 rounded-xl p-4 font-mono">
                  <div className="text-sm text-slate-300 mb-1">150,000€ (prix vente)</div>
                  <div className="text-sm text-slate-300 mb-2">+ 18,750€ (frais notaire)</div>
                  <div className="border-t border-slate-600 my-2"></div>
                  <div className="text-xl text-blue-400 font-bold">= 168,750€</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">Prix d'achat total</span>
                <span className="text-3xl font-mono font-bold text-blue-400">168,750€</span>
              </div>
            </div>

            {/* Step 4: Price per m² */}
            <div
              ref={el => {
                formulaRefs.current[3] = el;
              }}
              className="bg-slate-800/50 rounded-2xl p-6"
            >
              <div className="mb-4">
                <h4 className="text-lg font-bold text-cyan-400 mb-2">Prix au m² (avec frais)</h4>
                <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-center">
                  <div className="text-xl text-white mb-2">
                    Prix/m² = <span className="text-blue-400">168,750€</span> ÷ <span className="text-cyan-400">200m²</span>
                  </div>
                  <div className="text-2xl text-cyan-400 font-bold mt-3">
                    = 843.75€/m²
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 text-center">
                Ce prix au m² inclut déjà les frais de notaire
              </p>
            </div>
          </div>
        </div>

        {/* Key insight */}
        <div className="text-center">
          <div className="inline-block px-8 py-6 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-2xl border border-blue-500/30">
            <p className="text-lg text-slate-300 mb-2">Règle importante</p>
            <p className="text-xl md:text-2xl text-white max-w-2xl">
              Le <strong className="text-blue-400">prix d'achat total</strong> sert de base pour tous les calculs suivants
              <br />
              <span className="text-cyan-400">Toujours inclure les frais de notaire !</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
