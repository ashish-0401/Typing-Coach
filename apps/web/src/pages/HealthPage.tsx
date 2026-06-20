import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../lib/api';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

export function HealthPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  let statusLabel = 'Checking…';
  let statusColor = 'bg-muted';

  if (isError) {
    statusLabel = 'Unreachable';
    statusColor = 'bg-red-500';
  } else if (!isPending && data) {
    statusLabel = data.status;
    statusColor = data.status === 'ok' ? 'bg-accent' : 'bg-yellow-500';
  }

  return (
    <>
      <PageHeading title="API Health" subtitle="Live status of the backend /health endpoint." />
      <Card className="flex max-w-md items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${statusColor}`} />
        <span className="font-medium text-foreground">API health: {statusLabel}</span>
      </Card>
      {isError && <p className="mt-3 text-sm text-red-600">{error.message}</p>}
    </>
  );
}
