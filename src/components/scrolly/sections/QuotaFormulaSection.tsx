import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function QuotaFormulaSection() {
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
        y: 40,
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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400">
            Espaces Partagés : Modèle Quota
          </span>
        </h2>

        <p className="text-xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Un atelier partagé avec <strong className="text-white">40 jours/an personnels</strong> et <strong className="text-cyan-400">30 jours/an professionnels</strong>.
          <br />
          Voyons comment calculer le coût d'utilisation.
        </p>

        <div className="space-y-8">
          {/* Quota allocation */}
          <div
            ref={el => {
              formulaRefs.current[0] = el;
            }}
            className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 rounded-3xl p-8 border border-cyan-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-xl">1</span>
              Quotas Annuels
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-blue-500/30">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🏠</div>
                  <div className="text-sm text-slate-400 mb-2">Usage Personnel</div>
                  <div className="text-3xl font-bold text-blue-400">40 jours/an</div>
                </div>
                <div className="text-sm text-slate-400 text-center">
                  Pour bricolage, hobby, famille...
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-6 border border-green-500/30">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">💼</div>
                  <div className="text-sm text-slate-400 mb-2">Usage Professionnel</div>
                  <div className="text-3xl font-bold text-green-400">30 jours/an</div>
                </div>
                <div className="text-sm text-slate-400 text-center">
                  Pour activité professionnelle payante
                </div>
              </div>
            </div>
          </div>

          {/* Personal usage - FREE */}
          <div
            ref={el => {
              formulaRefs.current[1] = el;
            }}
            className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-3xl p-8 border border-blue-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl">2</span>
              Usage Personnel : GRATUIT
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6">
              <div className="text-lg text-slate-300 mb-6">
                Alice utilise l'atelier <strong className="text-white">15 jours</strong> cette année pour construire des meubles.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">Vérification quota</div>
                  <div className="font-mono text-white space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Jours utilisés</span>
                      <span className="text-blue-400">15 jours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Quota personnel</span>
                      <span className="text-blue-400">40 jours</span>
                    </div>
                    <div className="border-t border-slate-600 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Dépassement ?</span>
                      <span className="text-green-400 font-bold">✓ NON</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/30 rounded-xl p-6 border-2 border-green-500/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      Coût pour Alice
                    </div>
                    <div className="text-5xl font-bold text-green-400">
                      0€
                    </div>
                    <div className="text-sm text-green-300 mt-2">
                      ✓ Dans le quota personnel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional usage - PAID */}
          <div
            ref={el => {
              formulaRefs.current[2] = el;
            }}
            className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-3xl p-8 border border-emerald-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-xl">3</span>
              Usage Professionnel : PAYANT
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-6">
              <div className="text-lg text-slate-300 mb-6">
                Bob utilise l'atelier <strong className="text-white">45 jours</strong> pour son activité de menuiserie professionnelle.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-3">Étape 1 : Consommation des quotas</div>
                  <div className="font-mono text-white space-y-3">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Jours personnels d'abord :</div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Quota personnel</span>
                        <span className="text-blue-400">40 jours ✓</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-600 pt-3">
                      <div className="text-sm text-slate-400 mb-1">Puis jours professionnels :</div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Restant</span>
                        <span className="text-orange-400">45 - 40 = 5 jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Quota pro</span>
                        <span className="text-green-400">30 jours ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-3">Étape 2 : Calcul du coût</div>
                  <div className="font-mono text-white space-y-2">
                    <div className="bg-slate-700/50 rounded p-3 mb-2">
                      <div className="text-sm text-slate-400 mb-1">Formule</div>
                      <div className="text-center">
                        Coût = Jours_pro × Prix_journalier
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div>Jours professionnels = <span className="text-emerald-400">5 jours</span></div>
                      <div>Prix = <span className="text-emerald-400">25€/jour</span></div>
                      <div className="text-sm text-slate-400">(coût d'amortissement de l'atelier)</div>
                      <div className="border-t border-slate-600 my-2"></div>
                      <div className="text-xl text-emerald-400 font-bold">
                        = 5 × 25€ = 125€
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/20 rounded-xl p-6 border border-emerald-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-3">
                  Coût pour Bob
                </div>
                <div className="text-5xl font-bold text-emerald-400 mb-3">
                  125€
                </div>
                <div className="text-sm text-slate-400">
                  40 jours gratuits + 5 jours à 25€
                </div>
              </div>
            </div>
          </div>

          {/* Quota overflow */}
          <div
            ref={el => {
              formulaRefs.current[3] = el;
            }}
            className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-3xl p-8 border border-red-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-xl">4</span>
              Dépassement de Quota
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6 mb-6">
              <div className="text-lg text-slate-300 mb-6">
                Charlie utilise l'atelier <strong className="text-white">80 jours</strong> pour son entreprise de réparation.
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-3">Consommation des quotas</div>
                  <div className="font-mono text-white space-y-3">
                    <div className="flex justify-between items-center p-2 bg-blue-900/30 rounded">
                      <span className="text-slate-300">1. Quota personnel</span>
                      <span className="text-blue-400">40 jours (gratuit)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-900/30 rounded">
                      <span className="text-slate-300">2. Quota professionnel</span>
                      <span className="text-green-400">30 jours (25€/j)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-900/30 rounded border border-red-500/30">
                      <span className="text-slate-300">3. Dépassement</span>
                      <span className="text-red-400">10 jours (50€/j)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-3">Calcul détaillé</div>
                  <div className="font-mono text-white space-y-2">
                    <div className="flex justify-between">
                      <span>Jours personnels (gratuit)</span>
                      <span className="text-blue-400">0€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>30 jours pro (25€/j)</span>
                      <span className="text-green-400">750€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>10 jours supplémentaires (50€/j)</span>
                      <span className="text-red-400">500€</span>
                    </div>
                    <div className="border-t-2 border-slate-600 my-2"></div>
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-orange-400">1,250€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/30">
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-300 mb-2">
                      ⚠️ Prix doublé en cas de dépassement !
                    </div>
                    <div className="text-sm text-slate-400">
                      Incite à passer au modèle Commercial pour usage intensif
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary formula */}
          <div
            ref={el => {
              formulaRefs.current[4] = el;
            }}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-3xl p-8 border-2 border-cyan-500/50"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Formule Générale
            </h3>

            <div className="bg-slate-900/80 rounded-2xl p-6">
              <div className="font-mono text-white space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="text-center text-lg mb-3">
                    Coût = f(jours_utilisés)
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-cyan-400 flex-shrink-0">Si jours ≤ 40:</span>
                      <span className="text-white">Gratuit (quota personnel)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-400 flex-shrink-0">Si 40 &lt; jours ≤ 70:</span>
                      <span className="text-white">(jours - 40) × 25€</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 flex-shrink-0">Si jours &gt; 70:</span>
                      <span className="text-white">750€ + (jours - 70) × 50€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-900/30 rounded-xl p-4 border border-cyan-500/30">
                  <div className="text-center text-slate-300">
                    <strong className="text-white">Conseil</strong> :
                    Au-delà de <span className="text-cyan-400">70 jours/an</span>, le modèle <strong className="text-white">Commercial</strong> devient plus avantageux !
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
