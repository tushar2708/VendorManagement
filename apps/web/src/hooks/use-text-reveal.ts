import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function scrambleText(
  element: HTMLElement,
  finalText: string,
  duration: number
): gsap.core.Tween {
  let progress = 0;
  const length = finalText.length;

  return gsap.to(
    { progress: 0 },
    {
      progress: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: function () {
        progress = this.progress();
        const revealedCount = Math.floor(progress * length);
        let display = '';

        for (let i = 0; i < length; i++) {
          if (i < revealedCount) {
            display += finalText[i];
          } else if (finalText[i] === ' ') {
            display += ' ';
          } else {
            display += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }

        element.textContent = display;
      },
      onComplete: () => {
        element.textContent = finalText;
      },
    }
  );
}

export function useTextReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = ref.current;
    const finalText = el.textContent || '';

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          onComplete: () => {
            scrambleText(el, finalText, 0.8);
          },
        }
      );
    });

    return () => {
      ctx.revert();
      el.textContent = finalText;
    };
  }, []);

  return ref;
}
