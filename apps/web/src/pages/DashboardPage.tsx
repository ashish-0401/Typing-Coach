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
import { Activity, Gauge, Target, Trophy } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { fetchAnalyticsSummary, fetchSessions } from '../lib/api';
import type { TypingSession } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';
import { Skeleton } from '../components/ui/Skeleton';
import { Sparkline } from '../components/ui/Sparkline';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { StatCard } from '../components/ui/StatCard';
import { Marquee } from '../components/ui/Marquee';
import { AnimatedNumber, Reveal, Stagger, StaggerItem } from '../components/ui/motion';

function shortDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    <div className="rounded-xl border border-border bg-elevated px-3 py-2 font-mono text-xs shadow-lg">
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
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="col-span-2 row-span-2 h-[15.5rem] rounded-2xl" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-72 rounded-2xl" />
      </>
    );
  }

  if (summaryQuery.isError || sessionsQuery.isError) {
    const message =
      summaryQuery.error?.message ??
      sessionsQuery.error?.message ??
      'Something went wrong.';
    return (
      <>
        {heading}
        <p className="text-error">{message}</p>
      </>
    );
  }

  const summary = summaryQuery.data;
  const sessions = sessionsQuery.data;

  if (summary.totalSessions === 0) {
    return (
      <>
        {heading}
        <Reveal>
          <Card className="max-w-xl">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              No sessions yet
            </h2>
            <p className="mt-1 text-muted">
              Take your first typing test and your WPM, accuracy and trend will
              appear right here.
            </p>
            <Button asChild className="mt-5">
              <Link to="/practice">Start a typing test</Link>
            </Button>
          </Card>
        </Reveal>
      </>
    );
  }

  const chartData = [...sessions].reverse().map((session: TypingSession) => ({
    label: shortDate(session.date),
    wpm: session.wpm,
    accuracy: session.accuracy,
  }));
  const recentWpm = chartData.map((point) => point.wpm);
  const recent = sessions.slice(0, 5);

  return (
    <>
      {heading}

      <Marquee
        items={[
          'Precision',
          'Speed',
          'Accuracy',
          'Consistency',
          'Rhythm',
          'Focus',
          'Flow',
        ]}
        className="mb-6 border-y border-border/60 py-2.5"
      />

      <Stagger className="grid grid-cols-4 auto-rows-fr gap-4">
        <StaggerItem className="col-span-2 row-span-2">
          <SpotlightCard className="flex h-full flex-col justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Average speed
              </span>
              <div className="mt-3 flex items-end gap-2">
                <span className="bg-gradient-to-br from-accent via-primary to-accent bg-clip-text font-mono text-7xl font-bold leading-none tabular-nums text-transparent">
                  <AnimatedNumber value={summary.averageWpm} />
                </span>
                <span className="mb-2 font-mono text-base text-muted">wpm</span>
              </div>
              <p className="mt-3 text-sm text-muted">
                Across {summary.totalSessions}{' '}
                {summary.totalSessions === 1 ? 'session' : 'sessions'},{' '}
                {greetingName}.
              </p>
            </div>
            {recentWpm.length > 1 && (
              <div className="mt-6 h-16 w-full">
                <Sparkline values={recentWpm} className="h-full w-full" />
              </div>
            )}
          </SpotlightCard>
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Best WPM"
            value={summary.bestWpm}
            hint="All time"
            icon={Trophy}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg accuracy"
            value={Math.round(summary.averageAccuracy)}
            suffix="%"
            hint="All sessions"
            icon={Target}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Current WPM"
            value={summary.currentWpm}
            hint="Latest test"
            icon={Gauge}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Sessions"
            value={summary.totalSessions}
            hint="Saved"
            icon={Activity}
          />
        </StaggerItem>
      </Stagger>

      <Reveal>
        <SpotlightCard className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {metric === 'wpm' ? 'WPM over time' : 'Accuracy over time'}
            </h2>
            <div className="flex items-center gap-1 rounded-lg bg-elevated p-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setMetric('wpm')}
                className={
                  'rounded-md px-3 py-1 transition-colors duration-200 cursor-pointer ' +
                  (metric === 'wpm'
                    ? 'bg-card text-accent shadow-sm'
                    : 'text-muted hover:text-foreground')
                }
              >
                wpm
              </button>
              <button
                type="button"
                onClick={() => setMetric('accuracy')}
                className={
                  'rounded-md px-3 py-1 transition-colors duration-200 cursor-pointer ' +
                  (metric === 'accuracy'
                    ? 'bg-card text-accent shadow-sm'
                    : 'text-muted hover:text-foreground')
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
                      <stop
                        offset="0%"
                        stopColor="var(--color-accent)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
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
                    strokeWidth={2.5}
                    fill="url(#metricFill)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SpotlightCard>
      </Reveal>

      <Reveal>
        <Card className="mt-4 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Recent sessions
            </h2>
            <Link
              to="/history"
              className="text-sm font-medium text-accent hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/60">
            {recent.map((session) => (
              <li
                key={session._id}
                className="flex items-center justify-between px-6 py-3.5 font-mono text-sm transition-colors hover:bg-elevated/50"
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
      </Reveal>
    </>
  );
}
