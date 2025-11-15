import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function FoundersSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const peopleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Founders appear one by one
    peopleRefs.current.forEach((person, index) => {
      if (!person) return;

      gsap.from(person, {
        opacity: 0,
        scale: 0.5,
        y: 100,
        scrollTrigger: {
          trigger: person,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1
        }
      });

      // Floating animation
      gsap.to(person, {
        y: -20,
        duration: 2 + index * 0.3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.2
      });
    });

  }, []);

  const founders = [
    { name: 'Alice', surface: '200m²', color: 'from-blue-500 to-cyan-500' },
    { name: 'Bob', surface: '150m²', color: 'from-purple-500 to-pink-500' },
    { name: 'Charlie', surface: '100m²', color: 'from-amber-500 to-orange-500' },
    { name: 'Diana', surface: '50m²', color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Les Fondateurs
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Quatre personnes décident d'acheter ensemble un immeuble.
          <br />
          Chacun investit selon ses moyens et ses besoins.
        </p>

        {/* Founders grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {founders.map((founder, index) => (
            <div
              key={founder.name}
              ref={(el) => { peopleRefs.current[index] = el; }}
              className="flex flex-col items-center"
            >
              {/* Avatar */}
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${founder.color} flex items-center justify-center mb-4 shadow-2xl`}>
                <span className="text-4xl font-bold text-white">{founder.name[0]}</span>
              </div>
              {/* Info */}
              <h3 className="text-2xl font-bold text-white mb-2">{founder.name}</h3>
              <p className="text-lg text-slate-400">{founder.surface}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="text-center">
          <div className="inline-block px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl border border-slate-600">
            <p className="text-sm text-slate-400 mb-1">Surface totale</p>
            <p className="text-4xl font-bold text-white">500m²</p>
          </div>
        </div>
      </div>
    </section>
  );
}
