import { useRef, useEffect } from 'react';

interface UseHoverScaleOptions {
  readonly speed?: number;
  readonly reversed?: boolean;
}

export function useHoverScale<T extends HTMLElement>(
  options: UseHoverScaleOptions = {},
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const children = section.children;
    if (children.length < 2) return;

    const firstChild = children[0] as HTMLElement;
    const secondChild = children[1] as HTMLElement;
    const reversed = options.reversed ?? false;
    const speed = options.speed ?? 0.15;

    let rafId: number | null = null;
    let xPercent = reversed ? 100 : 0;
    let currentXPercent = reversed ? 100 : 0;

    const animateWidths = () => {
      const delta = xPercent - currentXPercent;
      currentXPercent = currentXPercent + delta * speed;

      const firstWidth = 66.66 - currentXPercent * 0.33;
      const secondWidth = 33.33 + currentXPercent * 0.33;

      firstChild.style.width = `${firstWidth}%`;
      secondChild.style.width = `${secondWidth}%`;

      if (Math.round(currentXPercent) === Math.round(xPercent)) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = null;
      } else {
        rafId = requestAnimationFrame(animateWidths);
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      xPercent = (event.clientX / window.innerWidth) * 100;
      if (!rafId) {
        rafId = requestAnimationFrame(animateWidths);
      }
    };

    section.addEventListener('mousemove', onMouseMove);

    return () => {
      section.removeEventListener('mousemove', onMouseMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [options.speed, options.reversed]);

  return ref;
}
