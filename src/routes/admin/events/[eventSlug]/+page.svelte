<script lang="ts">
  import ScheduleView from '$lib/components/ScheduleView.svelte';
  import type { EventSummary, SchedulePayload } from '$lib/types';

  let { data }: { data: { event: EventSummary; schedule: SchedulePayload } } = $props();
  let groupUrl = $state('');
  let message = $state('');

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
</script>

<main class="page">
  <header class="admin-header">
    <div>
      <p class="muted">{data.event.isPublic ? 'Publicado' : 'Borrador'}</p>
      <h1>{data.event.name}</h1>
    </div>
    <div class="actions">
      <a class="button secondary" href={`/events/${data.event.slug}`}>Ver público</a>
      <button class="secondary" type="button" onclick={downloadJson}>Exportar JSON</button>
      <button type="button" onclick={createGroup}>Crear grupo</button>
    </div>
  </header>

  {#if groupUrl}
    <section class="panel group-url">
      <strong>Enlace privado</strong>
      <input readonly value={groupUrl} />
    </section>
  {/if}
  {#if message}<p class="error">{message}</p>{/if}

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

  @media (max-width: 760px) {
    .admin-header,
    .stats {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
