<script lang="ts">
  import type { Interest, InterestStatus, Note, Participant, Performance, SchedulePayload } from '$lib/types';

  interface Props {
    schedule: SchedulePayload;
    social?: {
      participants: Participant[];
      interests: Interest[];
      notes: Note[];
      participant: Participant | null;
    };
    interactive?: boolean;
    onNeedName?: () => void;
    onVote?: (performanceId: string, status: InterestStatus) => void;
    onClearVote?: (performanceId: string) => void;
    onAddNote?: (performanceId: string) => void;
    onDeleteNote?: (noteId: string) => void;
  }

  let {
    schedule,
    social = { participants: [], interests: [], notes: [], participant: null },
    interactive = false,
    onNeedName,
    onVote,
    onClearVote,
    onAddNote,
    onDeleteNote
  }: Props = $props();

  let dayIndex = $state(0);
  let routeOnly = $state(false);
  let selected = $state<Performance | null>(null);

  const minuteScale = 2.1;
  const artists = $derived(new Map(schedule.artists.map((artist) => [artist.id, artist])));
  const stages = $derived([...schedule.stages].sort((a, b) => a.order - b.order));
  const day = $derived(schedule.days[dayIndex]);
  const dayMarkers = $derived((schedule.dayMarkers ?? []).filter((marker) => marker.visualDayId === day.id));
  const myVotes = $derived(
    new Map(
      social.interests
        .filter((interest) => interest.participantId === social.participant?.id)
        .map((interest) => [interest.performanceId, interest])
    )
  );
  const performances = $derived(
    schedule.performances.filter((performance) => {
      if (performance.visualDayId !== day.id) return false;
      if (!routeOnly) return true;
      return ['going', 'maybe'].includes(myVotes.get(performance.id)?.status ?? '');
    })
  );

  function votesFor(performanceId: string) {
    return social.interests.filter((interest) => interest.performanceId === performanceId);
  }

  function notesFor(performanceId: string) {
    return social.notes.filter((note) => note.performanceId === performanceId);
  }

  function artistName(performance: Performance) {
    return artists.get(performance.artistId)?.name ?? performance.artistId;
  }

  function time(value: string) {
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  function spotifyEmbed(url: string | undefined) {
    const match = url?.match(/open\.spotify\.com\/artist\/([^?]+)/);
    return match ? `https://open.spotify.com/embed/artist/${match[1]}?utm_source=generator&theme=0` : null;
  }

  function handleVote(performanceId: string, status: InterestStatus) {
    if (!social.participant) {
      onNeedName?.();
      return;
    }
    if (myVotes.get(performanceId)?.status === status) {
      onClearVote?.(performanceId);
      return;
    }
    onVote?.(performanceId, status);
  }
</script>

<div class="schedule-shell">
  <header class="topbar">
    <div class="days" aria-label="Días">
      {#each schedule.days as item, index}
        <button class:active={index === dayIndex} type="button" onclick={() => (dayIndex = index)}>
          {item.label}
        </button>
      {/each}
    </div>
    {#if interactive}
      <button class:active={routeOnly} class="route-toggle" type="button" onclick={() => (routeOnly = !routeOnly)}>
        {routeOnly ? 'Mi ruta' : 'Todo'}
      </button>
    {/if}
  </header>

  <section class="schedule" style={`--day-height:${day.durationMinutes * minuteScale}px`}>
    <aside class="time-axis">
      {#each Array.from({ length: Math.ceil(day.durationMinutes / 60) + 1 }) as _, index}
        <span style={`top:${index * 60 * minuteScale}px`}>
          {time(new Date(Date.parse(day.visualStartsAt) + index * 60 * 60000).toISOString())}
        </span>
      {/each}
    </aside>
    <div class="stage-grid">
      {#each dayMarkers as marker}
        <div
          class:doors={marker.kind === 'doors'}
          class="day-marker"
          style={`top:${marker.startMinute * minuteScale}px;height:${Math.max(32, marker.durationMinutes * minuteScale)}px`}
        >
          <strong>{marker.label}</strong>
          <span>
            {time(marker.startsAt)}
            {#if marker.endsAt} - {time(marker.endsAt)}{/if}
          </span>
        </div>
      {/each}
      {#each stages as stage}
        <section class="stage-column" style={`--stage-color:${stage.color}`}>
          <h2>{stage.name}</h2>
          {#each performances.filter((performance) => performance.stageId === stage.id) as performance}
            {@const votes = votesFor(performance.id)}
            {@const going = votes.filter((vote) => vote.status === 'going').length}
            {@const maybe = votes.filter((vote) => vote.status === 'maybe').length}
            <button
              class:mine={['going', 'maybe'].includes(myVotes.get(performance.id)?.status ?? '')}
              class="performance"
              style={`top:${performance.startMinute * minuteScale}px;height:${Math.max(46, performance.durationMinutes * minuteScale)}px`}
              type="button"
              onclick={() => (selected = performance)}
            >
              <strong>{artistName(performance)}</strong>
              <span>{time(performance.startsAt)} - {time(performance.endsAt)}</span>
              {#if going}
                <small>{going} van</small>
              {:else if maybe}
                <small>{maybe} puede</small>
              {/if}
            </button>
          {/each}
        </section>
      {/each}
    </div>
  </section>
</div>

{#if selected}
  {@const artist = artists.get(selected.artistId)}
  {@const embed = spotifyEmbed(artist?.links.spotify)}
  <button class="scrim" aria-label="Cerrar" onclick={() => (selected = null)}></button>
  <section class="sheet" aria-label="Detalle de actuación">
    <button class="close" type="button" aria-label="Cerrar" onclick={() => (selected = null)}>×</button>
    <p class="muted">{time(selected.startsAt)} - {time(selected.endsAt)}</p>
    <h2>{artistName(selected)}</h2>
    <p class="muted">{stages.find((stage) => stage.id === selected?.stageId)?.name}</p>

    {#if artist?.genres?.length}
      <div class="chips">
        {#each artist.genres as genre}
          <span>{genre}</span>
        {/each}
      </div>
    {/if}

    {#if embed}
      <iframe title={`Spotify ${artist?.name}`} src={embed} width="100%" height="152" loading="lazy"></iframe>
    {:else if artist}
      <a class="spotify-link" href={`https://open.spotify.com/search/${encodeURIComponent(artist.name)}`} target="_blank" rel="noreferrer">
        Buscar en Spotify
      </a>
    {/if}

    {#if interactive}
      <div class="status-buttons">
        <button class:selected={myVotes.get(selected.id)?.status === 'going'} type="button" onclick={() => handleVote(selected!.id, 'going')}>Me apunto</button>
        <button class:selected={myVotes.get(selected.id)?.status === 'maybe'} type="button" onclick={() => handleVote(selected!.id, 'maybe')}>Puede</button>
        <button class:selected={myVotes.get(selected.id)?.status === 'skip'} type="button" onclick={() => handleVote(selected!.id, 'skip')}>Paso</button>
      </div>
    {/if}

    <section class="votes">
      {#each votesFor(selected.id) as vote}
        <span class="vote"><i style={`background:${vote.status === 'going' ? '#31f287' : vote.status === 'maybe' ? '#f5b84b' : '#ff4d6d'}`}></i>{vote.displayName}</span>
      {:else}
        <p class="muted">Nadie ha respondido todavía.</p>
      {/each}
    </section>

    <section class="notes">
      <h3>Notas</h3>
      {#each notesFor(selected.id) as note}
        <article class="note">
          <div>
            <strong>{note.displayName}</strong>
            <p>{note.body}</p>
          </div>
          {#if note.participantId === social.participant?.id}
            <button class="secondary" type="button" onclick={() => onDeleteNote?.(note.id)}>Borrar</button>
          {/if}
        </article>
      {:else}
        <p class="muted">No hay notas todavía.</p>
      {/each}
      {#if interactive}
        <button class="secondary" type="button" onclick={() => (social.participant ? onAddNote?.(selected!.id) : onNeedName?.())}>Añadir nota</button>
      {/if}
    </section>
  </section>
{/if}

<style>
  .schedule-shell {
    display: grid;
    gap: 8px;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .days {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .days button,
  .route-toggle {
    min-height: 34px;
    background: rgba(244, 241, 234, 0.1);
    color: #f4f1ea;
  }

  button.active {
    background: #f4f1ea;
    color: #050608;
  }

  .schedule {
    position: relative;
    display: grid;
    grid-template-columns: 50px 1fr;
    height: min(74vh, 820px);
    overflow: auto;
    border: 1px solid rgba(244, 241, 234, 0.12);
    background:
      linear-gradient(to bottom, rgba(244, 241, 234, 0.08) 1px, transparent 1px),
      rgba(244, 241, 234, 0.04);
    background-size: 100% 126px;
  }

  .time-axis {
    position: sticky;
    left: 0;
    z-index: 2;
    height: var(--day-height);
    background: rgba(5, 6, 8, 0.82);
  }

  .time-axis span {
    position: absolute;
    right: 8px;
    font-size: 11px;
    color: rgba(244, 241, 234, 0.58);
  }

  .stage-grid {
    position: relative;
    display: flex;
    min-width: 680px;
    height: var(--day-height);
  }

  .day-marker {
    position: absolute;
    left: 8px;
    right: 8px;
    z-index: 3;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border: 1px solid rgba(244, 241, 234, 0.22);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.12);
    color: #f4f1ea;
    pointer-events: none;
    text-align: center;
  }

  .day-marker.doors {
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.86), rgba(192, 132, 252, 0.82));
  }

  .day-marker strong,
  .day-marker span {
    font-size: 12px;
    line-height: 1;
  }

  .stage-column {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    border-left: 1px solid rgba(244, 241, 234, 0.1);
  }

  .stage-column h2 {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0;
    padding: 10px 6px;
    background: color-mix(in srgb, var(--stage-color) 24%, #050608);
    font-size: 13px;
    text-align: center;
  }

  .performance {
    position: absolute;
    left: 5px;
    right: 5px;
    display: grid;
    align-content: start;
    gap: 3px;
    overflow: hidden;
    padding: 8px;
    border-color: color-mix(in srgb, var(--stage-color) 50%, rgba(244, 241, 234, 0.2));
    background: linear-gradient(180deg, rgba(244, 241, 234, 0.14), rgba(244, 241, 234, 0.07));
    color: #f4f1ea;
    text-align: left;
  }

  .performance.mine {
    box-shadow: inset 3px 0 0 #31f287;
  }

  .performance strong {
    line-height: 1.05;
  }

  .performance span,
  .performance small {
    font-size: 11px;
    color: rgba(244, 241, 234, 0.7);
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 20;
    border: 0;
    border-radius: 0;
    background: rgba(0, 0, 0, 0.62);
  }

  .sheet {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 21;
    width: min(460px, 100vw);
    overflow: auto;
    padding: 22px;
    border-left: 1px solid rgba(244, 241, 234, 0.14);
    background: #0b0f14;
  }

  .close {
    float: right;
    width: 38px;
    min-height: 38px;
    padding: 0;
    border-radius: 999px;
  }

  .sheet h2 {
    margin: 0;
    font-size: clamp(34px, 10vw, 58px);
    line-height: 0.92;
  }

  .chips,
  .votes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .chips span,
  .vote {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 30px;
    padding: 0 10px;
    border: 1px solid rgba(244, 241, 234, 0.12);
    border-radius: 999px;
    background: rgba(244, 241, 234, 0.08);
    font-size: 13px;
  }

  .vote i {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }

  iframe {
    margin-top: 14px;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 8px;
  }

  .spotify-link {
    display: inline-flex;
    margin-top: 14px;
    color: #f4f1ea;
    font-weight: 800;
  }

  .status-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 0.8fr;
    gap: 8px;
    margin-top: 16px;
  }

  .status-buttons button {
    background: rgba(244, 241, 234, 0.1);
    color: #f4f1ea;
  }

  .status-buttons .selected {
    background: #31f287;
    color: #050608;
  }

  .notes {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }

  .note {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 10px;
    border: 1px solid rgba(244, 241, 234, 0.1);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.06);
  }

  .note p {
    margin: 4px 0 0;
    color: rgba(244, 241, 234, 0.74);
  }

  @media (max-width: 680px) {
    .sheet {
      top: auto;
      left: 0;
      width: auto;
      max-height: 86vh;
      border-radius: 18px 18px 0 0;
      border-left: 0;
      border-top: 1px solid rgba(244, 241, 234, 0.14);
    }
  }
</style>
