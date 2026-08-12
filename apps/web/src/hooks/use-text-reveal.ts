import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function useTextReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(ref.current, {
      y: 12,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    });
  }, []);

  return ref;
}
