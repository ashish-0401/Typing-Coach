import { useEffect } from 'react';
import Lenis from 'lenis';

/** Buttery momentum scrolling for the whole document. Renders nothing. */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let frame = 0;
    function update(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
