import type { DayMarker, EventSummary, InterestStatus, Performance, ScheduleDay, SchedulePayload } from './types';

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

export function normalizeDayMarker(
  marker: Omit<DayMarker, 'startMinute' | 'durationMinutes'> &
    Partial<Pick<DayMarker, 'startMinute' | 'durationMinutes'>>,
  day: Pick<ScheduleDay, 'visualStartsAt'>
): DayMarker {
  const startMinute = marker.startMinute ?? startMinuteForDay(day, marker.startsAt);
  const durationMinutes = marker.durationMinutes ?? (marker.endsAt ? minutesBetween(marker.startsAt, marker.endsAt) : 30);

  return {
    ...marker,
    startMinute,
    durationMinutes
  };
}

export function isExpiredForCleanup(
  event: Pick<EventSummary, 'endsOn'>,
  now = new Date(),
  graceDays = 30
): boolean {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const cutoff = today - graceDays * 24 * 60 * 60 * 1000;
  return Date.parse(`${event.endsOn}T00:00:00Z`) < cutoff;
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
      dayMarkers: payload.dayMarkers,
      artists: payload.artists,
      performances: payload.performances
    })
  };
}
