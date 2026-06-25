import { motion } from 'motion/react';

/** A compact line chart that draws its path on mount. */
export function Sparkline({
  values,
  className,
  height = 56,
}: {
  values: number[];
  className?: string;
  height?: number;
}) {
  if (values.length < 2) {
    return null;
  }

  const width = 240;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((value - min) / range) * (height - 2 * pad);
    return { x, y };
  });

  const line = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const area = `${line} L ${width - pad},${height} L ${pad},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill="url(#sparkFill)"
        stroke="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
    </svg>
  );
}
