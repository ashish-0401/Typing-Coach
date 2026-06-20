import { useAuth } from '../lib/auth';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

export function DashboardPage() {
  const user = useAuth((s) => s.user);

  return (
    <>
      <PageHeading
        title="Dashboard"
        subtitle={user ? `Signed in as ${user.email}` : undefined}
      />
      <Card className="max-w-xl">
        <p className="text-muted">
          Your typing stats, best WPM, accuracy and session history will appear here once the
          typing test is built.
        </p>
      </Card>
    </>
  );
}
