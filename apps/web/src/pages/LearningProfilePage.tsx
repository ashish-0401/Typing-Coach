import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchLatestDiagnosis,
  fetchLearningProfile,
  runDiagnosis,
} from '../lib/api';
import type { Diagnosis, LearningProfile } from '../lib/api';
import { milestoneLabel } from '../lib/milestones';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

// Mirrors the backend's minimum; below this, analysis is not offered.
const MIN_SESSIONS_TO_ANALYZE = 3;

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

function ChipRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: 'neutral' | 'accent';
}) {
  const chipClass =
    tone === 'accent'
      ? 'rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-sm text-accent'
      : 'rounded-md border border-border bg-elevated px-3 py-1.5 font-mono text-sm text-foreground';
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={chipClass}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function DiagnosisView({
  profile,
  diagnosis,
}: {
  profile: LearningProfile;
  diagnosis: Diagnosis;
}) {
  const sessionLabel = diagnosis.basedOnSessions === 1 ? 'session' : 'sessions';
  return (
    <div className="mt-4 space-y-4">
      <p className="text-base text-foreground">{diagnosis.summary}</p>
      <p className="text-sm text-muted">{diagnosis.reasoning}</p>

      {diagnosis.patterns.length > 0 && (
        <ChipRow label="Patterns" items={diagnosis.patterns} tone="neutral" />
      )}
      {profile.strengths.length > 0 && (
        <ChipRow label="Strengths" items={profile.strengths} tone="accent" />
      )}
      {profile.learningStyle && (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Learning style
          </p>
          <p className="mt-1 text-sm text-foreground">{profile.learningStyle}</p>
        </div>
      )}

      <p className="font-mono text-xs text-muted">
        Based on {diagnosis.basedOnSessions} {sessionLabel} · analyzed{' '}
        {formatMilestoneDate(diagnosis.createdAt)}
      </p>
    </div>
  );
}

function AiInsightsCard({
  profile,
  diagnosis,
  diagnosisLoading,
  analyzing,
  analyzeError,
  onAnalyze,
}: {
  profile: LearningProfile;
  diagnosis: Diagnosis | null;
  diagnosisLoading: boolean;
  analyzing: boolean;
  analyzeError: string | null;
  onAnalyze: () => void;
}) {
  const enoughSessions = profile.totalSessions >= MIN_SESSIONS_TO_ANALYZE;

  return (
    <Card className="mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            AI insights
          </h2>
          <p className="mt-1 text-sm text-muted">
            A coach's read on what's holding you back.
          </p>
        </div>
        <Button onClick={onAnalyze} disabled={!enoughSessions || analyzing}>
          {analyzing ? 'Analyzing…' : diagnosis ? 'Re-analyze' : 'Analyze my typing'}
        </Button>
      </div>

      {analyzeError && <p className="mt-4 text-sm text-error">{analyzeError}</p>}

      {analyzing ? (
        <p className="mt-4 text-sm text-muted">
          Reading your recent sessions… this can take a few seconds.
        </p>
      ) : !enoughSessions ? (
        <p className="mt-4 text-sm text-muted">
          Finish a few tests first, then I can analyze your typing.
        </p>
      ) : diagnosis ? (
        <DiagnosisView profile={profile} diagnosis={diagnosis} />
      ) : diagnosisLoading ? (
        <p className="mt-4 text-sm text-muted">Loading your latest insight…</p>
      ) : !analyzeError ? (
        <p className="mt-4 text-sm text-muted">
          No analysis yet. Tap Analyze my typing and I'll spot the patterns in your
          mistakes.
        </p>
      ) : null}
    </Card>
  );
}

export function LearningProfilePage() {
  const queryClient = useQueryClient();
  const {
    data: profile,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['learning-profile'],
    queryFn: fetchLearningProfile,
  });
  const diagnosisQuery = useQuery({
    queryKey: ['diagnosis', 'latest'],
    queryFn: fetchLatestDiagnosis,
  });
  const analyzeMutation = useMutation({
    mutationFn: runDiagnosis,
    onSuccess: (diagnosis) => {
      queryClient.setQueryData(['diagnosis', 'latest'], diagnosis);
      void queryClient.invalidateQueries({ queryKey: ['learning-profile'] });
    },
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

      {/* AI insights: the coach's read, on demand. */}
      <AiInsightsCard
        profile={profile}
        diagnosis={diagnosisQuery.data ?? null}
        diagnosisLoading={diagnosisQuery.isPending}
        analyzing={analyzeMutation.isPending}
        analyzeError={
          analyzeMutation.isError ? analyzeMutation.error.message : null
        }
        onAnalyze={() => analyzeMutation.mutate()}
      />

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
