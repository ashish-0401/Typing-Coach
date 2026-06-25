import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Award,
  Gauge,
  Loader2,
  Sparkles,
  Target,
  TrendingDown,
  Trophy,
} from 'lucide-react';
import {
  fetchLatestDiagnosis,
  fetchLearningProfile,
  runDiagnosis,
} from '../lib/api';
import type { Diagnosis, LearningProfile } from '../lib/api';
import { milestoneLabel } from '../lib/milestones';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';
import { Skeleton } from '../components/ui/Skeleton';
import { StatCard } from '../components/ui/StatCard';
import { Reveal, Stagger, StaggerItem } from '../components/ui/motion';

const MIN_SESSIONS_TO_ANALYZE = 3;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ChipRow({
  label,
  items,
  variant,
}: {
  label: string;
  items: string[];
  variant: 'mono' | 'accent' | 'success';
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant={variant}>
            {item}
          </Badge>
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
    <div className="mt-5 space-y-5">
      <p className="text-base leading-relaxed text-foreground">
        {diagnosis.summary}
      </p>
      <p className="text-sm leading-relaxed text-muted">{diagnosis.reasoning}</p>

      {diagnosis.patterns.length > 0 && (
        <ChipRow label="Patterns" items={diagnosis.patterns} variant="accent" />
      )}
      {profile.strengths.length > 0 && (
        <ChipRow label="Strengths" items={profile.strengths} variant="success" />
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
        Based on {diagnosis.basedOnSessions} {sessionLabel} &middot; analyzed{' '}
        {formatDate(diagnosis.createdAt)}
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
    <Card className="relative overflow-hidden ring-1 ring-primary/10">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-accent ring-1 ring-primary/15">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              AI insights
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              A coach&apos;s read on what&apos;s holding you back.
            </p>
          </div>
        </div>
        <Button onClick={onAnalyze} disabled={!enoughSessions || analyzing}>
          {analyzing && <Loader2 className="animate-spin" />}
          {analyzing ? 'Analyzing' : diagnosis ? 'Re-analyze' : 'Analyze my typing'}
        </Button>
      </div>

      {analyzeError && (
        <p className="relative mt-4 text-sm text-error">{analyzeError}</p>
      )}

      {analyzing ? (
        <p className="relative mt-5 text-sm text-muted">
          Reading your recent sessions, this can take a few seconds.
        </p>
      ) : !enoughSessions ? (
        <p className="relative mt-5 text-sm text-muted">
          Finish a few tests first, then I can analyze your typing.
        </p>
      ) : diagnosis ? (
        <DiagnosisView profile={profile} diagnosis={diagnosis} />
      ) : diagnosisLoading ? (
        <p className="relative mt-5 text-sm text-muted">
          Loading your latest insight...
        </p>
      ) : !analyzeError ? (
        <p className="relative mt-5 text-sm text-muted">
          No analysis yet. Tap Analyze my typing and I&apos;ll spot the patterns
          in your mistakes.
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
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-40 rounded-2xl" />
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

  if (profile.totalSessions === 0) {
    return (
      <>
        {heading}
        <Reveal>
          <Card className="max-w-xl">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              No profile yet
            </h2>
            <p className="mt-1 text-muted">
              Finish a few tests to build your profile. We&apos;ll track your
              speed, accuracy and the words that trip you up.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Start a typing test</Link>
            </Button>
          </Card>
        </Reveal>
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

      <Stagger className="grid grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Current WPM"
            value={profile.currentWpm}
            hint="Latest test"
            icon={Gauge}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg WPM"
            value={profile.averageWpm}
            hint="All sessions"
            icon={Activity}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Best WPM"
            value={profile.bestWpm}
            hint="All time"
            icon={Trophy}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Avg accuracy"
            value={Math.round(profile.averageAccuracy)}
            suffix="%"
            hint="All sessions"
            icon={Target}
          />
        </StaggerItem>
      </Stagger>

      {profile.plateauDetected && (
        <Reveal delay={0.05}>
          <Card className="mt-6 border-accent/30 bg-accent/5">
            <div className="flex items-start gap-3">
              <TrendingDown className="size-5 shrink-0 text-accent" />
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Your pace has plateaued
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Your best WPM hasn&apos;t moved across your last few sessions. A
                  short, focused drill on your weak words is a good way to break
                  through.
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <div className="mt-6">
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
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <Card className="mt-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Weaknesses
          </h2>
          <p className="mt-1 text-sm text-muted">
            The words you mistype most often.
          </p>
          {profile.primaryWeaknesses.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No recurring mistakes yet. Clean typing.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.primaryWeaknesses.map((word) => (
                <Badge key={word} variant="mono">
                  {word}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      <Reveal delay={0.2}>
        <Card className="mt-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Milestones
          </h2>
          {profile.milestones.length === 0 ? (
            <p className="mt-1 text-sm text-muted">
              Achievements like personal bests and streaks will appear here as you
              reach them.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {profile.milestones.map((milestone, index) => (
                <li
                  key={`${milestone.type}-${milestone.value}-${index}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent ring-1 ring-primary/15">
                    <Award className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      {milestoneLabel(milestone)}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {formatDate(milestone.achievedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>
    </>
  );
}
