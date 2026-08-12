import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function useHoverScale<T extends HTMLElement>(scale = 1.02): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const enter = () => gsap.to(el, { scale, boxShadow: '0 8px 25px rgba(0,0,0,0.1)', duration: 0.25, ease: 'power2.out' });
    const leave = () => gsap.to(el, { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', duration: 0.25, ease: 'power2.out' });

    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);

    return () => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
    };
  }, [scale]);

  return ref;
}
