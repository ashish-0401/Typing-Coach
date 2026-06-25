import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../lib/api';
import type { TypingSession } from '../lib/api';
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

export function SessionHistoryPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

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
          <Card className="overflow-hidden p-0">
            <table className="w-full text-left font-mono text-sm">
              <thead className="border-b border-border bg-elevated/40 text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">WPM</th>
                  <th className="px-5 py-3.5 font-medium">Accuracy</th>
                  <th className="px-5 py-3.5 font-medium">Backspaces</th>
                  <th className="px-5 py-3.5 font-medium">Mistakes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.map((session: TypingSession) => (
                  <tr
                    key={session._id}
                    className="transition-colors hover:bg-elevated/50"
                  >
                    <td className="px-5 py-3.5 text-foreground">
                      {formatDate(session.date)}
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
              </tbody>
            </table>
          </Card>
        </Reveal>
      )}
    </>
  );
}
