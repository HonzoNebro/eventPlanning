INSERT INTO events (id, slug, name, timezone, starts_on, ends_on, is_public)
VALUES ('event_demo', 'demo-fest', 'Demo Fest', 'Europe/Madrid', '2026-07-01', '2026-07-02', 1);

INSERT INTO event_days (id, event_id, label, visual_starts_at, visual_ends_at, duration_minutes, sort_order)
VALUES
  ('day_demo_1', 'event_demo', 'Mie 1', '2026-07-01T15:00:00+02:00', '2026-07-02T03:00:00+02:00', 720, 1),
  ('day_demo_2', 'event_demo', 'Jue 2', '2026-07-02T15:00:00+02:00', '2026-07-03T03:30:00+02:00', 750, 2);

INSERT INTO stages (id, event_id, name, color, sort_order)
VALUES
  ('stage_demo_main', 'event_demo', 'Main', '#d00000', 1),
  ('stage_demo_club', 'event_demo', 'Club', '#39aeea', 2);

INSERT INTO artists (id, event_id, name, spotify_url, genres_json)
VALUES
  ('artist_demo_a', 'event_demo', 'North Signal', 'https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg', '["Rock", "Metal"]'),
  ('artist_demo_b', 'event_demo', 'Late Static', NULL, '["Hardcore"]'),
  ('artist_demo_c', 'event_demo', 'Midnight Route', NULL, '["Stoner"]');

INSERT INTO performances (
  id,
  event_id,
  visual_day_id,
  artist_id,
  stage_id,
  starts_at,
  ends_at,
  confidence,
  start_minute,
  duration_minutes,
  crosses_midnight
)
VALUES
  ('perf_demo_a', 'event_demo', 'day_demo_1', 'artist_demo_a', 'stage_demo_main', '2026-07-01T16:00:00+02:00', '2026-07-01T17:00:00+02:00', 'manual', 60, 60, 0),
  ('perf_demo_b', 'event_demo', 'day_demo_1', 'artist_demo_b', 'stage_demo_club', '2026-07-01T17:20:00+02:00', '2026-07-01T18:05:00+02:00', 'manual', 140, 45, 0),
  ('perf_demo_c', 'event_demo', 'day_demo_1', 'artist_demo_c', 'stage_demo_main', '2026-07-02T00:30:00+02:00', '2026-07-02T01:40:00+02:00', 'manual', 570, 70, 0);
