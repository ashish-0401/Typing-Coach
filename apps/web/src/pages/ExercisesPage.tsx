import { useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dumbbell, Loader2, Play, Sparkles, Trash2 } from 'lucide-react';
import {
  deleteExercise,
  fetchExercises,
  fetchLatestDiagnosis,
  fetchLearningProfile,
  generateExercise,
} from '../lib/api';
import type { ExerciseDifficulty, GeneratedExercise } from '../lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeading } from '../components/ui/PageHeading';
import { Skeleton } from '../components/ui/Skeleton';
import { DrillRunner } from '../components/typing/DrillRunner';

const DIFFICULTIES: ExerciseDifficulty[] = ['easy', 'medium', 'hard'];

/** Weakness/difficulty handed in when navigating from the Training Plan. */
interface DrillPrefill {
  weakness?: string;
  difficulty?: ExerciseDifficulty;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200',
        active
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border bg-elevated text-muted hover:border-primary/30 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function ExercisesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // A Practice action on the Training Plan navigates here with a prefilled
  // weakness and difficulty.
  const prefill = (location.state as DrillPrefill | null) ?? null;

  const profileQuery = useQuery({
    queryKey: ['learning-profile'],
    queryFn: fetchLearningProfile,
    refetchOnWindowFocus: false,
  });
  const diagnosisQuery = useQuery({
    queryKey: ['diagnosis', 'latest'],
    queryFn: fetchLatestDiagnosis,
    refetchOnWindowFocus: false,
  });
  const exercisesQuery = useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    refetchOnWindowFocus: false,
  });

  const [selectedWeakness, setSelectedWeakness] = useState<string | null>(
    prefill?.weakness ?? null,
  );
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>(
    prefill?.difficulty ?? 'medium',
  );
  const [activeDrill, setActiveDrill] = useState<GeneratedExercise | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Stay grounded in real data: only offer weaknesses the user actually has,
  // plus any weakness handed in from the Training Plan (even if it is no longer
  // one of their current top weaknesses).
  const weaknessOptions = useMemo(() => {
    const fromProfile = profileQuery.data?.primaryWeaknesses ?? [];
    const fromDiagnosis = diagnosisQuery.data?.patterns ?? [];
    const merged = [...fromProfile, ...fromDiagnosis];
    if (selectedWeakness && !merged.includes(selectedWeakness)) {
      merged.unshift(selectedWeakness);
    }
    return Array.from(new Set(merged));
  }, [profileQuery.data, diagnosisQuery.data, selectedWeakness]);

  // Default to the top weakness until the user picks one, derived rather than
  // stored in state (avoids a setState-in-effect cascade).
  const weakness = selectedWeakness ?? weaknessOptions[0] ?? null;

  const generateMutation = useMutation({
    mutationFn: generateExercise,
    onSuccess: (created) => {
      queryClient.setQueryData<GeneratedExercise[]>(['exercises'], (old) => [
        created,
        ...(old ?? []),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<GeneratedExercise[]>(['exercises'], (old) =>
        (old ?? []).filter((exercise) => exercise._id !== id),
      );
      setConfirmingId(null);
    },
  });

  const canGenerate = weakness !== null && !generateMutation.isPending;

  function generate() {
    if (!weakness || generateMutation.isPending) {
      return;
    }
    generateMutation.mutate({ weakness, difficulty });
  }

  function practice(exercise: GeneratedExercise) {
    setActiveDrill(exercise);
  }

  const profileLoading = profileQuery.isPending || diagnosisQuery.isPending;
  const hasWeaknesses = weaknessOptions.length > 0;
  const exercises = exercisesQuery.data ?? [];

  // Run a drill in place, taking over the page until the user exits.
  if (activeDrill) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <DrillRunner
            exercise={activeDrill}
            onExit={() => setActiveDrill(null)}
          />
        </Card>
      </div>
    );
  }

  // First run: nothing to train yet, so invite the user to build the data the
  // drills are made from instead of showing an empty generator.
  if (
    !profileLoading &&
    !exercisesQuery.isPending &&
    !hasWeaknesses &&
    exercises.length === 0
  ) {
    return (
      <>
        <PageHeading
          title="Drills"
          subtitle="Generate a focused passage that targets one of your weak spots, then type it."
        />
        <EmptyState
          icon={Dumbbell}
          eyebrow="Drills"
          title="No weak spots to train yet"
          description="Your drills are built from your real weaknesses. Take a few typing tests, then run a diagnosis so your coach knows what to work on."
          action={
            <Button onClick={() => navigate('/practice')}>
              <Play className="size-4" />
              Take a test
            </Button>
          }
          secondary={
            <Button variant="outline" onClick={() => navigate('/insights')}>
              Run a diagnosis
            </Button>
          }
        />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="Drills"
        subtitle="Generate a focused passage that targets one of your weak spots, then type it."
      />

      <Card>
        {profileLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : !hasWeaknesses ? (
          <div className="py-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              No weak spots to train yet
            </h2>
            <p className="mt-1 text-sm text-muted">
              Your drills are built from your real weaknesses. Finish a few
              typing tests, then run a diagnosis so the coach knows what to work
              on.
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/practice')}>
                Take a test
              </Button>
              <Button variant="outline" onClick={() => navigate('/insights')}>
                Run a diagnosis
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Weakness
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {weaknessOptions.map((option) => (
                  <Pill
                    key={option}
                    active={weakness === option}
                    onClick={() => setSelectedWeakness(option)}
                  >
                    {option}
                  </Pill>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Difficulty
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DIFFICULTIES.map((option) => (
                  <Pill
                    key={option}
                    active={difficulty === option}
                    onClick={() => setDifficulty(option)}
                  >
                    {option}
                  </Pill>
                ))}
              </div>
            </div>

            {generateMutation.isError && (
              <p className="text-sm text-error">
                {generateMutation.error.message}
              </p>
            )}

            <Button onClick={generate} disabled={!canGenerate}>
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Writing your drill...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate drill
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
          Your drills
        </h2>

        {exercisesQuery.isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : exercisesQuery.isError ? (
          <Card>
            <p className="text-sm text-error">{exercisesQuery.error.message}</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void exercisesQuery.refetch()}
            >
              Try again
            </Button>
          </Card>
        ) : exercises.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-accent ring-1 ring-primary/15">
                <Dumbbell className="size-6" />
              </span>
              <p className="mt-4 text-sm text-muted">
                No drills yet.{' '}
                {hasWeaknesses
                  ? 'Generate your first one above.'
                  : 'Run a diagnosis first, then generate one.'}
              </p>
            </div>
          </Card>
        ) : (
          <ul className="space-y-3">
            {exercises.map((exercise) => (
              <li key={exercise._id}>
                <Card className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold text-foreground">
                      {exercise.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="accent">{exercise.weakness}</Badge>
                      <Badge variant="mono">{exercise.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {confirmingId === exercise._id ? (
                      <>
                        <span className="font-mono text-xs text-muted">
                          Delete?
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(exercise._id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => practice(exercise)}
                        >
                          <Play className="size-4" />
                          Practice
                        </Button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(exercise._id)}
                          aria-label="Delete drill"
                          title="Delete drill"
                          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-elevated text-muted transition-colors hover:border-error/40 hover:text-error"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
