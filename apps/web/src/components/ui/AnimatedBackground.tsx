import { motion } from 'motion/react';

/**
 * Fixed ambient backdrop: a faint masked grid plus slowly drifting aurora blobs.
 * Decorative only; sits behind all content.
 */
export function AnimatedBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 0%, black, transparent 78%)',
        }}
      />

      <motion.div
        className="absolute -top-48 left-[15%] h-[42rem] w-[42rem] rounded-full bg-primary/25 blur-[130px]"
        animate={{
          x: [0, 70, -50, 0],
          y: [0, 50, 90, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[28%] right-[12%] h-[36rem] w-[36rem] rounded-full bg-accent/25 blur-[130px]"
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 70, -40, 0],
          scale: [1, 0.9, 1.12, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[35%] h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/15 blur-[140px]"
        animate={{ x: [0, 50, -70, 0], y: [0, -50, 30, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
