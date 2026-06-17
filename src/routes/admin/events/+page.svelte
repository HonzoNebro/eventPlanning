<script lang="ts">
  import type { EventSummary } from '$lib/types';

  let { data }: { data: { events: EventSummary[]; expiredEvents: EventSummary[] } } = $props();
  let importJson = $state('');
  let message = $state('');
  let busy = $state('');

  const sample = {
    event: {
      slug: 'mi-evento',
      name: 'Mi Evento',
      timezone: 'Europe/Madrid',
      startsOn: '2026-07-01',
      endsOn: '2026-07-02',
      isPublic: true
    },
    days: [
      {
        id: 'day-1',
        label: 'Dia 1',
        visualStartsAt: '2026-07-01T15:00:00+02:00',
        visualEndsAt: '2026-07-02T03:00:00+02:00',
        durationMinutes: 720
      }
    ],
    stages: [{ id: 'main', name: 'Main', color: '#d00000', order: 1 }],
    dayMarkers: [
      {
        id: 'doors-day-1',
        visualDayId: 'day-1',
        label: 'Apertura/Doors',
        startsAt: '2026-07-01T15:00:00+02:00',
        kind: 'doors',
        spansAllStages: true
      }
    ],
    artists: [{ id: 'artist-a', name: 'Artist A', links: { spotify: '' }, genres: ['Rock'] }],
    performances: [
      {
        id: 'perf-a',
        visualDayId: 'day-1',
        artistId: 'artist-a',
        stageId: 'main',
        startsAt: '2026-07-01T16:00:00+02:00',
        endsAt: '2026-07-01T17:00:00+02:00',
        confidence: 'manual'
      }
    ]
  };

  async function importEvent() {
    message = '';
    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: importJson
    });
    if (!response.ok) {
      message = 'No se pudo importar el evento. Revisa el JSON.';
      return;
    }
    location.reload();
  }

  async function setPublished(event: EventSummary, isPublic: boolean) {
    busy = event.slug;
    message = '';
    const response = await fetch(`/api/admin/events/${event.slug}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isPublic })
    });
    if (!response.ok) {
      message = 'No se pudo cambiar el estado del evento.';
      busy = '';
      return;
    }
    location.reload();
  }

  async function deleteEvent(event: EventSummary) {
    const confirmed = confirm(
      `Vas a borrar definitivamente "${event.name}". Se eliminarán horario, grupos, participantes, votos y notas. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    busy = event.slug;
    message = '';
    const response = await fetch(`/api/admin/events/${event.slug}`, { method: 'DELETE' });
    if (!response.ok) {
      message = 'No se pudo borrar el evento.';
      busy = '';
      return;
    }
    location.reload();
  }

  async function deleteExpiredEvents() {
    const confirmed = confirm(
      `Vas a borrar definitivamente ${data.expiredEvents.length} eventos pasados hace más de 30 días, incluyendo sus grupos, votos y notas.`
    );
    if (!confirmed) return;
    busy = 'expired';
    message = '';
    const response = await fetch('/api/admin/events?expired=1', { method: 'DELETE' });
    if (!response.ok) {
      message = 'No se pudieron borrar los eventos caducados.';
      busy = '';
      return;
    }
    location.reload();
  }
</script>

<main class="page">
  <header class="admin-header">
    <div>
      <p class="muted">Panel admin</p>
      <h1>Eventos</h1>
    </div>
    <div class="header-actions">
      <a class="button secondary" href="/">Ver sitio</a>
      <a class="button" href="/admin/events/new">Crear evento</a>
    </div>
  </header>

  {#if data.expiredEvents.length}
    <section class="panel expired">
      <div>
        <h2>Eventos pasados hace más de 30 días</h2>
        <p class="muted">{data.expiredEvents.length} eventos pueden borrarse para limpiar la base de datos.</p>
      </div>
      <button type="button" disabled={busy === 'expired'} onclick={deleteExpiredEvents}>Borrar caducados</button>
    </section>
  {/if}

  <section class="grid">
    <div class="panel list">
      <h2>Eventos existentes</h2>
      {#if data.events.length}
        {#each data.events as event}
          <article class="event-row">
            <div>
              <strong>{event.name}</strong>
              <p class="muted">{event.slug} · {event.isPublic ? 'Publicado' : 'Borrador'}</p>
            </div>
            <div class="row-actions">
              <a class="button secondary" href={`/admin/events/${event.slug}`}>Abrir</a>
              <button class="secondary" type="button" disabled={busy === event.slug} onclick={() => setPublished(event, !event.isPublic)}>
                {event.isPublic ? 'Despublicar' : 'Publicar'}
              </button>
              <button class="danger" type="button" disabled={busy === event.slug} onclick={() => deleteEvent(event)}>Borrar</button>
            </div>
          </article>
        {/each}
      {:else}
        <p class="muted">No hay eventos todavía.</p>
      {/if}
    </div>

    <div class="panel import">
      <h2>Importar JSON</h2>
      <textarea bind:value={importJson} placeholder={JSON.stringify(sample, null, 2)}></textarea>
      <div class="actions">
        <button class="secondary" type="button" onclick={() => (importJson = JSON.stringify(sample, null, 2))}>Usar ejemplo</button>
        <button type="button" onclick={importEvent}>Importar</button>
      </div>
      {#if message}<p class="error">{message}</p>{/if}
    </div>
  </section>
</main>

<style>
  .admin-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
    margin-bottom: 18px;
  }

  .header-actions,
  .row-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 8px;
  }

  h1 {
    margin: 0;
    font-size: clamp(42px, 8vw, 78px);
    line-height: 0.95;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(280px, 0.8fr) minmax(320px, 1.2fr);
    gap: 14px;
  }

  .expired {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    margin-bottom: 14px;
    padding: 14px;
    border-color: rgba(245, 184, 75, 0.34);
  }

  .expired h2 {
    margin: 0 0 4px;
  }

  .panel {
    padding: 16px;
  }

  .event-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 12px 0;
    border-top: 1px solid rgba(244, 241, 234, 0.1);
  }

  .event-row > div:first-child {
    min-width: 0;
  }

  .danger {
    border-color: rgba(251, 113, 133, 0.52);
    background: rgba(251, 113, 133, 0.14);
    color: #fecdd3;
  }

  .event-row p {
    margin: 4px 0 0;
  }

  textarea {
    width: 100%;
    min-height: 440px;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.08);
    color: #f4f1ea;
    padding: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
  }

  .actions {
    display: flex;
    justify-content: end;
    gap: 8px;
    margin-top: 10px;
  }

  .error {
    color: #fb7185;
  }

  @media (max-width: 860px) {
    .grid,
    .admin-header,
    .expired,
    .event-row {
      display: grid;
    }

    .header-actions,
    .row-actions {
      justify-content: start;
    }
  }
</style>
