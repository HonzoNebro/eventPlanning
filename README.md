# Event Planning

Plataforma SvelteKit para crear eventos multi-escenario, publicar horarios y compartir rutas privadas de grupo con votos y notas.

## Stack

- SvelteKit + TypeScript
- `@sveltejs/adapter-cloudflare`
- Cloudflare Pages Functions
- Cloudflare D1
- Vitest

## Desarrollo

```bash
npm install
npm run dev
```

Para desarrollo real con D1 local:

```bash
npx wrangler d1 create event-planning
npx wrangler d1 migrations apply event-planning --local
npm run dev
```

El seed crea un evento público en `/events/demo-fest`.

## Variables

Configura en Cloudflare Pages:

- `ADMIN_PASSWORD`: contraseña única del panel admin.
- `SESSION_SECRET`: secreto largo para firmar cookies.
- Binding D1 `DB`.

## Deploy

1. Sube el repo a GitHub.
2. Crea un proyecto en Cloudflare Pages conectado al repo.
3. Build command: `npm run build`.
4. Build output directory: `.svelte-kit/cloudflare`.
5. Deploy command: deja este campo vacio. No uses `npx wrangler deploy`; ese comando es para Workers y falla en proyectos Pages.
6. Crea la base D1 y reemplaza `database_id` en `wrangler.toml`.
7. Aplica migraciones con Wrangler.

Para publicar manualmente desde local, usa:

```bash
npm run deploy:pages
```

En Cloudflare Pages, el despliegue conectado a GitHub no necesita ese comando manual: Pages sube automaticamente el output del build.

## Rutas

- `/`: eventos publicados.
- `/events/:eventSlug`: horario público.
- `/events/:eventSlug/new-group`: crea enlace privado.
- `/app/:eventSlug?g=:token`: app social de grupo.
- `/admin/login`: login admin.
- `/admin/events`: importar/listar eventos.

## Formato de Importación

El admin acepta JSON con:

- `event`: slug, name, timezone, startsOn, endsOn, isPublic.
- `days`: id, label, visualStartsAt, visualEndsAt, durationMinutes.
- `stages`: id, name, color, order.
- `artists`: id, name, links.spotify, genres.
- `performances`: id, visualDayId, artistId, stageId, startsAt, endsAt, confidence.

`startMinute`, `durationMinutes` y `crossesMidnight` se calculan si no vienen en el JSON.
