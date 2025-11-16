import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const founders = [
  { name: 'Alice', surface: 200, color: '#3b82f6', percentage: 40 },
  { name: 'Bob', surface: 150, color: '#a855f7', percentage: 30 },
  { name: 'Charlie', surface: 100, color: '#f59e0b', percentage: 20 },
  { name: 'Diana', surface: 50, color: '#10b981', percentage: 10 }
];

export default function QuotiteSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pieRef = useRef<SVGSVGElement>(null);
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const pie = pieRef.current;
    if (!section || !pie) return;

    // Animate pie chart
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      onEnter: () => {
        founders.forEach((founder, index) => {
          gsap.to({}, {
            duration: 1.5,
            delay: index * 0.2,
            ease: 'power2.out',
            onUpdate: function() {
              const progress = this.progress();
              setAnimatedValues(prev => {
                const newValues = [...prev];
                newValues[index] = founder.percentage * progress;
                return newValues;
              });
            }
          });
        });
      }
    });

  }, []);

  // Calculate pie slices
  const createPieSlice = (percentage: number, startAngle: number) => {
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;

    const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
    const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
    const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
    const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);

    const largeArc = angle > 180 ? 1 : 0;

    return `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -90;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            La Quotité
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-slate-300 text-center max-w-3xl mx-auto mb-16">
          Chaque fondateur possède une <strong className="text-white">part du bâtiment</strong> proportionnelle à sa surface.
          <br />
          C'est ce qu'on appelle la <strong className="text-purple-400">quotité</strong>.
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Pie chart */}
          <div className="flex justify-center">
            <svg
              ref={pieRef}
              viewBox="0 0 200 200"
              className="w-full max-w-md"
            >
              {founders.map((founder, index) => {
                const slice = createPieSlice(animatedValues[index], currentAngle);
                currentAngle += (animatedValues[index] / 100) * 360;

                return (
                  <path
                    key={founder.name}
                    d={slice}
                    fill={founder.color}
                    opacity="0.9"
                    className="transition-all duration-300"
                  />
                );
              })}
              {/* Center circle */}
              <circle cx="100" cy="100" r="40" fill="#0f172a" />
              <text x="100" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                500m²
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-4">
            {founders.map((founder, index) => (
              <div key={founder.name} className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: founder.color }}
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{founder.name}</h3>
                  <p className="text-slate-400">{founder.surface}m² = {founder.percentage}%</p>
                </div>
                <div className="text-3xl font-bold" style={{ color: founder.color }}>
                  {Math.round(animatedValues[index])}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formula */}
        <div className="mt-16 text-center">
          <div className="inline-block px-8 py-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl border border-purple-500/30">
            <p className="text-lg text-slate-300 mb-2">Formule simple</p>
            <p className="text-2xl md:text-3xl font-mono text-white">
              Quotité = <span className="text-purple-400">surface</span> ÷ <span className="text-pink-400">total</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
