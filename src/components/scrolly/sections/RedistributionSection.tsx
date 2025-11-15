import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function RedistributionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const moneyFlowRef = useRef<SVGSVGElement>(null);
  const [animatedAmount, setAnimatedAmount] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Animate money flow
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      onEnter: () => {
        gsap.to({}, {
          duration: 2,
          ease: 'power2.out',
          onUpdate: function() {
            setAnimatedAmount(40000 * this.progress());
          }
        });
      }
    });

  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            Redistribution
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Eva achète un lot de 50m² de la copropriété pour 40,000€.
          <br />
          Son paiement est <strong className="text-green-400">redistribué</strong> aux fondateurs !
        </p>

        {/* Animated flow diagram */}
        <div className="mb-12">
          <svg ref={moneyFlowRef} viewBox="0 0 600 400" className="w-full h-auto">
            <defs>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
              </marker>
            </defs>

            {/* Eva (buyer) */}
            <circle cx="100" cy="200" r="40" fill="#10b981" opacity="0.8" />
            <text x="100" y="205" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">Eva</text>
            <text x="100" y="260" textAnchor="middle" fill="#10b981" fontSize="16">40,000€</text>

            {/* Distribution */}
            <text x="300" y="50" textAnchor="middle" fill="#fbbf24" fontSize="16" fontWeight="bold">
              30% = 12,000€
            </text>
            <text x="300" y="70" textAnchor="middle" fill="#94a3b8" fontSize="14">
              → Réserves copropriété
            </text>

            <text x="300" y="350" textAnchor="middle" fill="#10b981" fontSize="16" fontWeight="bold">
              70% = 28,000€
            </text>
            <text x="300" y="370" textAnchor="middle" fill="#94a3b8" fontSize="14">
              → Fondateurs (selon quotité)
            </text>

            {/* Arrows to founders */}
            <line x1="160" y1="200" x2="400" y2="100" stroke="url(#flowGrad)" strokeWidth="3" markerEnd="url(#arrowhead)" opacity="0.6" />
            <line x1="160" y1="200" x2="400" y2="160" stroke="url(#flowGrad)" strokeWidth="3" markerEnd="url(#arrowhead)" opacity="0.6" />
            <line x1="160" y1="200" x2="400" y2="220" stroke="url(#flowGrad)" strokeWidth="3" markerEnd="url(#arrowhead)" opacity="0.6" />
            <line x1="160" y1="200" x2="400" y2="280" stroke="url(#flowGrad)" strokeWidth="3" markerEnd="url(#arrowhead)" opacity="0.6" />

            {/* Founders */}
            <circle cx="500" cy="100" r="30" fill="#3b82f6" opacity="0.8" />
            <text x="500" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">A</text>
            <text x="500" y="145" textAnchor="middle" fill="#3b82f6" fontSize="14">40% → 11,200€</text>

            <circle cx="500" cy="160" r="25" fill="#a855f7" opacity="0.8" />
            <text x="500" y="165" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">B</text>
            <text x="500" y="200" textAnchor="middle" fill="#a855f7" fontSize="14">30% → 8,400€</text>

            <circle cx="500" cy="220" r="20" fill="#f59e0b" opacity="0.8" />
            <text x="500" y="225" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">C</text>
            <text x="500" y="255" textAnchor="middle" fill="#f59e0b" fontSize="14">20% → 5,600€</text>

            <circle cx="500" cy="280" r="15" fill="#10b981" opacity="0.8" />
            <text x="500" y="285" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">D</text>
            <text x="500" y="310" textAnchor="middle" fill="#10b981" fontSize="14">10% → 2,800€</text>
          </svg>
        </div>

        {/* Key insight */}
        <div className="text-center">
          <div className="inline-block px-8 py-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-2xl border border-green-500/30">
            <p className="text-lg text-slate-300 mb-2">Mécanisme récursif</p>
            <p className="text-xl md:text-2xl text-white max-w-2xl">
              Plus de nouveaux venus = plus de redistribution
              <br />
              <span className="text-green-400 font-bold">Tout le monde en profite !</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
