import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';

export interface AnalyticsSummary {
  currentWpm: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  totalSessions: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly sessionsService: SessionsService) {}

  async summary(userId: string): Promise<AnalyticsSummary> {
    const sessions = await this.sessionsService.findByUser(userId);
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return {
        currentWpm: 0,
        averageWpm: 0,
        bestWpm: 0,
        averageAccuracy: 0,
        totalSessions: 0,
      };
    }

    // findByUser returns newest first, so index 0 is the latest session.
    const currentWpm = sessions[0].wpm;
    const bestWpm = Math.max(...sessions.map((s) => s.wpm));
    const averageWpm = Math.round(
      sessions.reduce((sum, s) => sum + s.wpm, 0) / totalSessions,
    );
    const accuracySum = sessions.reduce((sum, s) => sum + s.accuracy, 0);
    const averageAccuracy = Math.round((accuracySum / totalSessions) * 10) / 10;

    return { currentWpm, averageWpm, bestWpm, averageAccuracy, totalSessions };
  }
}
