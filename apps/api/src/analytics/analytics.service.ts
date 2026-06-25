import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';

export interface TrendPoint {
  date: string;
  wpm: number;
  accuracy: number;
}

export interface AnalyticsSummary {
  currentWpm: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  /** Per-session points, oldest first, for the trend chart. */
  trend: TrendPoint[];
}

const DRILL_TAG = 'drill';

@Injectable()
export class AnalyticsService {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Aggregate stats plus a trend series. Drills are excluded by default so the
   * benchmark is not skewed by practice on hard passages; `includeDrills` brings
   * them back for an on-demand combined view.
   */
  async summary(
    userId: string,
    includeDrills = false,
  ): Promise<AnalyticsSummary> {
    const all = await this.sessionsService.findByUser(userId);
    const sessions = includeDrills
      ? all
      : all.filter((s) => !(s.tags ?? []).includes(DRILL_TAG));
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return {
        currentWpm: 0,
        averageWpm: 0,
        bestWpm: 0,
        averageAccuracy: 0,
        totalSessions: 0,
        trend: [],
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

    // Oldest first for the chart's left-to-right timeline.
    const trend: TrendPoint[] = [...sessions].reverse().map((s) => ({
      date: new Date(s.date).toISOString(),
      wpm: s.wpm,
      accuracy: s.accuracy,
    }));

    return {
      currentWpm,
      averageWpm,
      bestWpm,
      averageAccuracy,
      totalSessions,
      trend,
    };
  }
}
