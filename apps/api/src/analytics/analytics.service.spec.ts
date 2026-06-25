import { AnalyticsService } from './analytics.service';
import { SessionsService } from '../sessions/sessions.service';
import type { TypingSessionDocument } from '../sessions/schemas/typing-session.schema';

function session(partial: {
  wpm: number;
  accuracy: number;
  tags?: string[];
  date?: Date;
}): TypingSessionDocument {
  return {
    wpm: partial.wpm,
    accuracy: partial.accuracy,
    tags: partial.tags ?? [],
    date: partial.date ?? new Date(),
  } as unknown as TypingSessionDocument;
}

function makeService(sessions: TypingSessionDocument[]): AnalyticsService {
  const findByUser = jest.fn().mockResolvedValue(sessions);
  return new AnalyticsService({ findByUser } as unknown as SessionsService);
}

describe('AnalyticsService.summary', () => {
  it('excludes drill sessions by default', async () => {
    const service = makeService([
      session({ wpm: 100, accuracy: 95, tags: ['drill'] }),
      session({ wpm: 60, accuracy: 90, tags: ['30s'] }),
      session({ wpm: 50, accuracy: 92, tags: ['25w'] }),
    ]);

    const summary = await service.summary('u1');

    expect(summary.totalSessions).toBe(2);
    expect(summary.bestWpm).toBe(60); // the drill's 100 is excluded
    expect(summary.trend).toHaveLength(2);
  });

  it('includes drills when asked', async () => {
    const service = makeService([
      session({ wpm: 100, accuracy: 95, tags: ['drill'] }),
      session({ wpm: 60, accuracy: 90, tags: ['30s'] }),
    ]);

    const summary = await service.summary('u1', true);

    expect(summary.totalSessions).toBe(2);
    expect(summary.bestWpm).toBe(100);
  });

  it('returns empty stats and trend with no sessions', async () => {
    const service = makeService([]);

    const summary = await service.summary('u1');

    expect(summary.totalSessions).toBe(0);
    expect(summary.trend).toEqual([]);
  });

  it('orders the trend oldest first', async () => {
    const service = makeService([
      session({
        wpm: 70,
        accuracy: 95,
        tags: ['30s'],
        date: new Date('2026-01-02'),
      }),
      session({
        wpm: 50,
        accuracy: 92,
        tags: ['30s'],
        date: new Date('2026-01-01'),
      }),
    ]);

    const summary = await service.summary('u1');

    expect(summary.trend.map((point) => point.wpm)).toEqual([50, 70]);
  });
});
