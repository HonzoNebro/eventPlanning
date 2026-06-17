<script lang="ts">
  import type { EventSummary } from '$lib/types';

  let { data }: { data: { events: EventSummary[] } } = $props();
</script>

<main class="page home">
  <section class="hero">
    <p class="eyebrow">Horarios compartidos</p>
    <h1>Eventos, rutas y picks para tu grupo</h1>
    <p class="muted">
      Crea eventos multi-escenario, comparte un enlace privado y organiza quién va a cada actuación.
    </p>
    <a class="button" href="/admin/events">Administrar eventos</a>
  </section>

  <section class="events">
    <h2>Eventos públicos</h2>
    {#if data.events.length}
      <div class="event-grid">
        {#each data.events as event}
          <article class="panel event-card">
            <div>
              <h3>{event.name}</h3>
              <p class="muted">{event.startsOn} - {event.endsOn} · {event.timezone}</p>
            </div>
            <div class="actions">
              <a class="button secondary" href={`/events/${event.slug}`}>Ver horario</a>
              <a class="button" href={`/events/${event.slug}/new-group`}>Crear grupo</a>
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <p class="muted">Todavía no hay eventos publicados. Entra en admin e importa uno.</p>
    {/if}
  </section>
</main>

<style>
  .hero {
    display: grid;
    gap: 16px;
    min-height: 44vh;
    align-content: center;
  }

  .eyebrow {
    margin: 0;
    color: #facc15;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 820px;
    margin: 0;
    font-size: clamp(44px, 8vw, 92px);
    line-height: 0.9;
    letter-spacing: 0;
  }

  .hero p {
    max-width: 620px;
    font-size: 20px;
  }

  .events {
    display: grid;
    gap: 14px;
  }

  .event-grid {
    display: grid;
    gap: 12px;
  }

  .event-card {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
  }

  .event-card h3 {
    margin: 0 0 6px;
    font-size: 24px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  @media (max-width: 680px) {
    .event-card {
      display: grid;
    }
  }
</style>
