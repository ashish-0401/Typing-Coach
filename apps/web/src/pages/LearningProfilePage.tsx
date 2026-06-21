import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchLearningProfile } from '../lib/api';
import { milestoneLabel } from '../lib/milestones';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
      <div className="mt-2 font-mono text-4xl font-semibold tabular-nums text-accent">{value}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </Card>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-accent"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function formatMilestoneDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function LearningProfilePage() {
  const { data: profile, isPending, isError, error } = useQuery({
    queryKey: ['learning-profile'],
    queryFn: fetchLearningProfile,
  });

  const heading = (
    <PageHeading
      title="Learning Profile"
      subtitle="A living snapshot of your typing, updated after every test."
    />
  );

  if (isPending) {
    return (
      <>
        {heading}
        <p className="text-muted">Loading your profile…</p>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {heading}
        <p className="text-error">{error.message}</p>
      </>
    );
  }

  // Empty state: no sessions yet, so there is nothing to derive a profile from.
  if (profile.totalSessions === 0) {
    return (
      <>
        {heading}
        <Card className="max-w-xl">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            No profile yet
          </h2>
          <p className="mt-1 text-muted">
            Finish a few tests to build your profile. We'll track your speed, accuracy
            and the words that trip you up.
          </p>
          <Link to="/" className="mt-5 inline-block">
            <Button>Start a typing test</Button>
          </Link>
        </Card>
      </>
    );
  }

  const sessionLabel = profile.totalSessions === 1 ? 'session' : 'sessions';

  return (
    <>
      <PageHeading
        title="Learning Profile"
        subtitle={`Built from your ${profile.totalSessions} saved ${sessionLabel}.`}
      />

      {/* Headline stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Current WPM" value={String(profile.currentWpm)} hint="Latest test" />
        <StatCard label="Avg WPM" value={String(profile.averageWpm)} hint="All sessions" />
        <StatCard label="Best WPM" value={String(profile.bestWpm)} hint="All time" />
        <StatCard
          label="Avg accuracy"
          value={`${profile.averageAccuracy}%`}
          hint="All sessions"
        />
      </div>

      {/* Plateau hint: a calm nudge, only when we detect a stall. */}
      {profile.plateauDetected && (
        <Card className="mt-6 border-accent/30 bg-accent/5">
          <div className="flex items-start gap-3">
            <InfoIcon />
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Your pace has plateaued
              </h2>
              <p className="mt-1 text-sm text-muted">
                Your best WPM hasn't moved across your last few sessions. A short, focused
                drill on your weak words is a good way to break through.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Weaknesses */}
      <Card className="mt-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Weaknesses</h2>
        <p className="mt-1 text-sm text-muted">The words you mistype most often.</p>
        {profile.primaryWeaknesses.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No recurring mistakes yet. Clean typing.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.primaryWeaknesses.map((word) => (
              <span
                key={word}
                className="rounded-md border border-border bg-elevated px-3 py-1.5 font-mono text-sm text-foreground"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Milestones */}
      <Card className="mt-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Milestones</h2>
        {profile.milestones.length === 0 ? (
          <p className="mt-1 text-sm text-muted">
            Achievements like personal bests and streaks will appear here as you reach them.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {profile.milestones.map((milestone, index) => (
              <li
                key={`${milestone.type}-${milestone.value}-${index}`}
                className="flex items-center gap-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <AwardIcon />
                </span>
                <div>
                  <p className="text-sm text-foreground">{milestoneLabel(milestone)}</p>
                  <p className="font-mono text-xs text-muted">
                    {formatMilestoneDate(milestone.achievedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
