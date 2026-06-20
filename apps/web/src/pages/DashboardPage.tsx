import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../lib/auth';
import { fetchAnalyticsSummary, fetchSessions } from '../lib/api';
import type { TypingSession } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

function shortDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
      <div className="mt-2 font-mono text-4xl font-semibold tabular-nums text-accent">{value}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </Card>
  );
}

interface ChartPoint {
  label: string;
  wpm: number;
  accuracy: number;
}

function ChartTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-elevated px-3 py-2 font-mono text-xs shadow-xl shadow-black/30">
      <p className="text-muted">{point.label}</p>
      <p className="mt-1 text-accent">{point.wpm} wpm</p>
      <p className="text-foreground">{point.accuracy}% accuracy</p>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const greetingName = user?.name ?? 'there';
  const [metric, setMetric] = useState<'wpm' | 'accuracy'>('wpm');

  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: fetchAnalyticsSummary,
  });
  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

  const heading = (
    <PageHeading
      title="Your progress"
      subtitle={`Here's how your typing is trending, ${greetingName}.`}
    />
  );

  if (summaryQuery.isPending || sessionsQuery.isPending) {
    return (
      <>
        {heading}
        <p className="text-muted">Loading your stats…</p>
      </>
    );
  }

  if (summaryQuery.isError || sessionsQuery.isError) {
    const message =
      summaryQuery.error?.message ?? sessionsQuery.error?.message ?? 'Something went wrong.';
    return (
      <>
        {heading}
        <p className="text-error">{message}</p>
      </>
    );
  }

  const summary = summaryQuery.data;
  const sessions = sessionsQuery.data;

  // Empty state.
  if (summary.totalSessions === 0) {
    return (
      <>
        {heading}
        <Card className="max-w-xl">
          <h2 className="font-heading text-lg font-semibold text-foreground">No sessions yet</h2>
          <p className="mt-1 text-muted">
            Take your first typing test and your WPM, accuracy and trend will appear right here.
          </p>
          <Link to="/" className="mt-5 inline-block">
            <Button>Start a typing test</Button>
          </Link>
        </Card>
      </>
    );
  }

  // Chronological data for the trend chart.
  const chartData = [...sessions]
    .reverse()
    .map((session: TypingSession) => ({
      label: shortDate(session.date),
      wpm: session.wpm,
      accuracy: session.accuracy,
    }));
  const recent = sessions.slice(0, 5);

  return (
    <>
      {heading}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Avg WPM" value={String(summary.averageWpm)} hint="All sessions" />
        <StatCard label="Avg accuracy" value={`${summary.averageAccuracy}%`} hint="All sessions" />
        <StatCard label="Best WPM" value={String(summary.bestWpm)} hint="All time" />
        <StatCard label="Sessions" value={String(summary.totalSessions)} hint="Saved" />
      </div>

      {/* Performance over time */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {metric === 'wpm' ? 'WPM over time' : 'Accuracy over time'}
          </h2>
          <div className="flex items-center gap-1 rounded-lg bg-background p-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setMetric('wpm')}
              className={
                'rounded-md px-3 py-1 transition-colors duration-200 cursor-pointer ' +
                (metric === 'wpm' ? 'bg-card text-accent' : 'text-muted hover:text-foreground')
              }
            >
              wpm
            </button>
            <button
              type="button"
              onClick={() => setMetric('accuracy')}
              className={
                'rounded-md px-3 py-1 transition-colors duration-200 cursor-pointer ' +
                (metric === 'accuracy' ? 'bg-card text-accent' : 'text-muted hover:text-foreground')
              }
            >
              accuracy
            </button>
          </div>
        </div>
        {chartData.length < 2 ? (
          <p className="mt-2 text-sm text-muted">
            Complete one more test to start seeing your trend.
          </p>
        ) : (
          <div className="mt-4 h-64 w-full" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                accessibilityLayer={false}
              >
                <defs>
                  <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={metric === 'accuracy' ? [0, 100] : [0, 'auto']}
                  unit={metric === 'accuracy' ? '%' : ''}
                  stroke="var(--color-muted)"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--color-border)' }}
                  content={<ChartTooltip />}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  fill="url(#metricFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Recent sessions */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Recent sessions</h2>
          <Link to="/history" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-border/50">
          {recent.map((session) => (
            <li
              key={session._id}
              className="flex items-center justify-between px-6 py-3 font-mono text-sm"
            >
              <span className="text-muted">{shortDate(session.date)}</span>
              <span className="flex items-center gap-6">
                <span className="text-accent">{session.wpm} wpm</span>
                <span className="text-foreground">{session.accuracy}%</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
