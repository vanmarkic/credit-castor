import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function FinaleSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const elementsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Stagger animation
    gsap.from(elementsRef.current, {
      opacity: 0,
      y: 50,
      stagger: 0.2,
      duration: 1,
      ease: 'power3.out',
      delay: 0.3
    });

    // Floating animation
    elementsRef.current.forEach((el, index) => {
      if (!el) return;
      gsap.to(el, {
        y: -15,
        duration: 2 + index * 0.3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.1
      });
    });

  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          ref={(el) => { elementsRef.current[0] = el; }}
          className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
        >
          Un projet pour tous
        </h2>

        <p
          ref={(el) => { elementsRef.current[1] = el; }}
          className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto"
        >
          Achat partagé, portage intelligent, redistribution équitable, espaces communs...
          <br />
          <strong className="text-white">Credit Castor rend l'immobilier accessible et solidaire.</strong>
        </p>

        {/* Key stats */}
        <div
          ref={(el) => { elementsRef.current[2] = el; }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl border border-blue-500/20">
            <div className="text-5xl font-bold text-blue-400 mb-2">4</div>
            <p className="text-slate-300">Fondateurs</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl border border-purple-500/20">
            <div className="text-5xl font-bold text-purple-400 mb-2">3</div>
            <p className="text-slate-300">Modèles de gouvernance</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-pink-900/30 to-pink-800/30 rounded-2xl border border-pink-500/20">
            <div className="text-5xl font-bold text-pink-400 mb-2">∞</div>
            <p className="text-slate-300">Possibilités de partage</p>
          </div>
        </div>

        {/* CTA */}
        <div ref={(el) => { elementsRef.current[3] = el; }}>
          <a
            href="/"
            className="inline-block px-12 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Découvrir le calculateur
          </a>
        </div>

        {/* Footer info */}
        <div
          ref={(el) => { elementsRef.current[4] = el; }}
          className="mt-16 pt-8 border-t border-slate-700"
        >
          <p className="text-slate-400 mb-4">
            Un outil pour les projets de division immobilière en Wallonie
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <a href="/docs/guide-complet-mecanismes-regles.md" className="hover:text-slate-300 transition-colors">
              📖 Guide complet
            </a>
            <a href="/docs/regles-metiers-diagrammes-pedagogiques.md" className="hover:text-slate-300 transition-colors">
              📊 Diagrammes
            </a>
            <a href="/docs/cas-usage-flux-decision.md" className="hover:text-slate-300 transition-colors">
              🎯 Cas d'usage
            </a>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
