import type { ReactNode } from 'react';
import {
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface WpmSample {
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

export interface SessionResult {
  wpm: number;
  accuracy: number;
  backspaces: number;
  correctChars: number;
  incorrectChars: number;
  mistypedWords: string[];
  durationMs: number;
  testType: string;
  samples: WpmSample[];
}

export function ResultStat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </span>
      <span
        className={
          'font-mono font-semibold tabular-nums ' +
          (emphasis
            ? 'bg-gradient-to-br from-accent to-primary bg-clip-text text-6xl text-transparent'
            : 'text-3xl text-foreground')
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Shared results panel for a finished typing session: the headline wpm/accuracy,
 * the per-second wpm/raw/errors chart, the detail stats and mistyped words.
 * Callers pass their own `actions` (buttons) and optional `footer`, so the same
 * panel serves the Practice test and the in-page drill runner.
 */
export function Results({
  result,
  actions,
  footer,
}: {
  result: SessionResult;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  const chartData = result.samples.map((s) => ({
    ...s,
    errorPoint: s.errors > 0 ? s.errors : null,
  }));

  return (
    <div className="py-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
      <div className="flex flex-wrap items-end gap-12">
        <ResultStat label="wpm" value={String(Math.round(result.wpm))} emphasis />
        <ResultStat
          label="accuracy"
          value={`${result.accuracy.toFixed(0)}%`}
          emphasis
        />
      </div>

      {result.samples.length > 1 && (
        <div className="mt-8">
          <div className="mb-2 flex items-center gap-4 font-mono text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> wpm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted" /> raw
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-error">&#10005;</span> errors
            </span>
          </div>
          <div className="h-44 w-full" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                accessibilityLayer={false}
              >
                <XAxis
                  dataKey="t"
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  unit="s"
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: 'var(--color-foreground)',
                  }}
                  labelFormatter={(t) => `${String(t)}s`}
                  formatter={(value, name) =>
                    name === 'errorPoint'
                      ? [`${String(value)}`, 'errors']
                      : [`${String(value)} wpm`, String(name)]
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="raw"
                  stroke="var(--color-muted)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wpm"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 2, fill: 'var(--color-accent)' }}
                  isAnimationActive={false}
                />
                <Scatter
                  yAxisId="right"
                  dataKey="errorPoint"
                  fill="var(--color-error)"
                  shape="cross"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <ResultStat label="test" value={result.testType} />
        <ResultStat
          label="characters"
          value={`${result.correctChars}/${result.incorrectChars}`}
        />
        <ResultStat label="backspaces" value={String(result.backspaces)} />
        <ResultStat
          label="time"
          value={`${(result.durationMs / 1000).toFixed(0)}s`}
        />
      </div>

      <div className="mt-8">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
          Mistyped words
        </h3>
        {result.mistypedWords.length === 0 ? (
          <p className="mt-2 text-muted">None. Clean run!</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {result.mistypedWords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-error/20 bg-error/10 px-3 py-1 font-mono text-xs text-error"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>

      {(actions || footer) && (
        <div className="mt-10 flex items-center gap-5">
          {actions}
          {footer}
        </div>
      )}
    </div>
  );
}
