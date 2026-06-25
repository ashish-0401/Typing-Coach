import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../lib/api';
import type { TypingSession } from '../lib/api';
import { compareTags, tagLabel } from '../lib/sessionTags';
import { cn } from '@/lib/utils';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';
import { Skeleton } from '../components/ui/Skeleton';
import { Reveal } from '../components/ui/motion';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function FilterChip({
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
        'cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors duration-200',
        active
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border bg-elevated text-muted hover:border-primary/30 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function SessionTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant={tag === 'drill' ? 'accent' : 'neutral'}>
          {tagLabel(tag)}
        </Badge>
      ))}
    </span>
  );
}

export function SessionHistoryPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const session of data ?? []) {
      for (const tag of session.tags ?? []) {
        set.add(tag);
      }
    }
    return Array.from(set).sort(compareTags);
  }, [data]);

  const sessions = useMemo(() => {
    const all = data ?? [];
    return activeTag
      ? all.filter((session) => session.tags?.includes(activeTag))
      : all;
  }, [data, activeTag]);

  return (
    <>
      <PageHeading
        title="Session History"
        subtitle="Every completed test, saved permanently."
      />

      {isPending && <Skeleton className="h-80 rounded-2xl" />}
      {isError && <p className="text-error">{error.message}</p>}

      {data && data.length === 0 && (
        <Reveal>
          <Card className="max-w-xl">
            <p className="text-muted">
              No sessions yet. Finish a typing test while logged in and it will
              appear here.
            </p>
          </Card>
        </Reveal>
      )}

      {data && data.length > 0 && (
        <Reveal>
          {allTags.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <FilterChip
                active={activeTag === null}
                onClick={() => setActiveTag(null)}
              >
                All
              </FilterChip>
              {allTags.map((tag) => (
                <FilterChip
                  key={tag}
                  active={activeTag === tag}
                  onClick={() => setActiveTag(tag)}
                >
                  {tagLabel(tag)}
                </FilterChip>
              ))}
            </div>
          )}

          <Card className="overflow-hidden p-0">
            <table className="w-full text-left font-mono text-sm">
              <thead className="border-b border-border bg-elevated/40 text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">WPM</th>
                  <th className="px-5 py-3.5 font-medium">Accuracy</th>
                  <th className="px-5 py-3.5 font-medium">Backspaces</th>
                  <th className="px-5 py-3.5 font-medium">Mistakes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sessions.map((session: TypingSession) => (
                  <tr
                    key={session._id}
                    className="transition-colors hover:bg-elevated/50"
                  >
                    <td className="px-5 py-3.5 text-foreground">
                      {formatDate(session.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <SessionTags tags={session.tags ?? []} />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-accent">
                      {session.wpm}
                    </td>
                    <td className="px-5 py-3.5 text-foreground">
                      {session.accuracy}%
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {session.backspaces}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {session.mistakes.length}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-6 text-center text-muted"
                    >
                      No sessions match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </Reveal>
      )}
    </>
  );
}
