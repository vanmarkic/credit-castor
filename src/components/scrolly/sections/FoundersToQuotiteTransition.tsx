import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const founders = [
  { name: 'Alice', surface: 200, color: '#3b82f6', percentage: 40, letter: 'A' },
  { name: 'Bob', surface: 150, color: '#a855f7', percentage: 30, letter: 'B' },
  { name: 'Charlie', surface: 100, color: '#f59e0b', percentage: 20, letter: 'C' },
  { name: 'Diana', surface: 50, color: '#10b981', percentage: 10, letter: 'D' }
];

export default function FoundersToQuotiteTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const founderRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const container = containerRef.current;
    const svg = svgRef.current;

    if (!section || !container || !svg) return;

    // Pin the container during the transition. We DO NOT set position: fixed
    // in CSS; ScrollTrigger will handle that. Doing both caused the ghosted
    // founders + "quotité" label stuck on screen as in your screenshot.
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: container,
      pinSpacing: false,
      anticipatePin: 1
    });

    // Timeline for the morphing animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    // Arrange founders so they collapse towards the center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    founderRefs.current.forEach((founder, index) => {
      if (!founder) return;

      // All move towards the same center point
      const targetX = centerX;
      const targetY = centerY;

      const rect = founder.getBoundingClientRect();
      const currentX = rect.left + rect.width / 2;
      const currentY = rect.top + rect.height / 2;

      tl.to(
        founder,
        {
          x: targetX - currentX,
          y: targetY - currentY,
          scale: 0.3,
          opacity: 0.8,
          duration: 1
        },
        0
      );
    });

    // Fade in the SVG pie chart
    tl.fromTo(
      svg,
      {
        opacity: 0,
        scale: 0.5
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1
      },
      0.5
    );

    // Fade out the founder elements
    tl.to(
      founderRefs.current,
      {
        opacity: 0,
        duration: 0.5
      },
      1
    );

    return () => {
      tl.kill();
    };
  }, []);

  const createPieSlice = (percentage: number, startAngle: number, color: string) => {
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
    <section ref={sectionRef} className="relative h-[200vh]">
      <div
        ref={containerRef}
        className="inset-0 flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950"
      >
        {/* Founder circles that will morph */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl">
            {founders.map((founder, index) => (
              <div
                key={founder.name}
                ref={el => {
                  founderRefs.current[index] = el;
                }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${founder.color}, ${founder.color}dd)`
                  }}
                >
                  <span className="text-3xl font-bold text-white">{founder.letter}</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-3">{founder.name}</h3>
                <p className="text-slate-400">{founder.surface}m²</p>
              </div>
            ))}
          </div>
        </div>

        {/* Target pie chart */}
        <svg ref={svgRef} viewBox="0 0 200 200" className="w-full max-w-md opacity-0">
          {founders.map(founder => {
            const slice = createPieSlice(founder.percentage, currentAngle, founder.color);
            currentAngle += (founder.percentage / 100) * 360;

            return (
              <path key={founder.name} d={slice} fill={founder.color} opacity="0.9" />
            );
          })}
          <circle cx="100" cy="100" r="40" fill="#0f172a" />
          <text x="100" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            500m²
          </text>
        </svg>

        {/* Transition text */}
        <div className="absolute bottom-20 left-0 right-0 text-center">
          <p className="text-2xl text-slate-300">
            De <span className="text-blue-400">4 fondateurs</span> à leur{' '}
            <span className="text-purple-400">quotité</span>
          </p>
        </div>
      </div>
    </section>
  );
}


