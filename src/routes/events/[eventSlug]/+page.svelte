<script lang="ts">
  import ScheduleView from '$lib/components/ScheduleView.svelte';
  import type { SchedulePayload } from '$lib/types';

  let { data }: { data: { schedule: SchedulePayload } } = $props();
</script>

<main class="page">
  <header class="event-header">
    <div>
      <p class="muted">{data.schedule.festival.startsOn} - {data.schedule.festival.endsOn}</p>
      <h1>{data.schedule.festival.name}</h1>
    </div>
    <a class="button" href={`/events/${data.schedule.festival.slug}/new-group`}>Crear grupo</a>
  </header>
  <ScheduleView schedule={data.schedule} />
</main>

<style>
  .event-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
    margin-bottom: 20px;
  }

  h1 {
    margin: 0;
    font-size: clamp(38px, 8vw, 78px);
    line-height: 0.95;
  }

  @media (max-width: 680px) {
    .event-header {
      display: grid;
      align-items: start;
    }
  }
</style>
