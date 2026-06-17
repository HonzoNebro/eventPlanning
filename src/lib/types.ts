export type InterestStatus = 'going' | 'maybe' | 'skip';

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  startsOn: string;
  endsOn: string;
  isPublic: boolean;
}

export interface ScheduleDay {
  id: string;
  label: string;
  visualStartsAt: string;
  visualEndsAt: string;
  durationMinutes: number;
}

export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Artist {
  id: string;
  name: string;
  links: {
    spotify?: string;
  };
  genres?: string[];
}

export interface Performance {
  id: string;
  visualDayId: string;
  artistId: string;
  stageId: string;
  startsAt: string;
  endsAt: string;
  sourceImage?: string;
  confidence: string;
  startMinute: number;
  durationMinutes: number;
  crossesMidnight: boolean;
}

export interface SchedulePayload {
  version: number;
  festival: {
    id: string;
    slug: string;
    name: string;
    timezone: string;
    startsOn: string;
    endsOn: string;
  };
  days: ScheduleDay[];
  stages: Stage[];
  artists: Artist[];
  performances: Performance[];
  generatedAt: string;
  contentHash: string;
}

export interface Participant {
  id: string;
  displayName: string;
  avatarColor: string;
}

export interface Interest {
  participantId: string;
  performanceId: string;
  status: InterestStatus;
  displayName: string;
  avatarColor: string;
}

export interface Note {
  id: string;
  participantId: string;
  performanceId: string;
  body: string;
  displayName: string;
  avatarColor: string;
  createdAt: string;
}

export interface AdminImportPayload {
  event: {
    slug: string;
    name: string;
    timezone: string;
    startsOn: string;
    endsOn: string;
    isPublic?: boolean;
  };
  days: ScheduleDay[];
  stages: Stage[];
  artists: Artist[];
  performances: Performance[];
}
