<script lang="ts">
  import ScheduleView from '$lib/components/ScheduleView.svelte';
  import type { EventSummary, SchedulePayload } from '$lib/types';

  let { data }: { data: { event: EventSummary; schedule: SchedulePayload } } = $props();
  let groupUrl = $state('');
  let message = $state('');
  let spotifyMessage = $state('');
  let busy = $state(false);
  let publishedOverride = $state<boolean | null>(null);
  let isPublic = $derived(publishedOverride ?? data.event.isPublic);

  type SpotifySummary = {
    matched: Array<{ artistName: string; spotifyName: string }>;
    unmatched: Array<{ artistName: string }>;
    errors: string[];
  };

  function spotifySummaryMessage(summary: SpotifySummary | undefined) {
    if (!summary) return '';
    const parts = [`Spotify: ${summary.matched.length} encontrados`, `${summary.unmatched.length} sin coincidencia`];
    if (summary.errors.length) parts.push(`${summary.errors.length} avisos`);
    return parts.join(' · ');
  }

  async function createGroup() {
    message = '';
    const response = await fetch(`/api/events/${data.event.slug}/groups`, { method: 'POST' });
    if (!response.ok) {
      message = 'No se pudo crear el grupo.';
      return;
    }
    groupUrl = (await response.json()).url;
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(data.schedule, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.event.slug}-schedule.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function setPublished(isPublic: boolean) {
    busy = true;
    message = '';
    const response = await fetch(`/api/admin/events/${data.event.slug}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isPublic })
    });
    if (!response.ok) {
      message = 'No se pudo cambiar el estado del evento.';
      busy = false;
      return;
    }
    const body = (await response.json()) as { event: EventSummary; spotify?: SpotifySummary };
    publishedOverride = body.event.isPublic;
    spotifyMessage = spotifySummaryMessage(body.spotify);
    busy = false;
  }

  async function updateSpotify() {
    busy = true;
    message = '';
    spotifyMessage = '';
    const response = await fetch(`/api/admin/events/${data.event.slug}/spotify`, { method: 'POST' });
    if (!response.ok) {
      message = 'No se pudo actualizar Spotify.';
      busy = false;
      return;
    }
    const summary = (await response.json()) as SpotifySummary;
    spotifyMessage = spotifySummaryMessage(summary);
    busy = false;
  }

  async function deleteEvent() {
    const confirmed = confirm(
      `Vas a borrar definitivamente "${data.event.name}". Se eliminarán horario, grupos, participantes, votos y notas. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    busy = true;
    message = '';
    const response = await fetch(`/api/admin/events/${data.event.slug}`, { method: 'DELETE' });
    if (!response.ok) {
      message = 'No se pudo borrar el evento.';
      busy = false;
      return;
    }
    location.href = '/admin/events';
  }
</script>

<main class="page">
  <header class="admin-header">
    <div>
      <p class="muted">{isPublic ? 'Publicado' : 'Borrador'}</p>
      <h1>{data.event.name}</h1>
    </div>
    <div class="actions">
      <a class="button secondary" href={`/events/${data.event.slug}`}>Ver público</a>
      <button class="secondary" type="button" onclick={downloadJson}>Exportar JSON</button>
      <button class="secondary" type="button" disabled={busy} onclick={() => setPublished(!isPublic)}>
        {isPublic ? 'Despublicar' : 'Publicar'}
      </button>
      <button class="secondary" type="button" disabled={busy} onclick={updateSpotify}>Actualizar Spotify</button>
      <button type="button" onclick={createGroup}>Crear grupo</button>
      <button class="danger" type="button" disabled={busy} onclick={deleteEvent}>Borrar</button>
    </div>
  </header>

  {#if groupUrl}
    <section class="panel group-url">
      <strong>Enlace privado</strong>
      <input readonly value={groupUrl} />
    </section>
  {/if}
  {#if message}<p class="error">{message}</p>{/if}
  {#if spotifyMessage}<p class="notice">{spotifyMessage}</p>{/if}

  <section class="stats">
    <article class="panel"><strong>{data.schedule.days.length}</strong><span>Días</span></article>
    <article class="panel"><strong>{data.schedule.stages.length}</strong><span>Escenarios</span></article>
    <article class="panel"><strong>{data.schedule.artists.length}</strong><span>Artistas</span></article>
    <article class="panel"><strong>{data.schedule.performances.length}</strong><span>Actuaciones</span></article>
  </section>

  <ScheduleView schedule={data.schedule} />
</main>

<style>
  .admin-header {
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

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 8px;
  }

  .danger {
    border-color: rgba(251, 113, 133, 0.52);
    background: rgba(251, 113, 133, 0.14);
    color: #fecdd3;
  }

  .group-url {
    display: grid;
    gap: 8px;
    padding: 12px;
    margin-bottom: 14px;
  }

  input {
    width: 100%;
    min-height: 40px;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.08);
    color: #f4f1ea;
    padding: 8px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .stats article {
    display: grid;
    gap: 4px;
    padding: 14px;
  }

  .stats strong {
    font-size: 28px;
  }

  .stats span {
    color: rgba(244, 241, 234, 0.62);
  }

  .error {
    color: #fb7185;
  }

  .notice {
    color: #86efac;
  }

  @media (max-width: 760px) {
    .admin-header,
    .stats {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
