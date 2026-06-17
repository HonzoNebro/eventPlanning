import type {
  AdminImportPayload,
  Artist,
  EventSummary,
  Interest,
  InterestStatus,
  Note,
  Participant,
  Performance,
  ScheduleDay,
  SchedulePayload,
  Stage
} from '$lib/types';
import { randomId, randomToken, slugify } from '$lib/id';
import { normalizePerformance, withScheduleHash } from '$lib/schedule';

type Row = Record<string, unknown>;

function text(row: Row, key: string): string {
  return String(row[key] ?? '');
}

function number(row: Row, key: string): number {
  return Number(row[key] ?? 0);
}

function eventFromRow(row: Row): EventSummary {
  return {
    id: text(row, 'id'),
    slug: text(row, 'slug'),
    name: text(row, 'name'),
    timezone: text(row, 'timezone'),
    startsOn: text(row, 'starts_on'),
    endsOn: text(row, 'ends_on'),
    isPublic: Boolean(row.is_public)
  };
}

export async function listPublicEvents(database: D1Database): Promise<EventSummary[]> {
  const result = await database
    .prepare('SELECT * FROM events WHERE is_public = 1 ORDER BY starts_on DESC, name ASC')
    .all<Row>();
  return (result.results ?? []).map(eventFromRow);
}

export async function listAdminEvents(database: D1Database): Promise<EventSummary[]> {
  const result = await database.prepare('SELECT * FROM events ORDER BY starts_on DESC, name ASC').all<Row>();
  return (result.results ?? []).map(eventFromRow);
}

export async function getEventBySlug(
  database: D1Database,
  slug: string,
  includeDraft = false
): Promise<EventSummary | null> {
  const row = await database
    .prepare(`SELECT * FROM events WHERE slug = ? ${includeDraft ? '' : 'AND is_public = 1'}`)
    .bind(slug)
    .first<Row>();
  return row ? eventFromRow(row) : null;
}

export async function getEventForGroup(database: D1Database, groupId: string): Promise<EventSummary | null> {
  const row = await database
    .prepare(
      `SELECT events.* FROM events
       INNER JOIN groups ON groups.event_id = events.id
       WHERE groups.id = ?`
    )
    .bind(groupId)
    .first<Row>();
  return row ? eventFromRow(row) : null;
}

export async function findGroupByToken(database: D1Database, token: string): Promise<{ id: string; eventId: string } | null> {
  const row = await database
    .prepare('SELECT id, event_id FROM groups WHERE token = ?')
    .bind(token)
    .first<Row>();
  return row ? { id: text(row, 'id'), eventId: text(row, 'event_id') } : null;
}

export async function createGroup(database: D1Database, eventId: string): Promise<{ id: string; token: string }> {
  const id = randomId('g');
  const token = randomToken();
  await database.prepare('INSERT INTO groups (id, event_id, token) VALUES (?, ?, ?)').bind(id, eventId, token).run();
  return { id, token };
}

export async function getSchedule(database: D1Database, event: EventSummary): Promise<SchedulePayload> {
  const [daysResult, stagesResult, artistsResult, performancesResult] = await Promise.all([
    database.prepare('SELECT * FROM event_days WHERE event_id = ? ORDER BY sort_order ASC').bind(event.id).all<Row>(),
    database.prepare('SELECT * FROM stages WHERE event_id = ? ORDER BY sort_order ASC').bind(event.id).all<Row>(),
    database.prepare('SELECT * FROM artists WHERE event_id = ? ORDER BY name ASC').bind(event.id).all<Row>(),
    database.prepare('SELECT * FROM performances WHERE event_id = ? ORDER BY starts_at ASC').bind(event.id).all<Row>()
  ]);

  const days: ScheduleDay[] = (daysResult.results ?? []).map((row) => ({
    id: text(row, 'id'),
    label: text(row, 'label'),
    visualStartsAt: text(row, 'visual_starts_at'),
    visualEndsAt: text(row, 'visual_ends_at'),
    durationMinutes: number(row, 'duration_minutes')
  }));
  const stages: Stage[] = (stagesResult.results ?? []).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'name'),
    color: text(row, 'color'),
    order: number(row, 'sort_order')
  }));
  const artists: Artist[] = (artistsResult.results ?? []).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'name'),
    links: text(row, 'spotify_url') ? { spotify: text(row, 'spotify_url') } : {},
    genres: JSON.parse(text(row, 'genres_json') || '[]') as string[]
  }));
  const performances: Performance[] = (performancesResult.results ?? []).map((row) => ({
    id: text(row, 'id'),
    visualDayId: text(row, 'visual_day_id'),
    artistId: text(row, 'artist_id'),
    stageId: text(row, 'stage_id'),
    startsAt: text(row, 'starts_at'),
    endsAt: text(row, 'ends_at'),
    sourceImage: text(row, 'source_image') || undefined,
    confidence: text(row, 'confidence'),
    startMinute: number(row, 'start_minute'),
    durationMinutes: number(row, 'duration_minutes'),
    crossesMidnight: Boolean(row.crosses_midnight)
  }));

  return withScheduleHash({
    version: 1,
    festival: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      timezone: event.timezone,
      startsOn: event.startsOn,
      endsOn: event.endsOn
    },
    days,
    stages,
    artists,
    performances,
    generatedAt: new Date().toISOString()
  });
}

export async function listParticipants(database: D1Database, groupId: string): Promise<Participant[]> {
  const result = await database
    .prepare('SELECT id, display_name, avatar_color FROM participants WHERE group_id = ? ORDER BY created_at ASC')
    .bind(groupId)
    .all<Row>();
  return (result.results ?? []).map((row) => ({
    id: text(row, 'id'),
    displayName: text(row, 'display_name'),
    avatarColor: text(row, 'avatar_color')
  }));
}

export async function createParticipant(
  database: D1Database,
  groupId: string,
  displayName: string,
  avatarColor: string
): Promise<Participant> {
  const participant = {
    id: randomId('p'),
    displayName: displayName.trim().slice(0, 40),
    avatarColor
  };
  await database
    .prepare('INSERT INTO participants (id, group_id, display_name, avatar_color) VALUES (?, ?, ?, ?)')
    .bind(participant.id, groupId, participant.displayName, participant.avatarColor)
    .run();
  return participant;
}

export async function getParticipant(database: D1Database, participantId: string | undefined): Promise<Participant | null> {
  if (!participantId) return null;
  const row = await database
    .prepare('SELECT id, display_name, avatar_color FROM participants WHERE id = ?')
    .bind(participantId)
    .first<Row>();
  return row
    ? { id: text(row, 'id'), displayName: text(row, 'display_name'), avatarColor: text(row, 'avatar_color') }
    : null;
}

export async function updateParticipantName(
  database: D1Database,
  participantId: string,
  displayName: string
): Promise<Participant> {
  await database
    .prepare('UPDATE participants SET display_name = ? WHERE id = ?')
    .bind(displayName.trim().slice(0, 40), participantId)
    .run();
  const participant = await getParticipant(database, participantId);
  if (!participant) throw new Error('Participant not found');
  return participant;
}

export async function getSocialData(database: D1Database, groupId: string): Promise<{ interests: Interest[]; notes: Note[] }> {
  const [interestsResult, notesResult] = await Promise.all([
    database
      .prepare(
        `SELECT interests.participant_id, interests.performance_id, interests.status,
                participants.display_name, participants.avatar_color
         FROM interests
         INNER JOIN participants ON participants.id = interests.participant_id
         WHERE participants.group_id = ?
         ORDER BY interests.updated_at ASC`
      )
      .bind(groupId)
      .all<Row>(),
    database
      .prepare(
        `SELECT notes.id, notes.participant_id, notes.performance_id, notes.body, notes.created_at,
                participants.display_name, participants.avatar_color
         FROM notes
         INNER JOIN participants ON participants.id = notes.participant_id
         WHERE participants.group_id = ?
         ORDER BY notes.created_at ASC`
      )
      .bind(groupId)
      .all<Row>()
  ]);

  return {
    interests: (interestsResult.results ?? []).map((row) => ({
      participantId: text(row, 'participant_id'),
      performanceId: text(row, 'performance_id'),
      status: text(row, 'status') as InterestStatus,
      displayName: text(row, 'display_name'),
      avatarColor: text(row, 'avatar_color')
    })),
    notes: (notesResult.results ?? []).map((row) => ({
      id: text(row, 'id'),
      participantId: text(row, 'participant_id'),
      performanceId: text(row, 'performance_id'),
      body: text(row, 'body'),
      displayName: text(row, 'display_name'),
      avatarColor: text(row, 'avatar_color'),
      createdAt: text(row, 'created_at')
    }))
  };
}

export async function upsertInterest(
  database: D1Database,
  participantId: string,
  performanceId: string,
  status: InterestStatus
): Promise<void> {
  await database
    .prepare(
      `INSERT INTO interests (participant_id, performance_id, status, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(participant_id, performance_id)
       DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP`
    )
    .bind(participantId, performanceId, status)
    .run();
}

export async function deleteInterest(database: D1Database, participantId: string, performanceId: string): Promise<void> {
  await database
    .prepare('DELETE FROM interests WHERE participant_id = ? AND performance_id = ?')
    .bind(participantId, performanceId)
    .run();
}

export async function createNote(
  database: D1Database,
  participantId: string,
  performanceId: string,
  body: string
): Promise<Note> {
  const id = randomId('n');
  await database
    .prepare('INSERT INTO notes (id, participant_id, performance_id, body) VALUES (?, ?, ?, ?)')
    .bind(id, participantId, performanceId, body.trim().slice(0, 180))
    .run();
  const row = await database
    .prepare(
      `SELECT notes.id, notes.participant_id, notes.performance_id, notes.body, notes.created_at,
              participants.display_name, participants.avatar_color
       FROM notes
       INNER JOIN participants ON participants.id = notes.participant_id
       WHERE notes.id = ?`
    )
    .bind(id)
    .first<Row>();
  if (!row) throw new Error('Note not found');
  return {
    id: text(row, 'id'),
    participantId: text(row, 'participant_id'),
    performanceId: text(row, 'performance_id'),
    body: text(row, 'body'),
    displayName: text(row, 'display_name'),
    avatarColor: text(row, 'avatar_color'),
    createdAt: text(row, 'created_at')
  };
}

export async function deleteOwnNote(database: D1Database, participantId: string, noteId: string): Promise<boolean> {
  const result = await database
    .prepare('DELETE FROM notes WHERE id = ? AND participant_id = ?')
    .bind(noteId, participantId)
    .run();
  return Number(result.meta?.changes ?? 0) > 0;
}

export async function importEvent(database: D1Database, payload: AdminImportPayload): Promise<EventSummary> {
  const eventId = randomId('event');
  const slug = slugify(payload.event.slug || payload.event.name);
  await database
    .prepare(
      `INSERT INTO events (id, slug, name, timezone, starts_on, ends_on, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      eventId,
      slug,
      payload.event.name,
      payload.event.timezone,
      payload.event.startsOn,
      payload.event.endsOn,
      payload.event.isPublic ? 1 : 0
    )
    .run();

  const dayMap = new Map(payload.days.map((day) => [day.id, day]));
  const statements: D1PreparedStatement[] = [];
  payload.days.forEach((day, index) => {
    statements.push(
      database
        .prepare(
          `INSERT INTO event_days (id, event_id, label, visual_starts_at, visual_ends_at, duration_minutes, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(day.id, eventId, day.label, day.visualStartsAt, day.visualEndsAt, day.durationMinutes, index + 1)
    );
  });
  payload.stages.forEach((stage) => {
    statements.push(
      database
        .prepare('INSERT INTO stages (id, event_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)')
        .bind(stage.id, eventId, stage.name, stage.color, stage.order)
    );
  });
  payload.artists.forEach((artist) => {
    statements.push(
      database
        .prepare('INSERT INTO artists (id, event_id, name, spotify_url, genres_json) VALUES (?, ?, ?, ?, ?)')
        .bind(artist.id, eventId, artist.name, artist.links.spotify ?? null, JSON.stringify(artist.genres ?? []))
    );
  });
  payload.performances.forEach((performance) => {
    const normalized = normalizePerformance(performance, dayMap.get(performance.visualDayId) ?? payload.days[0]);
    statements.push(
      database
        .prepare(
          `INSERT INTO performances
           (id, event_id, visual_day_id, artist_id, stage_id, starts_at, ends_at, source_image, confidence, start_minute, duration_minutes, crosses_midnight)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          normalized.id,
          eventId,
          normalized.visualDayId,
          normalized.artistId,
          normalized.stageId,
          normalized.startsAt,
          normalized.endsAt,
          normalized.sourceImage ?? null,
          normalized.confidence,
          normalized.startMinute,
          normalized.durationMinutes,
          normalized.crossesMidnight ? 1 : 0
        )
    );
  });
  if (statements.length) await database.batch(statements);
  return (await getEventBySlug(database, slug, true)) as EventSummary;
}
