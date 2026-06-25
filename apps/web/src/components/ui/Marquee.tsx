import { cn } from '@/lib/utils';

/** An infinite horizontal marquee of words, looping seamlessly. */
export function Marquee({
  items,
  className,
  duration = 32,
}: {
  items: string[];
  className?: string;
  duration?: number;
}) {
  const group = (
    <div className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <span
          key={index}
          className="flex items-center gap-6 whitespace-nowrap px-6 font-mono text-sm uppercase tracking-[0.3em] text-muted"
        >
          {item}
          <span className="size-1 rounded-full bg-accent" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        'flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]',
        className,
      )}
    >
      <div
        className="flex w-max"
        style={{ animation: `marquee ${duration}s linear infinite` }}
      >
        {group}
        {group}
      </div>
    </div>
  );
}
