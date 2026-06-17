<script lang="ts">
  let { form }: { form?: { message?: string } } = $props();
</script>

<main class="entry">
  <form class="panel" method="POST">
    <h1>Admin</h1>
    <label>
      Contraseña
      <input name="password" type="password" autocomplete="current-password" />
    </label>
    <button type="submit">Entrar</button>
    {#if form?.message}<p class="error">{form.message}</p>{/if}
  </form>
</main>

<style>
  .entry {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
  }

  form {
    width: min(420px, 100%);
    display: grid;
    gap: 14px;
    padding: 20px;
  }

  h1 {
    margin: 0;
  }

  label {
    display: grid;
    gap: 8px;
  }

  input {
    min-height: 44px;
    border: 1px solid rgba(244, 241, 234, 0.14);
    border-radius: 8px;
    background: rgba(244, 241, 234, 0.1);
    color: #f4f1ea;
    padding: 10px;
  }

  .error {
    color: #fb7185;
  }
</style>
