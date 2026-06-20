import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../lib/api';

export function HealthPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  let statusLabel = 'Checking…';
  let statusColor = 'bg-gray-400';

  if (isError) {
    statusLabel = 'Unreachable';
    statusColor = 'bg-red-500';
  } else if (!isPending && data) {
    statusLabel = data.status;
    statusColor = data.status === 'ok' ? 'bg-green-500' : 'bg-yellow-500';
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">AI Practice Coach</h1>
        <p className="mt-1 text-sm text-gray-500">Phase 1 — project setup</p>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <span className={`h-3 w-3 rounded-full ${statusColor}`} />
          <span className="font-medium">API health: {statusLabel}</span>
        </div>

        {isError && (
          <p className="mt-3 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    </main>
  );
}
