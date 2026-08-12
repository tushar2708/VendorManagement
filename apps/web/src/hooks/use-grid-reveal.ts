import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function useGridReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const children = ref.current.children;
    if (children.length === 0) return;

    gsap.from(Array.from(children), {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
    });
  }, []);

  return ref;
}
