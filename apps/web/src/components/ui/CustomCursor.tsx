import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

/**
 * A blend-mode cursor follower: an instant dot plus a springy ring that grows
 * over interactive elements. Sits above everything and never blocks input.
 */
export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    function move(event: MouseEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target as HTMLElement | null;
      setActive(
        !!target?.closest(
          'a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"]',
        ),
      );
    }
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <motion.div
        className="absolute size-1.5 rounded-full bg-white mix-blend-difference"
        style={{ x, y, marginLeft: -3, marginTop: -3 }}
      />
      <motion.div
        className="absolute size-10 rounded-full border border-white mix-blend-difference"
        style={{ x: ringX, y: ringY, marginLeft: -20, marginTop: -20 }}
        animate={{ scale: active ? 1.6 : 1, opacity: active ? 0.9 : 0.45 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      />
    </div>
  );
}
