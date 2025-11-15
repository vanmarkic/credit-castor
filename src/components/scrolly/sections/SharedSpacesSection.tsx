import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SharedSpacesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Animate cards
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.from(card, {
        opacity: 0,
        y: 100,
        rotation: index % 2 === 0 ? -5 : 5,
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1
        }
      });
    });

  }, []);

  const models = [
    {
      icon: '🤝',
      title: 'Solidaire',
      color: 'from-green-500 to-emerald-500',
      description: 'Propriété collective, accès gratuit ou à prix coûtant',
      example: 'Atelier bois géré par la communauté'
    },
    {
      icon: '💼',
      title: 'Commercial',
      color: 'from-amber-500 to-orange-500',
      description: 'Location formelle avec assurance et fiscalité',
      example: 'Atelier loué 800€/mois à un menuisier'
    },
    {
      icon: '⚖️',
      title: 'Quota',
      color: 'from-blue-500 to-purple-500',
      description: 'Quotas annuels (40j perso, 30j pro) avec tarif progressif',
      example: '35 jours × 10€ = 350€/an'
    }
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            Espaces Partagés
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Ateliers, salles communes, jardins...
          <br />
          <strong className="text-cyan-400">Trois modèles</strong> pour s'adapter à tous les usages.
        </p>

        {/* Model cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {models.map((model, index) => (
            <div
              key={model.title}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${model.color} rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
              <div className="relative p-8 bg-slate-800/90 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all">
                <div className="text-6xl mb-4">{model.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{model.title}</h3>
                <p className="text-slate-300 mb-4">{model.description}</p>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 italic">Exemple:</p>
                  <p className="text-sm text-white">{model.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
            <div className="text-3xl mb-3">🔄</div>
            <h4 className="text-xl font-bold text-white mb-2">Transitions flexibles</h4>
            <p className="text-slate-300">Quota → Commercial si usage intensif</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
            <div className="text-3xl mb-3">🔔</div>
            <h4 className="text-xl font-bold text-white mb-2">Alertes automatiques</h4>
            <p className="text-slate-300">Dépassement quota, assurance, fiscalité</p>
          </div>
        </div>
      </div>
    </section>
  );
}
