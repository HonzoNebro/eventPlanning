<script lang="ts">
  import type { EventSummary } from '$lib/types';

  let { data, form }: { data: { event: EventSummary }; form?: { message?: string } } = $props();
</script>

<main class="entry">
  <section class="panel">
    <p class="muted">{data.event.name}</p>
    <h1>Crea tu grupo</h1>
    <p class="muted">Genera un enlace privado para compartir votos y notas con tu gente.</p>
    <form method="POST">
      <label class="trap" aria-hidden="true">
        Web
        <input name="website" tabindex="-1" autocomplete="off" />
      </label>
      <button type="submit">Crear grupo</button>
    </form>
    {#if form?.message}<p class="error">{form.message}</p>{/if}
  </section>
</main>

<style>
  .entry {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
  }

  section {
    width: min(520px, 100%);
    padding: 24px;
  }

  h1 {
    margin: 0;
    font-size: clamp(46px, 12vw, 82px);
    line-height: 0.9;
  }

  form {
    display: flex;
    justify-content: center;
    margin-top: 22px;
  }

  .trap {
    position: absolute;
    left: -9999px;
  }

  .error {
    color: #fb7185;
  }
</style>
