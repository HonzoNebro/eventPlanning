<script lang="ts">
  import { onMount } from 'svelte';
  import ScheduleView from '$lib/components/ScheduleView.svelte';
  import type { Interest, InterestStatus, Note, Participant, SchedulePayload } from '$lib/types';

  let { data }: { data: { schedule: SchedulePayload } } = $props();

  let loading = $state(true);
  let error = $state('');
  let participant = $state<Participant | null>(null);
  let participants = $state<Participant[]>([]);
  let interests = $state<Interest[]>([]);
  let notes = $state<Note[]>([]);
  let nameModal = $state(false);
  let displayName = $state('');
  let noteModal = $state<string | null>(null);
  let noteBody = $state('');
  let groupUrl = $state('');
  let copied = $state(false);

  async function loadSocial() {
    const [bootstrapResponse, participantsResponse, interestsResponse] = await Promise.all([
      fetch('/api/bootstrap'),
      fetch('/api/groups/current/participants'),
      fetch('/api/groups/current/interests')
    ]);
    const bootstrap = await bootstrapResponse.json();
    if (!bootstrap.hasAccess) {
      error = 'Abre la app desde el enlace privado del grupo.';
      return;
    }
    participant = bootstrap.participant;
    participants = (await participantsResponse.json()).participants ?? [];
    const social = await interestsResponse.json();
    interests = social.interests ?? [];
    notes = social.notes ?? [];
  }

  onMount(async () => {
    const token = new URLSearchParams(location.search).get('g');
    const storageKey = `group-url:${location.pathname}`;
    try {
      if (token) {
        groupUrl = `${location.origin}${location.pathname}?g=${encodeURIComponent(token)}`;
        localStorage.setItem(storageKey, groupUrl);
        await fetch(`/api/groups/activate/${encodeURIComponent(token)}`, { method: 'POST' });
      } else {
        groupUrl = localStorage.getItem(storageKey) ?? '';
      }
      await loadSocial();
      if (!participant) nameModal = true;
    } catch {
      error = 'No se pudo cargar el grupo.';
    } finally {
      loading = false;
    }
  });

  async function saveName() {
    const endpoint = participant ? '/api/me' : '/api/groups/current/participants';
    const method = participant ? 'PATCH' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName })
    });
    if (!response.ok) return;
    participant = (await response.json()).participant;
    displayName = '';
    nameModal = false;
    await loadSocial();
  }

  async function vote(performanceId: string, status: InterestStatus) {
    await fetch(`/api/me/interests/${encodeURIComponent(performanceId)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status })
    });
    await loadSocial();
  }

  async function clearVote(performanceId: string) {
    await fetch(`/api/me/interests/${encodeURIComponent(performanceId)}`, { method: 'DELETE' });
    await loadSocial();
  }

  async function saveNote() {
    if (!noteModal) return;
    const response = await fetch(`/api/me/notes/${encodeURIComponent(noteModal)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: noteBody })
    });
    if (response.ok) {
      noteBody = '';
      noteModal = null;
      await loadSocial();
    }
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/me/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' });
    await loadSocial();
  }

  async function copyGroupUrl() {
    const url = groupUrl || location.href;
    await navigator.clipboard.writeText(url);
    copied = true;
    window.setTimeout(() => (copied = false), 1600);
  }
</script>

<main class="page social-page">
  {#if loading}
    <p class="center muted">Cargando horario...</p>
  {:else if error}
    <p class="center">{error}</p>
  {:else}
    <ScheduleView
      schedule={data.schedule}
      interactive
      social={{ participants, interests, notes, participant }}
      onNeedName={() => { displayName = participant?.displayName ?? ''; nameModal = true; }}
      onShare={copyGroupUrl}
      shareCopied={copied}
      onVote={vote}
      onClearVote={clearVote}
      onAddNote={(performanceId) => { noteModal = performanceId; noteBody = ''; }}
      onDeleteNote={deleteNote}
    />
  {/if}
</main>

{#if nameModal}
  <button class="scrim" aria-label="Cerrar" onclick={() => (nameModal = false)}></button>
  <form class="modal panel" onsubmit={(event) => { event.preventDefault(); saveName(); }}>
    <h2>¿Cómo te llamas?</h2>
    <input bind:value={displayName} maxlength="40" />
    <button type="submit">Guardar</button>
  </form>
{/if}

{#if noteModal}
  <button class="scrim" aria-label="Cancelar" onclick={() => (noteModal = null)}></button>
  <form class="modal panel" onsubmit={(event) => { event.preventDefault(); saveNote(); }}>
    <h2>Nota</h2>
    <textarea bind:value={noteBody} maxlength="180" placeholder="Escribe una nota para tu grupo"></textarea>
    <button type="submit">Guardar</button>
  </form>
{/if}

<style>
  .social-page {
    width: min(1480px, calc(100vw - 16px));
    min-height: 100vh;
    height: 100vh;
    padding: 0 0 8px;
  }

  .center {
    min-height: 50vh;
    display: grid;
    place-items: center;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 30;
    border: 0;
    border-radius: 0;
    background: rgba(0, 0, 0, 0.62);
  }

  .modal {
    position: fixed;
    z-index: 31;
    left: 50%;
    top: 50%;
    width: min(420px, calc(100vw - 32px));
    display: grid;
    gap: 14px;
    padding: 18px;
    transform: translate(-50%, -50%);
  }

  .modal h2 {
    margin: 0;
  }

  input,
  textarea {
    width: 100%;
    min-height: 46px;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.1);
    color: #f4f1ea;
    padding: 10px;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  @media (max-width: 680px) {
    .social-page {
      width: calc(100vw - 8px);
      padding-bottom: 4px;
    }
  }
</style>
