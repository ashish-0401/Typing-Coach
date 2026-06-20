import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  const justSignedUp = (location.state as { justSignedUp?: boolean } | null)?.justSignedUp ?? false;
  const greetingName = user?.name ?? 'there';

  return (
    <>
      <PageHeading
        title={justSignedUp ? `Welcome aboard, ${greetingName}` : `Welcome back, ${greetingName}`}
        subtitle={
          justSignedUp
            ? 'Your account is ready. Finish a typing test and your progress shows up here.'
            : "Here's where your progress lives. Keep practicing to build your history."
        }
      />
      <Card className="max-w-xl">
        <p className="text-muted">
          Your typing stats, best WPM, accuracy and session history will appear here once the
          dashboard is built.
        </p>
      </Card>
    </>
  );
}
