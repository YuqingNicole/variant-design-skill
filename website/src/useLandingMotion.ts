import { useEffect } from "react";

// One-shot entrances never hide content before JavaScript is ready.
export function useLandingMotion(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    const stop = () => { observer?.disconnect(); animations.forEach(animation => animation.cancel()); animations.clear(); };
    const start = () => {
      stop();
      if (preference.matches || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer?.unobserve(entry.target);
        const animation = entry.target.animate([{ opacity: .3, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }), { threshold: .12 });
      document.querySelectorAll('.hero-copy, .direction-stage, .demo-card, .demo-handoff, .demo-proof, .palette-heading, .section-heading').forEach(element => observer?.observe(element));
    };
    start();
    preference.addEventListener('change', start);
    return () => { stop(); preference.removeEventListener('change', start); };
  }, [enabled]);
}
