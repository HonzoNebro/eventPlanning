PRAGMA foreign_keys = ON;

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_days (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  visual_starts_at TEXT NOT NULL,
  visual_ends_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE stages (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE artists (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  spotify_url TEXT,
  genres_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE(event_id, name)
);

CREATE TABLE performances (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  visual_day_id TEXT NOT NULL REFERENCES event_days(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  source_image TEXT,
  confidence TEXT NOT NULL DEFAULT 'manual',
  start_minute INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  crosses_midnight INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interests (
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  performance_id TEXT NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('going', 'maybe', 'skip')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(participant_id, performance_id)
);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  performance_id TEXT NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_public ON events(is_public, starts_on);
CREATE INDEX idx_days_event ON event_days(event_id, sort_order);
CREATE INDEX idx_stages_event ON stages(event_id, sort_order);
CREATE INDEX idx_artists_event ON artists(event_id, name);
CREATE INDEX idx_performances_event_day ON performances(event_id, visual_day_id, starts_at);
CREATE INDEX idx_groups_event ON groups(event_id);
CREATE INDEX idx_participants_group ON participants(group_id);
CREATE INDEX idx_notes_performance ON notes(performance_id, created_at);
