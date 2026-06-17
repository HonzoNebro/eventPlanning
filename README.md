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

## Variables y secrets

Configura estas variables en el Worker desplegado, no solo en las variables del build:

- `ADMIN_PASSWORD`: contraseña única del panel admin. Debe ser un `Secret`.
- `SESSION_SECRET`: secreto largo para firmar cookies. Debe ser un `Secret`.
- Binding D1 `DB`.
- `CLOUDFLARE_API_TOKEN`: solo si usas un deploy command con Wrangler dentro de Cloudflare Builds.

Si estás usando Cloudflare Workers conectado a GitHub, hay dos sitios parecidos:

- `Build` -> `Variables and secrets`: variables disponibles durante `npm run build` y `npm run workers:deploy`.
- `Worker` -> `Settings` -> `Variables and Secrets`: variables disponibles para la app cuando un usuario entra en la web.

`ADMIN_PASSWORD` y `SESSION_SECRET` deben existir como runtime secrets del Worker. Si los creas solo en el apartado de build, el login admin no los verá.

Si Cloudflare ejecuta `npm run workers:deploy`, el token debe permitir desplegar Workers en la cuenta:

- Account permissions: `Workers Scripts:Edit`.
- Account permissions: `Account Settings:Read`.
- Account resources: la cuenta donde vive el proyecto Pages.

Si el token no tiene esos permisos, Wrangler falla con `Authentication error [code: 10000]`.

Despues de crear el token, copia su valor en la variable `CLOUDFLARE_API_TOKEN` del proyecto. Cloudflare solo muestra el valor una vez; si ya cerraste la pantalla, crea un token nuevo y reemplaza la variable. No basta con crear el token en `My Profile`.

## Deploy

1. Sube el repo a GitHub.
2. Crea un proyecto en Cloudflare Workers/Builds conectado al repo.
3. Build command: `npm run build`.
4. Build output directory: `.svelte-kit/cloudflare`.
5. Deploy command: `npm run workers:deploy`.
6. Crea la base D1 y reemplaza `database_id` en `wrangler.toml`.
7. Aplica migraciones con Wrangler.

Para crear la base D1 desde local:

```bash
npx wrangler d1 create event-planning
```

El comando devuelve un bloque como este:

```toml
[[d1_databases]]
binding = "DB"
database_name = "event-planning"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copia el `database_id` real en `wrangler.toml`, commitea y sube el cambio. Mientras `database_id` tenga `replace-with-cloudflare-d1-id`, el deploy falla con:

```text
binding DB of type d1 must have a valid `database_id` specified
```

Despues aplica migraciones en remoto:

```bash
npm run db:migrate:remote
```

Para publicar manualmente desde local, usa:

```bash
npm run deploy:workers
```

Si Cloudflare muestra un campo obligatorio de deploy command, usa `npm run workers:deploy` para subir el Worker y sus assets.

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
