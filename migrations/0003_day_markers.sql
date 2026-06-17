PRAGMA foreign_keys = ON;

CREATE TABLE day_markers (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  visual_day_id TEXT NOT NULL REFERENCES event_days(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  kind TEXT NOT NULL CHECK(kind IN ('doors', 'info')),
  spans_all_stages INTEGER NOT NULL DEFAULT 1,
  start_minute INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_day_markers_event_day ON day_markers(event_id, visual_day_id, starts_at);
