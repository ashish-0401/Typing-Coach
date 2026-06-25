import {
  animate,
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade-and-rise an element in on mount. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

/** Stagger children in. Wrap each child in <StaggerItem>. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/** Drift content vertically as it scrolls through the viewport. */
export function Parallax({
  children,
  offset = 40,
  className,
}: {
  children: ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Count a number up from 0 to `value` on mount. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const count = useMotionValue(0);
  const text = useTransform(count, (latest) => latest.toFixed(decimals) + suffix);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.9, ease: EASE });
    return () => controls.stop();
  }, [value, count]);

  return <motion.span className={className}>{text}</motion.span>;
}
