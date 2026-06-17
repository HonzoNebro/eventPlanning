import type { InterestStatus, Performance, ScheduleDay, SchedulePayload } from './types';

export const INTEREST_STATUSES: InterestStatus[] = ['going', 'maybe', 'skip'];

export function isInterestStatus(value: string): value is InterestStatus {
  return INTEREST_STATUSES.includes(value as InterestStatus);
}

export function minutesBetween(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000));
}

export function startMinuteForDay(day: Pick<ScheduleDay, 'visualStartsAt'>, startsAt: string): number {
  return Math.round((Date.parse(startsAt) - Date.parse(day.visualStartsAt)) / 60000);
}

export function normalizePerformance(
  performance: Omit<Performance, 'startMinute' | 'durationMinutes' | 'crossesMidnight'> &
    Partial<Pick<Performance, 'startMinute' | 'durationMinutes' | 'crossesMidnight'>>,
  day: Pick<ScheduleDay, 'visualStartsAt'>
): Performance {
  const durationMinutes = performance.durationMinutes ?? minutesBetween(performance.startsAt, performance.endsAt);
  const startMinute = performance.startMinute ?? startMinuteForDay(day, performance.startsAt);

  return {
    ...performance,
    startMinute,
    durationMinutes,
    crossesMidnight:
      performance.crossesMidnight ??
      new Date(performance.startsAt).getDate() !== new Date(performance.endsAt).getDate()
  };
}

export async function contentHash(payload: unknown): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function withScheduleHash(payload: Omit<SchedulePayload, 'contentHash'>): Promise<SchedulePayload> {
  return {
    ...payload,
    contentHash: await contentHash({
      festival: payload.festival,
      days: payload.days,
      stages: payload.stages,
      artists: payload.artists,
      performances: payload.performances
    })
  };
}
