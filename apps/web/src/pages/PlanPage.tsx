import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  Gauge,
  Loader2,
  Minus,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  fetchLatestPlan,
  fetchLearningProfile,
  fetchPlans,
  runCoachingCycle,
} from '../lib/api';
import type {
  PlanEvaluation,
  PlanGoal,
  RecommendedDrill,
  TrainingPlan,
} from '../lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';
import { Skeleton } from '../components/ui/Skeleton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Reveal } from '../components/ui/motion';

// Mirror the backend guard so we can disable the run button before asking.
const MIN_SESSIONS_FOR_PLAN = 3;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function goalLabel(goal: PlanGoal): string {
  return goal.metric === 'accuracy'
    ? `Reach ${goal.target}% accuracy`
    : `Reach ${goal.target} WPM`;
}

function DeltaStat({
  label,
  delta,
  suffix = '',
}: {
  label: string;
  delta: number;
  suffix?: string;
}) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone =
    delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-muted';
  const sign = delta > 0 ? '+' : '';
  return (
    <div className="rounded-xl border border-border bg-elevated px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 flex items-center gap-1.5 font-mono text-2xl font-semibold tabular-nums',
          tone,
        )}
      >
        <Icon className="size-5" />
        {sign}
        {delta}
        {suffix}
      </p>
    </div>
  );
}

function EvaluationView({ evaluation }: { evaluation: PlanEvaluation }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Since your last plan
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <DeltaStat label="WPM change" delta={evaluation.wpmDelta} />
        <DeltaStat
          label="Accuracy change"
          delta={evaluation.accuracyDelta}
          suffix="%"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {evaluation.metGoals.length > 0 ? (
          evaluation.metGoals.map((metric) => (
            <Badge key={metric} variant="success">
              <CheckCircle2 className="size-3.5" />
              {metric === 'wpm' ? 'WPM goal met' : 'Accuracy goal met'}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted">No goals met yet. Keep going.</p>
        )}
      </div>
    </div>
  );
}

function GoalsView({ goals }: { goals: PlanGoal[] }) {
  if (goals.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Goals
      </p>
      <ul className="mt-3 space-y-3">
        {goals.map((goal, index) => {
          const Icon = goal.metric === 'accuracy' ? Target : Gauge;
          return (
            <li key={`${goal.metric}-${index}`} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-accent ring-1 ring-primary/15">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="font-medium text-foreground">{goalLabel(goal)}</p>
                {goal.rationale && (
                  <p className="mt-0.5 text-sm text-muted">{goal.rationale}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecommendedDrills({
  drills,
  currentWeaknesses,
  onPractice,
}: {
  drills: RecommendedDrill[];
  currentWeaknesses: string[];
  onPractice: (drill: RecommendedDrill) => void;
}) {
  if (drills.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Recommended drills
      </p>
      <ul className="mt-3 space-y-3">
        {drills.map((drill, index) => {
          const stale = !currentWeaknesses.includes(drill.weakness);
          return (
            <li key={`${drill.weakness}-${index}`}>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-elevated px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{drill.weakness}</Badge>
                    <Badge variant="mono">{drill.difficulty}</Badge>
                  </div>
                  {stale && (
                    <p className="mt-1.5 text-xs text-muted">
                      No longer one of your top weaknesses, still worth a pass.
                    </p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onPractice(drill)}
                >
                  <Play className="size-4" />
                  Practice
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CurrentPlanCard({
  plan,
  currentWeaknesses,
  onPractice,
}: {
  plan: TrainingPlan;
  currentWeaknesses: string[];
  onPractice: (drill: RecommendedDrill) => void;
}) {
  return (
    <SpotlightCard className="ring-1 ring-primary/10">
      <p className="text-lg leading-relaxed text-foreground">{plan.summary}</p>

      {plan.evaluation ? (
        <div className="mt-6">
          <EvaluationView evaluation={plan.evaluation} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          This is your first plan, so there is nothing to compare yet. The next
          cycle will measure your progress against it.
        </p>
      )}

      {plan.targetWeaknesses.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Focus this cycle
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.targetWeaknesses.map((weakness) => (
              <Badge key={weakness} variant="accent">
                {weakness}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <GoalsView goals={plan.goals} />
      </div>

      <div className="mt-6">
        <RecommendedDrills
          drills={plan.recommendedDrills}
          currentWeaknesses={currentWeaknesses}
          onPractice={onPractice}
        />
      </div>

      <p className="mt-6 font-mono text-xs text-muted">
        Planned {formatDate(plan.createdAt)}
      </p>
    </SpotlightCard>
  );
}

function RunCard({
  hasPlan,
  tooFew,
  running,
  error,
  onRun,
}: {
  hasPlan: boolean;
  tooFew: boolean;
  running: boolean;
  error: string | null;
  onRun: () => void;
}) {
  return (
    <SpotlightCard className="ring-1 ring-primary/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-accent ring-1 ring-primary/15">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
              {hasPlan ? 'Run another coaching cycle' : 'Your coaching cycle'}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              I review your recent typing, recall your history, and plan the next
              stretch.
            </p>
          </div>
        </div>
        <Button onClick={onRun} disabled={running || tooFew}>
          {running ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {running ? 'Thinking' : hasPlan ? 'Run again' : 'Run coaching cycle'}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      {running ? (
        <p className="mt-4 text-sm text-muted">
          Thinking through your plan, this can take a few seconds.
        </p>
      ) : tooFew ? (
        <p className="mt-4 text-sm text-muted">
          Take a few real typing tests first so I have enough to plan from.{' '}
          <Link to="/practice" className="text-accent hover:underline">
            Start a test
          </Link>
          .
        </p>
      ) : !hasPlan && !error ? (
        <p className="mt-4 text-sm text-muted">
          No plan yet. Run your first cycle and I&apos;ll set goals and pick
          drills from your real weaknesses.
        </p>
      ) : null}
    </SpotlightCard>
  );
}

function HistoryItem({ plan }: { plan: TrainingPlan }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">
            {formatDate(plan.createdAt)}
          </p>
          <p
            className={cn('mt-1 text-sm text-foreground', !open && 'truncate')}
          >
            {plan.summary}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          {plan.targetWeaknesses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plan.targetWeaknesses.map((weakness) => (
                <Badge key={weakness} variant="accent">
                  {weakness}
                </Badge>
              ))}
            </div>
          )}
          {plan.goals.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {plan.goals.map((goal, index) => (
                <li
                  key={`${goal.metric}-${index}`}
                  className="text-sm text-muted"
                >
                  {goalLabel(goal)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function PlanHistory({ plans }: { plans: TrainingPlan[] }) {
  if (plans.length === 0) {
    return null;
  }
  return (
    <div className="mt-8">
      <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
        Past plans
      </h2>
      <div className="space-y-3">
        {plans.map((plan) => (
          <HistoryItem key={plan._id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

export function PlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const latestPlanQuery = useQuery({
    queryKey: ['plans', 'latest'],
    queryFn: fetchLatestPlan,
    refetchOnWindowFocus: false,
  });
  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    refetchOnWindowFocus: false,
  });
  const profileQuery = useQuery({
    queryKey: ['learning-profile'],
    queryFn: fetchLearningProfile,
    refetchOnWindowFocus: false,
  });

  const runMutation = useMutation({
    mutationFn: runCoachingCycle,
    onSuccess: (plan) => {
      // The new plan is now the current one; refresh history and any AI fields
      // a fresh diagnosis may have updated.
      queryClient.setQueryData(['plans', 'latest'], plan);
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      void queryClient.invalidateQueries({ queryKey: ['learning-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['diagnosis', 'latest'] });
    },
  });

  const heading = (
    <PageHeading
      title="Training Plan"
      subtitle="Your coach reviews your real history, then plans the next stretch."
    />
  );

  if (latestPlanQuery.isPending || profileQuery.isPending) {
    return (
      <>
        {heading}
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="mt-4 h-64 rounded-2xl" />
      </>
    );
  }

  if (latestPlanQuery.isError) {
    return (
      <>
        {heading}
        <Card>
          <p className="text-sm text-error">{latestPlanQuery.error.message}</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void latestPlanQuery.refetch()}
          >
            Try again
          </Button>
        </Card>
      </>
    );
  }

  const currentPlan = latestPlanQuery.data;
  const allPlans = plansQuery.data ?? [];
  const pastPlans = currentPlan
    ? allPlans.filter((plan) => plan._id !== currentPlan._id)
    : allPlans;
  const totalSessions = profileQuery.data?.totalSessions ?? 0;
  const tooFew = profileQuery.isSuccess && totalSessions < MIN_SESSIONS_FOR_PLAN;
  const currentWeaknesses = profileQuery.data?.primaryWeaknesses ?? [];

  function practice(drill: RecommendedDrill) {
    navigate('/exercises', {
      state: { weakness: drill.weakness, difficulty: drill.difficulty },
    });
  }

  return (
    <>
      {heading}

      <Reveal>
        <RunCard
          hasPlan={currentPlan !== null}
          tooFew={tooFew}
          running={runMutation.isPending}
          error={runMutation.isError ? runMutation.error.message : null}
          onRun={() => runMutation.mutate()}
        />
      </Reveal>

      {currentPlan && (
        <Reveal>
          <div className="mt-4">
            <CurrentPlanCard
              plan={currentPlan}
              currentWeaknesses={currentWeaknesses}
              onPractice={practice}
            />
          </div>
        </Reveal>
      )}

      <PlanHistory plans={pastPlans} />
    </>
  );
}
