<script lang="ts">
  import type { AdminImportPayload } from '$lib/types';

  type DayRow = {
    id: string;
    label: string;
    date: string;
    visualStart: string;
    visualEndDate: string;
    visualEnd: string;
  };

  type StageRow = { id: string; name: string; color: string; order: number };
  type MarkerRow = { id: string; visualDayId: string; label: string; startsAt: string; endsAt: string; kind: 'doors' | 'info' };
  type ArtistRow = { id: string; name: string; spotify: string; genres: string };
  type PerformanceRow = {
    id: string;
    visualDayId: string;
    artistId: string;
    stageId: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };

  let message = $state('');
  let saving = $state(false);
  let event = $state({
    slug: '',
    name: '',
    timezone: 'Europe/Madrid',
    startsOn: '',
    endsOn: '',
    isPublic: true
  });
  let days = $state<DayRow[]>([
    { id: 'day-1', label: 'Día 1', date: '', visualStart: '16:00', visualEndDate: '', visualEnd: '03:00' }
  ]);
  let stages = $state<StageRow[]>([{ id: 'main', name: 'Main Stage', color: '#7c3aed', order: 1 }]);
  let markers = $state<MarkerRow[]>([
    { id: 'doors-day-1', visualDayId: 'day-1', label: 'Apertura/Doors', startsAt: '16:00', endsAt: '16:30', kind: 'doors' }
  ]);
  let artists = $state<ArtistRow[]>([{ id: 'artist-1', name: '', spotify: '', genres: 'Rock' }]);
  let performances = $state<PerformanceRow[]>([
    {
      id: 'perf-1',
      visualDayId: 'day-1',
      artistId: 'artist-1',
      stageId: 'main',
      startDate: '',
      startTime: '17:00',
      endDate: '',
      endTime: '18:00'
    }
  ]);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function iso(date: string, time: string) {
    return `${date}T${time}:00+02:00`;
  }

  function minutesBetween(start: string, end: string) {
    return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000));
  }

  function addDay() {
    const number = days.length + 1;
    days = [...days, { id: `day-${number}`, label: `Día ${number}`, date: '', visualStart: '16:00', visualEndDate: '', visualEnd: '03:00' }];
  }

  function addStage() {
    const number = stages.length + 1;
    stages = [...stages, { id: `stage-${number}`, name: `Stage ${number}`, color: '#a855f7', order: number }];
  }

  function addMarker() {
    markers = [
      ...markers,
      { id: `marker-${markers.length + 1}`, visualDayId: days[0]?.id ?? '', label: 'Apertura/Doors', startsAt: '16:00', endsAt: '', kind: 'doors' }
    ];
  }

  function addArtist() {
    artists = [...artists, { id: `artist-${artists.length + 1}`, name: '', spotify: '', genres: 'Rock' }];
  }

  function addPerformance() {
    performances = [
      ...performances,
      {
        id: `perf-${performances.length + 1}`,
        visualDayId: days[0]?.id ?? '',
        artistId: artists[0]?.id ?? '',
        stageId: stages[0]?.id ?? '',
        startDate: days[0]?.date ?? '',
        startTime: '17:00',
        endDate: days[0]?.date ?? '',
        endTime: '18:00'
      }
    ];
  }

  function removeAt<T>(rows: T[], index: number) {
    return rows.filter((_, rowIndex) => rowIndex !== index);
  }

  function buildPayload(): AdminImportPayload {
    const slug = event.slug || slugify(event.name);
    const idPrefix = slug || `event-${Date.now()}`;
    const scopedId = (value: string, fallback: string) => `${idPrefix}-${slugify(value || fallback)}`;
    const dayIds = new Map(days.map((day, index) => [day.id, scopedId(day.id, `day-${index + 1}`)]));
    const stageIds = new Map(stages.map((stage, index) => [stage.id, scopedId(stage.id, `stage-${index + 1}`)]));
    const artistIds = new Map(artists.map((artist, index) => [artist.id, scopedId(artist.id, `artist-${index + 1}`)]));

    return {
      event: {
        slug,
        name: event.name,
        timezone: event.timezone,
        startsOn: event.startsOn,
        endsOn: event.endsOn,
        isPublic: event.isPublic
      },
      days: days.map((day, index) => {
        const endDate = day.visualEndDate || day.date;
        const visualStartsAt = iso(day.date, day.visualStart);
        const visualEndsAt = iso(endDate, day.visualEnd);
        return {
          id: dayIds.get(day.id) ?? scopedId(day.id, `day-${index + 1}`),
          label: day.label,
          visualStartsAt,
          visualEndsAt,
          durationMinutes: minutesBetween(visualStartsAt, visualEndsAt)
        };
      }),
      stages: stages.map((stage, index) => ({
        id: stageIds.get(stage.id) ?? scopedId(stage.id, `stage-${index + 1}`),
        name: stage.name,
        color: stage.color || '#7c3aed',
        order: index + 1
      })),
      dayMarkers: markers
        .filter((marker) => marker.label && marker.visualDayId && marker.startsAt)
        .map((marker, index) => {
          const day = days.find((item) => item.id === marker.visualDayId) ?? days[0];
          return {
            id: scopedId(marker.id, `marker-${index + 1}`),
            visualDayId: dayIds.get(marker.visualDayId) ?? scopedId(marker.visualDayId, `day-${index + 1}`),
            label: marker.label,
            startsAt: iso(day.date, marker.startsAt),
            endsAt: marker.endsAt ? iso(day.date, marker.endsAt) : undefined,
            kind: marker.kind,
            spansAllStages: true
          };
        }),
      artists: artists.map((artist, index) => ({
        id: artistIds.get(artist.id) ?? scopedId(artist.id, `artist-${index + 1}`),
        name: artist.name,
        links: { spotify: artist.spotify },
        genres: artist.genres
          .split(',')
          .map((genre) => genre.trim())
          .filter(Boolean)
      })),
      performances: performances.map((performance, index) => ({
        id: scopedId(performance.id, `perf-${index + 1}`),
        visualDayId: dayIds.get(performance.visualDayId) ?? scopedId(performance.visualDayId, `day-${index + 1}`),
        artistId: artistIds.get(performance.artistId) ?? scopedId(performance.artistId, `artist-${index + 1}`),
        stageId: stageIds.get(performance.stageId) ?? scopedId(performance.stageId, `stage-${index + 1}`),
        startsAt: iso(performance.startDate, performance.startTime),
        endsAt: iso(performance.endDate, performance.endTime),
        confidence: 'manual'
      }))
    };
  }

  async function save() {
    message = '';
    saving = true;
    const payload = buildPayload();
    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      message = 'No se pudo crear el evento. Revisa que no falten fechas, artistas o escenarios.';
      saving = false;
      return;
    }
    const result = (await response.json()) as { event: { slug: string } };
    location.href = `/admin/events/${result.event.slug}`;
  }
</script>

<main class="page">
  <header class="admin-header">
    <div>
      <p class="muted">Panel admin</p>
      <h1>Crear evento</h1>
    </div>
    <a class="button secondary" href="/admin/events">Volver</a>
  </header>

  <section class="panel">
    <h2>Datos básicos</h2>
    <div class="fields four">
      <label>Nombre<input bind:value={event.name} oninput={() => (event.slug = event.slug || slugify(event.name))} /></label>
      <label>Slug<input bind:value={event.slug} /></label>
      <label>Inicio<input type="date" bind:value={event.startsOn} /></label>
      <label>Fin<input type="date" bind:value={event.endsOn} /></label>
      <label>Timezone<input bind:value={event.timezone} /></label>
      <label class="check"><input type="checkbox" bind:checked={event.isPublic} /> Publicado</label>
    </div>
  </section>

  <section class="panel">
    <header class="section-header"><h2>Días</h2><button type="button" onclick={addDay}>Añadir día</button></header>
    {#each days as day, index}
      <div class="row day-row">
        <input aria-label="ID día" bind:value={day.id} />
        <input aria-label="Etiqueta día" bind:value={day.label} />
        <input aria-label="Fecha" type="date" bind:value={day.date} />
        <input aria-label="Inicio visual" type="time" bind:value={day.visualStart} />
        <input aria-label="Fecha fin visual" type="date" bind:value={day.visualEndDate} placeholder="Fecha fin" />
        <input aria-label="Fin visual" type="time" bind:value={day.visualEnd} />
        <button class="secondary" type="button" onclick={() => (days = removeAt(days, index))}>Quitar</button>
      </div>
    {/each}
  </section>

  <section class="panel">
    <header class="section-header"><h2>Escenarios</h2><button type="button" onclick={addStage}>Añadir escenario</button></header>
    {#each stages as stage, index}
      <div class="row stage-row">
        <input aria-label="ID escenario" bind:value={stage.id} />
        <input aria-label="Nombre escenario" bind:value={stage.name} />
        <input aria-label="Color" type="color" bind:value={stage.color} />
        <button class="secondary" type="button" onclick={() => (stages = removeAt(stages, index))}>Quitar</button>
      </div>
    {/each}
  </section>

  <section class="panel">
    <header class="section-header"><h2>Marcadores</h2><button type="button" onclick={addMarker}>Añadir marcador</button></header>
    {#each markers as marker, index}
      <div class="row marker-row">
        <input aria-label="ID marcador" bind:value={marker.id} />
        <select aria-label="Día marcador" bind:value={marker.visualDayId}>
          {#each days as day}<option value={day.id}>{day.label}</option>{/each}
        </select>
        <input aria-label="Etiqueta marcador" bind:value={marker.label} />
        <select aria-label="Tipo marcador" bind:value={marker.kind}>
          <option value="doors">Puertas</option>
          <option value="info">Info</option>
        </select>
        <input aria-label="Inicio marcador" type="time" bind:value={marker.startsAt} />
        <input aria-label="Fin marcador" type="time" bind:value={marker.endsAt} />
        <button class="secondary" type="button" onclick={() => (markers = removeAt(markers, index))}>Quitar</button>
      </div>
    {/each}
  </section>

  <section class="panel">
    <header class="section-header"><h2>Artistas</h2><button type="button" onclick={addArtist}>Añadir artista</button></header>
    {#each artists as artist, index}
      <div class="row artist-row">
        <input aria-label="ID artista" bind:value={artist.id} />
        <input aria-label="Nombre artista" bind:value={artist.name} />
        <input aria-label="Spotify" bind:value={artist.spotify} placeholder="Spotify URL" />
        <input aria-label="Géneros" bind:value={artist.genres} placeholder="Metal, Rock" />
        <button class="secondary" type="button" onclick={() => (artists = removeAt(artists, index))}>Quitar</button>
      </div>
    {/each}
  </section>

  <section class="panel">
    <header class="section-header"><h2>Actuaciones</h2><button type="button" onclick={addPerformance}>Añadir actuación</button></header>
    {#each performances as performance, index}
      <div class="row performance-row">
        <input aria-label="ID actuación" bind:value={performance.id} />
        <select aria-label="Día actuación" bind:value={performance.visualDayId}>
          {#each days as day}<option value={day.id}>{day.label}</option>{/each}
        </select>
        <select aria-label="Artista" bind:value={performance.artistId}>
          {#each artists as artist}<option value={artist.id}>{artist.name || artist.id}</option>{/each}
        </select>
        <select aria-label="Escenario" bind:value={performance.stageId}>
          {#each stages as stage}<option value={stage.id}>{stage.name}</option>{/each}
        </select>
        <input aria-label="Fecha inicio" type="date" bind:value={performance.startDate} />
        <input aria-label="Hora inicio" type="time" bind:value={performance.startTime} />
        <input aria-label="Fecha fin" type="date" bind:value={performance.endDate} />
        <input aria-label="Hora fin" type="time" bind:value={performance.endTime} />
        <button class="secondary" type="button" onclick={() => (performances = removeAt(performances, index))}>Quitar</button>
      </div>
    {/each}
  </section>

  {#if message}<p class="error">{message}</p>{/if}
  <div class="savebar">
    <button type="button" disabled={saving} onclick={save}>Crear evento</button>
  </div>
</main>

<style>
  .admin-header,
  .section-header,
  .savebar {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
    margin-bottom: 18px;
  }

  h1 {
    margin: 0;
    font-size: clamp(38px, 7vw, 72px);
    line-height: 0.95;
  }

  h2 {
    margin: 0;
  }

  .panel {
    display: grid;
    gap: 12px;
    padding: 16px;
    margin-bottom: 14px;
  }

  .fields,
  .row {
    display: grid;
    gap: 8px;
  }

  .four {
    grid-template-columns: repeat(4, minmax(140px, 1fr));
  }

  .row {
    grid-template-columns: repeat(6, minmax(100px, 1fr)) auto;
    align-items: end;
  }

  .stage-row {
    grid-template-columns: minmax(120px, 0.8fr) minmax(160px, 1fr) 70px auto;
  }

  .artist-row {
    grid-template-columns: minmax(120px, 0.8fr) minmax(160px, 1fr) minmax(180px, 1fr) minmax(140px, 0.8fr) auto;
  }

  .performance-row {
    grid-template-columns: minmax(120px, 0.8fr) repeat(3, minmax(130px, 1fr)) repeat(4, minmax(105px, 0.7fr)) auto;
  }

  label {
    display: grid;
    gap: 6px;
    color: rgba(244, 241, 234, 0.72);
    font-size: 13px;
  }

  .check {
    display: flex;
    align-items: center;
    min-height: 42px;
  }

  input,
  select {
    min-height: 40px;
    min-width: 0;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.08);
    color: #f4f1ea;
    padding: 8px;
  }

  input[type='color'] {
    padding: 3px;
  }

  .error {
    color: #fb7185;
  }

  @media (max-width: 980px) {
    .admin-header,
    .section-header,
    .four,
    .row {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
