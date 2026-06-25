import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** A brief page-load curtain that reveals the app with a wipe. */
export function IntroLoader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <span className="font-heading text-5xl font-bold tracking-tight">
              <span className="text-foreground">Waza</span>
              <span className="text-accent">Key</span>
            </span>
            <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
              Typing Dojo
            </span>
            <div className="mt-6 h-0.5 w-44 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full w-full rounded-full bg-gradient-to-r from-accent to-primary"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
