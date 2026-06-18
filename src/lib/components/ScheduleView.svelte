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
    onShare?: () => void;
    shareCopied?: boolean;
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
    onShare,
    shareCopied = false,
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

  function performanceStatus(performanceId: string) {
    const mine = myVotes.get(performanceId)?.status;
    if (mine === 'skip') return 'mine-skip';
    const votes = votesFor(performanceId);
    if (votes.some((vote) => vote.status === 'going')) return 'going';
    if (votes.some((vote) => vote.status === 'maybe')) return 'maybe';
    return 'neutral';
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
      <div class="toolbar-actions">
        <button
          class="icon-button"
          type="button"
          aria-label={social.participant ? `Cambiar nombre de ${social.participant.displayName}` : 'Poner nombre'}
          title={social.participant ? social.participant.displayName : 'Poner nombre'}
          onclick={() => onNeedName?.()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <button
          class:active={routeOnly}
          class="route-toggle icon-button"
          type="button"
          aria-label={routeOnly ? 'Mostrar todo el horario' : 'Mostrar mi ruta'}
          title={routeOnly ? 'Mi ruta' : 'Todo'}
          onclick={() => (routeOnly = !routeOnly)}
        >
          {#if routeOnly}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h12l-5 6v7l-2 2v-9z" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          {/if}
        </button>
        <button
          class="icon-button"
          type="button"
          aria-label={shareCopied ? 'Enlace copiado' : 'Copiar enlace del grupo'}
          title={shareCopied ? 'Copiado' : 'Copiar enlace'}
          onclick={() => onShare?.()}
        >
          {#if shareCopied}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
              <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
            </svg>
          {/if}
        </button>
      </div>
    {:else if onShare || onNeedName}
      <div class="toolbar-actions">
        {#if onNeedName}
          <button class="icon-button" type="button" aria-label="Poner nombre" onclick={() => onNeedName?.()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        {/if}
        {#if onShare}
          <button class="icon-button" type="button" aria-label="Copiar enlace" onclick={() => onShare?.()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
              <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
            </svg>
          </button>
        {/if}
      </div>
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
            {@const status = performanceStatus(performance.id)}
            <button
              class:status-going={status === 'going'}
              class:status-maybe={status === 'maybe'}
              class:status-skip={status === 'mine-skip'}
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
      <div class="spotify-frame">
        <iframe title={`Spotify ${artist?.name}`} src={embed} width="100%" height="352" loading="lazy"></iframe>
      </div>
    {:else if artist}
      <a class="spotify-link" href={`https://open.spotify.com/search/${encodeURIComponent(artist.name)}`} target="_blank" rel="noreferrer">
        Buscar en Spotify
      </a>
    {/if}

    {#if interactive}
      <div class="status-buttons">
        <button class:selected={myVotes.get(selected.id)?.status === 'going'} class="going" type="button" onclick={() => handleVote(selected!.id, 'going')}>Me apunto</button>
        <button class:selected={myVotes.get(selected.id)?.status === 'maybe'} class="maybe" type="button" onclick={() => handleVote(selected!.id, 'maybe')}>Puede</button>
        <button class:selected={myVotes.get(selected.id)?.status === 'skip'} class="skip" type="button" onclick={() => handleVote(selected!.id, 'skip')}>Paso</button>
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
    height: 100%;
    min-height: 0;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 12;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 8px 0 10px;
    background: linear-gradient(180deg, rgba(5, 6, 8, 0.98), rgba(5, 6, 8, 0.88));
    backdrop-filter: blur(12px);
  }

  .days {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .days button,
  .route-toggle,
  .icon-button {
    min-height: 42px;
    border-radius: 999px;
    border-color: rgba(244, 241, 234, 0.18);
    background: rgba(244, 241, 234, 0.08);
    color: #f4f1ea;
  }

  .days button {
    padding: 0 18px;
    font-size: 18px;
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .icon-button {
    width: 42px;
    display: grid;
    place-items: center;
    padding: 0;
    border-radius: 999px;
  }

  .icon-button svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  button.active {
    background: #f4f1ea;
    color: #050608;
  }

  .schedule {
    position: relative;
    display: grid;
    grid-template-columns: 50px 1fr;
    height: 100%;
    min-height: min(820px, calc(100vh - 70px));
    overflow: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    border: 1px solid rgba(244, 241, 234, 0.1);
    border-radius: 0;
    background:
      linear-gradient(to bottom, rgba(244, 241, 234, 0.08) 1px, transparent 1px),
      rgba(244, 241, 234, 0.04);
    background-size: 100% 126px;
  }

  .schedule::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .time-axis {
    position: sticky;
    left: 0;
    z-index: 4;
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
    min-width: min(720px, calc(100vw - 66px));
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
    background: linear-gradient(180deg, color-mix(in srgb, var(--stage-color) 10%, transparent), transparent 34%);
  }

  .stage-column h2 {
    position: sticky;
    top: 0;
    z-index: 5;
    margin: 0;
    padding: 10px 6px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--stage-color) 34%, #050608), rgba(5, 6, 8, 0.94));
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0;
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
    border-color: rgba(244, 241, 234, 0.18);
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(244, 241, 234, 0.12), rgba(244, 241, 234, 0.05)),
      #202225;
    color: #f4f1ea;
    text-align: left;
    box-shadow:
      inset 5px 0 0 color-mix(in srgb, var(--stage-color) 78%, #f4f1ea 6%),
      0 12px 28px rgba(0, 0, 0, 0.22);
  }

  .performance.status-going {
    border-color: rgba(49, 242, 135, 0.7);
    background:
      linear-gradient(180deg, rgba(49, 242, 135, 0.28), rgba(49, 242, 135, 0.09)),
      #14251b;
    box-shadow:
      inset 6px 0 0 #31f287,
      0 0 24px rgba(49, 242, 135, 0.14);
  }

  .performance.status-maybe {
    border-color: rgba(245, 184, 75, 0.7);
    background:
      linear-gradient(180deg, rgba(245, 184, 75, 0.28), rgba(245, 184, 75, 0.08)),
      #282113;
    box-shadow:
      inset 6px 0 0 #f5b84b,
      0 0 24px rgba(245, 184, 75, 0.12);
  }

  .performance.status-skip {
    border-color: rgba(255, 77, 109, 0.72);
    background:
      linear-gradient(180deg, rgba(255, 77, 109, 0.24), rgba(255, 77, 109, 0.07)),
      #26161a;
    box-shadow:
      inset 6px 0 0 #ff4d6d,
      0 0 24px rgba(255, 77, 109, 0.12);
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
    scrollbar-width: none;
    padding: 22px;
    border-left: 1px solid rgba(244, 241, 234, 0.14);
    background: #0b0f14;
  }

  .sheet::-webkit-scrollbar {
    width: 0;
    height: 0;
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

  .spotify-frame {
    overflow: hidden;
    margin-top: 14px;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 10px;
    background: #121212;
  }

  iframe {
    display: block;
    border: 0;
    background: #121212;
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

  .status-buttons .going.selected {
    background: #31f287;
    color: #050608;
  }

  .status-buttons .maybe.selected {
    background: #f5b84b;
    color: #050608;
  }

  .status-buttons .skip.selected {
    background: #ff4d6d;
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
    .topbar {
      gap: 8px;
      padding: 8px 0;
    }

    .days {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .days::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    .days button {
      flex: 0 0 auto;
      min-height: 42px;
      padding: 0 12px;
      font-size: 17px;
    }

    .schedule {
      grid-template-columns: 42px 1fr;
      min-height: calc(100vh - 62px);
    }

    .stage-grid {
      min-width: max(520px, calc(100vw - 48px));
    }

    .time-axis span {
      right: 6px;
      font-size: 10px;
    }

    .stage-column h2 {
      padding: 8px 4px;
      font-size: 11px;
    }

    .performance {
      left: 4px;
      right: 4px;
      min-height: 74px;
      padding: 7px;
    }

    .performance strong {
      font-size: 13px;
    }

    .sheet {
      top: auto;
      left: 0;
      width: auto;
      max-height: 86vh;
      border-radius: 18px 18px 0 0;
      border-left: 0;
      border-top: 1px solid rgba(244, 241, 234, 0.14);
    }

    .sheet h2 {
      font-size: clamp(32px, 13vw, 54px);
    }

    .spotify-frame iframe {
      height: 300px;
    }

    .status-buttons {
      grid-template-columns: 1fr;
    }
  }
</style>
