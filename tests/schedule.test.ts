import { describe, expect, it } from 'vitest';
import { isInterestStatus, minutesBetween, normalizePerformance, startMinuteForDay } from '../src/lib/schedule';

const day = {
  id: 'day-1',
  label: 'Dia 1',
  visualStartsAt: '2026-07-01T15:00:00+02:00',
  visualEndsAt: '2026-07-02T03:00:00+02:00',
  durationMinutes: 720
};

describe('schedule helpers', () => {
  it('calculates minutes between ISO instants', () => {
    expect(minutesBetween('2026-07-01T16:00:00+02:00', '2026-07-01T17:15:00+02:00')).toBe(75);
  });

  it('calculates start minute inside a visual day', () => {
    expect(startMinuteForDay(day, '2026-07-01T16:30:00+02:00')).toBe(90);
  });

  it('normalizes performance timing and midnight crossing', () => {
    const performance = normalizePerformance(
      {
        id: 'perf',
        visualDayId: 'day-1',
        artistId: 'artist',
        stageId: 'main',
        startsAt: '2026-07-01T23:30:00+02:00',
        endsAt: '2026-07-02T00:40:00+02:00',
        confidence: 'manual'
      },
      day
    );

    expect(performance.startMinute).toBe(510);
    expect(performance.durationMinutes).toBe(70);
    expect(performance.crossesMidnight).toBe(true);
  });

  it('validates supported interest statuses', () => {
    expect(isInterestStatus('going')).toBe(true);
    expect(isInterestStatus('maybe')).toBe(true);
    expect(isInterestStatus('skip')).toBe(true);
    expect(isInterestStatus('later')).toBe(false);
  });
});
