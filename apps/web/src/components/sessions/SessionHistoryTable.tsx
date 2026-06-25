import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchSessions } from '../../lib/api';
import type { TypingSession } from '../../lib/api';
import { compareTags, tagLabel } from '../../lib/sessionTags';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

const PAGE_SIZE = 10;

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

function PagerButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-elevated text-muted transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * The user's full, permanent session history: server-paginated, filterable by
 * the session tags (test config or "drill"). Self-contained, so the Dashboard
 * just drops it in.
 */
export function SessionHistoryTable() {
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['sessions', { page, tag: activeTag, limit: PAGE_SIZE }],
    queryFn: () =>
      fetchSessions({ page, limit: PAGE_SIZE, tag: activeTag ?? undefined }),
    placeholderData: (previous) => previous,
  });

  const tags = useMemo(
    () => [...(data?.tags ?? [])].sort(compareTags),
    [data?.tags],
  );

  function selectTag(tag: string | null) {
    setActiveTag(tag);
    setPage(1);
  }

  if (isPending) {
    return <Skeleton className="h-80 rounded-2xl" />;
  }
  if (isError) {
    return <p className="text-error">{error.message}</p>;
  }

  const items = data.items;
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterChip active={activeTag === null} onClick={() => selectTag(null)}>
            All
          </FilterChip>
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              active={activeTag === tag}
              onClick={() => selectTag(tag)}
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
            {items.map((session: TypingSession) => (
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
                <td className="px-5 py-3.5 text-muted">{session.backspaces}</td>
                <td className="px-5 py-3.5 text-muted">
                  {session.mistakes.length}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-muted">
                  No sessions match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between font-mono text-xs text-muted">
          <span>
            {total} {total === 1 ? 'session' : 'sessions'}
          </span>
          <div className="flex items-center gap-3">
            <PagerButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isPlaceholderData}
              label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </PagerButton>
            <span>
              Page {page} of {totalPages}
            </span>
            <PagerButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPlaceholderData}
              label="Next page"
            >
              <ChevronRight className="size-4" />
            </PagerButton>
          </div>
        </div>
      )}
    </div>
  );
}
