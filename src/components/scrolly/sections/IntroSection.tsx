import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function IntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const building = buildingRef.current;

    if (!section || !title || !subtitle || !building) return;

    // Intro animation
    gsap.from(title, {
      opacity: 0,
      y: 100,
      duration: 1.2,
      ease: 'power3.out'
    });

    gsap.from(subtitle, {
      opacity: 0,
      y: 50,
      duration: 1,
      delay: 0.3,
      ease: 'power3.out'
    });

    // Building entrance
    gsap.from(building, {
      scale: 0.5,
      opacity: 0,
      duration: 1.5,
      delay: 0.6,
      ease: 'back.out(1.4)'
    });

    // Scroll-based parallax
    gsap.to(building, {
      y: 200,
      opacity: 0.3,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });

  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="max-w-4xl mx-auto text-center z-10">
        <h1
          ref={titleRef}
          className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
        >
          Créons ensemble<br />votre habitat
        </h1>
        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto"
        >
          L'histoire d'un projet immobilier partagé en Wallonie
        </p>
      </div>

      {/* Animated building illustration */}
      <div
        ref={buildingRef}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
      >
        <div className="relative w-64 h-96">
          {/* Simple building SVG */}
          <svg viewBox="0 0 200 300" className="w-full h-full">
            <defs>
              <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Building body */}
            <rect x="40" y="80" width="120" height="220" fill="url(#buildingGrad)" rx="4" />
            {/* Windows */}
            {[0, 1, 2, 3, 4].map((row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={`window-${row}-${col}`}
                  x={55 + col * 30}
                  y={100 + row * 40}
                  width="20"
                  height="25"
                  fill="#fbbf24"
                  opacity="0.6"
                  rx="2"
                />
              ))
            )}
            {/* Roof */}
            <polygon points="100,60 30,85 170,85" fill="#6366f1" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
