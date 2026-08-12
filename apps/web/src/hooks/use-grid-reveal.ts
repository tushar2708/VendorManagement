import { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

interface UseGridRevealReturn<T extends HTMLElement> {
  readonly ref: React.RefObject<T | null>;
  readonly relayout: () => void;
}

export function useGridReveal<T extends HTMLElement>(): UseGridRevealReturn<T> {
  const ref = useRef<T>(null);

  // Initial reveal with Flip-based animation
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const children = Array.from(ref.current.children) as HTMLElement[];
    if (children.length === 0) return;

    // Set initial state: invisible
    gsap.set(children, { opacity: 0, scale: 0.8 });

    // Capture state while invisible
    const state = Flip.getState(children);

    // Make visible
    gsap.set(children, { opacity: 1, scale: 1 });

    // Animate from captured state to final positions
    const ctx = gsap.context(() => {
      Flip.from(state, {
        duration: 0.8,
        ease: 'expo.inOut',
        stagger: 0.05,
        absolute: true,
      });
    });

    return () => ctx.revert();
  }, []);

  // Relayout function: caller changes DOM, then calls this to animate the transition
  const relayout = useCallback(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const children = Array.from(ref.current.children) as HTMLElement[];
    if (children.length === 0) return;

    // Capture state BEFORE layout change
    const state = Flip.getState(children);

    // Schedule animation on next frame (after caller's DOM change takes effect)
    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.8,
        ease: 'expo.inOut',
        absolute: true,
      });
    });
  }, []);

  return { ref, relayout };
}
