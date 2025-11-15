import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const founders = [
  { name: 'Alice', quotite: 0.40, color: '#3b82f6', letter: 'A' },
  { name: 'Bob', quotite: 0.30, color: '#a855f7', letter: 'B' },
  { name: 'Charlie', quotite: 0.20, color: '#f59e0b', letter: 'C' },
  { name: 'Diana', quotite: 0.10, color: '#10b981', letter: 'D' }
];

const evaPayment = 40000;
const reservesAmount = evaPayment * 0.30; // 12,000€
const redistributionAmount = evaPayment * 0.70; // 28,000€

export default function RedistributionFlowTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const evaMoneyRef = useRef<HTMLDivElement>(null);
  const reservesBoxRef = useRef<HTMLDivElement>(null);
  const redistributionBoxRef = useRef<HTMLDivElement>(null);
  const founderBoxRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const container = containerRef.current;
    const evaMoney = evaMoneyRef.current;
    const reservesBox = reservesBoxRef.current;
    const redistributionBox = redistributionBoxRef.current;

    if (!section || !container || !evaMoney || !reservesBox || !redistributionBox) return;

    // Pin the container during the transition
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: container,
      pinSpacing: false,
      anticipatePin: 1
    });

    // Timeline for the flow animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    // Step 1: Eva's money enters from left
    tl.from(evaMoney, {
      x: -400,
      opacity: 0,
      duration: 0.5
    }, 0);

    // Step 2: Money splits - reserves go up, redistribution goes down
    tl.to(reservesBox, {
      opacity: 1,
      scale: 1,
      y: -80,
      duration: 0.5
    }, 0.5);

    tl.to(redistributionBox, {
      opacity: 1,
      scale: 1,
      y: 80,
      duration: 0.5
    }, 0.5);

    tl.to(evaMoney, {
      opacity: 0.3,
      scale: 0.8,
      duration: 0.5
    }, 0.5);

    // Step 3: Redistribution amount flows to founders
    founderBoxRefs.current.forEach((founderBox, index) => {
      if (!founderBox) return;

      tl.to(founderBox, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.4
      }, 1.2 + index * 0.1);
    });

    // Step 4: Fade out center elements
    tl.to([evaMoney, redistributionBox], {
      opacity: 0,
      duration: 0.3
    }, 2);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[300vh]"
    >
      <div
        ref={containerRef}
        className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
      >
        {/* Eva's initial payment */}
        <div
          ref={evaMoneyRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl p-8 shadow-2xl border-2 border-pink-400">
            <div className="text-center">
              <div className="text-sm text-pink-200 mb-2">Eva paie</div>
              <div className="text-4xl font-bold text-white">40,000€</div>
            </div>
          </div>
        </div>

        {/* Reserves box (30%) */}
        <div
          ref={reservesBoxRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-0"
          style={{ transformOrigin: 'center center' }}
        >
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 shadow-xl border-2 border-slate-500">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Réserves 30%</div>
              <div className="text-2xl font-bold text-slate-300">12,000€</div>
            </div>
          </div>
        </div>

        {/* Redistribution pool (70%) */}
        <div
          ref={redistributionBoxRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-0"
          style={{ transformOrigin: 'center center' }}
        >
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-xl border-2 border-emerald-400">
            <div className="text-center">
              <div className="text-xs text-emerald-200 mb-1">Redistribution 70%</div>
              <div className="text-2xl font-bold text-white">28,000€</div>
            </div>
          </div>
        </div>

        {/* Founder boxes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl px-6">
            {founders.map((founder, index) => {
              const share = redistributionAmount * founder.quotite;
              return (
                <div
                  key={founder.name}
                  ref={el => founderBoxRefs.current[index] = el}
                  className="opacity-0 scale-0"
                  style={{
                    transformOrigin: 'center center',
                    transform: 'translateX(200px)'
                  }}
                >
                  <div
                    className="rounded-2xl p-6 shadow-xl border-2"
                    style={{
                      background: `linear-gradient(135deg, ${founder.color}, ${founder.color}dd)`,
                      borderColor: founder.color
                    }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl font-bold text-white">{founder.letter}</span>
                      </div>
                      <div className="text-sm text-white/80 mb-1">{founder.name}</div>
                      <div className="text-xs text-white/60 mb-2">Quotité: {(founder.quotite * 100).toFixed(0)}%</div>
                      <div className="text-2xl font-bold text-white">
                        {share.toLocaleString('fr-BE')}€
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transition text */}
        <div className="absolute bottom-20 left-0 right-0 text-center z-30">
          <p className="text-2xl text-slate-300">
            Le paiement d'<span className="text-pink-400">Eva</span> se divise : <span className="text-slate-400">30% réserves</span>, <span className="text-emerald-400">70% redistribution</span>
          </p>
        </div>
      </div>
    </section>
  );
}
