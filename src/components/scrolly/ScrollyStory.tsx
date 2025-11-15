import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import IntroSection from './sections/IntroSection';
import FoundersSection from './sections/FoundersSection';
import FoundersToQuotiteTransition from './sections/FoundersToQuotiteTransition';
import QuotiteSection from './sections/QuotiteSection';
import PurchasePriceSection from './sections/PurchasePriceSection';
import PortageSection from './sections/PortageSection';
import PortageFormulaSection from './sections/PortageFormulaSection';
import RedistributionSection from './sections/RedistributionSection';
import RedistributionFormulaSection from './sections/RedistributionFormulaSection';
import SharedSpacesSection from './sections/SharedSpacesSection';
import QuotaFormulaSection from './sections/QuotaFormulaSection';
import FinaleSection from './sections/FinaleSection';

export default function ScrollyStory() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register plugin client-side only
    gsap.registerPlugin(ScrollTrigger);

    // Global scroll smoothness
    gsap.config({
      force3D: true,
      nullTargetWarn: false
    });

    // Progress bar animation
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      gsap.to(progressBar, {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3
        }
      });
    }

    // Refresh ScrollTrigger when fonts load
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          style={{
            width: '0%',
            transition: 'width 0.1s ease-out'
          }}
          id="progress-bar"
        />
      </div>

      {/* Story sections */}
      <IntroSection />
      <FoundersSection />
      <FoundersToQuotiteTransition />
      <QuotiteSection />
      <PurchasePriceSection />
      <PortageSection />
      <PortageFormulaSection />
      <RedistributionSection />
      <RedistributionFormulaSection />
      <SharedSpacesSection />
      <QuotaFormulaSection />
      <FinaleSection />
    </div>
  );
}
