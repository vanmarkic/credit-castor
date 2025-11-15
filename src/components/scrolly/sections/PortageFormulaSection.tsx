import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function PortageFormulaSection() {
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
        y: 50,
        scrollTrigger: {
          trigger: formula,
          start: 'top 80%',
          end: 'top 60%',
          scrub: 1
        }
      });
    });

  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-slate-950 to-slate-900"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
            Calcul du Prix de Portage
          </span>
        </h2>

        <p className="text-xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Voici comment on calcule <strong className="text-white">étape par étape</strong> le prix final
          <br />
          quand un lot est en portage pendant <strong className="text-orange-400">2.5 ans</strong>.
        </p>

        <div className="space-y-8">
          {/* Step 1: Prix de base */}
          <div
            ref={el => formulaRefs.current[0] = el}
            className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-3xl p-8 border border-blue-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl">1</span>
              Prix de Base
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-4">
              <div className="text-lg text-slate-300 mb-4">
                Le prix de base est simplement le <strong className="text-white">prix d'achat total</strong> du lot (avec frais de notaire).
              </div>
              <div className="font-mono text-center">
                <div className="text-sm text-slate-400 mb-2">Pour un lot de 50m²</div>
                <div className="text-3xl text-blue-400 font-bold">
                  Prix de base = 152,500€
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400 text-center">
              C'est le montant qu'Alice a payé pour acquérir le lot initialement
            </p>
          </div>

          {/* Step 2: Indexation */}
          <div
            ref={el => formulaRefs.current[1] = el}
            className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-3xl p-8 border border-purple-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-xl">2</span>
              Indexation (Inflation)
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-6">
              <div className="text-lg text-slate-300 mb-4">
                Le prix augmente de <strong className="text-purple-400">2% par an</strong> pour compenser l'inflation.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Formule d'indexation</div>
                  <div className="font-mono text-center text-lg text-white">
                    Indexation = Prix_base × (1.02<sup>années</sup> - 1)
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Application pour 2.5 ans</div>
                  <div className="font-mono text-white space-y-2">
                    <div>= 152,500€ × (1.02<sup>2.5</sup> - 1)</div>
                    <div>= 152,500€ × (1.0504 - 1)</div>
                    <div>= 152,500€ × 0.0504</div>
                    <div className="text-xl text-purple-400 font-bold pt-2 border-t border-slate-600">
                      = 7,686€
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
              <span className="text-lg text-white">Indexation totale</span>
              <span className="text-2xl font-bold text-purple-400">+ 7,686€</span>
            </div>
          </div>

          {/* Step 3: Frais de portage */}
          <div
            ref={el => formulaRefs.current[2] = el}
            className="bg-gradient-to-br from-pink-900/30 to-orange-900/30 rounded-3xl p-8 border border-pink-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-xl">3</span>
              Frais de Portage
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-6">
              <div className="text-lg text-slate-300 mb-4">
                Pendant le portage, il faut payer chaque mois: <strong className="text-white">taxes, assurance, intérêts du prêt...</strong>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-3">Formule des frais mensuels</div>
                  <div className="font-mono text-white space-y-1">
                    <div className="flex justify-between border-b border-slate-700 pb-2 mb-2">
                      <span className="text-slate-300">Taxes foncières</span>
                      <span className="text-orange-400">150€/mois</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-2 mb-2">
                      <span className="text-slate-300">Assurance</span>
                      <span className="text-orange-400">80€/mois</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-2 mb-2">
                      <span className="text-slate-300">Intérêts prêt (2.5%)</span>
                      <span className="text-orange-400">318€/mois</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-slate-600">
                      <span>Total mensuel</span>
                      <span className="text-pink-400">548€/mois</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Calcul sur 2.5 ans (30 mois)</div>
                  <div className="font-mono text-white space-y-2">
                    <div>Frais portage = 548€ × 30 mois</div>
                    <div className="text-xl text-pink-400 font-bold pt-2 border-t border-slate-600">
                      = 16,440€
                    </div>
                  </div>
                </div>

                <div className="bg-orange-900/30 rounded-xl p-4 border border-orange-500/30">
                  <div className="text-sm text-orange-300 mb-2">⚡ Marge de sécurité (27%)</div>
                  <div className="font-mono text-white">
                    <div className="text-sm text-slate-300">On ajoute une marge pour les imprévus</div>
                    <div className="mt-2">16,440€ × 1.27 = <span className="text-orange-400 font-bold">20,879€</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-pink-900/20 rounded-xl p-4 border border-pink-500/20">
              <span className="text-lg text-white">Frais de portage totaux</span>
              <span className="text-2xl font-bold text-pink-400">+ 20,879€</span>
            </div>
          </div>

          {/* Step 4: Prix final */}
          <div
            ref={el => formulaRefs.current[3] = el}
            className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-3xl p-8 border-2 border-emerald-500/50 shadow-2xl"
          >
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-2xl">✓</span>
              Prix Final de Vente
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-8">
              <div className="font-mono text-white space-y-3 text-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Prix de base</span>
                  <span className="text-blue-400">152,500€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">+ Indexation (2.5 ans)</span>
                  <span className="text-purple-400">7,686€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">+ Frais de portage</span>
                  <span className="text-pink-400">20,879€</span>
                </div>

                <div className="border-t-2 border-slate-600 my-4"></div>

                <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-xl p-6 border border-emerald-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-white">Prix final</span>
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                      181,065€
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-teal-900/30 rounded-xl border border-teal-500/30">
                <div className="text-sm text-teal-300 text-center">
                  💡 <strong>Règle clé</strong> : Le prix augmente de ~18.7% après 2.5 ans de portage
                </div>
              </div>
            </div>
          </div>

          {/* Key takeaway */}
          <div
            ref={el => formulaRefs.current[4] = el}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-slate-600"
          >
            <p className="text-lg text-slate-300 text-center">
              <strong className="text-white">Pourquoi ces frais ?</strong>
              <br />
              Le portage permet à Alice de <span className="text-orange-400">garder un lot en réserve</span> et le vendre plus tard,
              <br />
              mais elle doit couvrir les <span className="text-pink-400">coûts réels</span> pendant cette période.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
