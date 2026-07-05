# Brask Base Camp

Internal management hub for Brask Group ventures.

## Stack

- Next.js 16 + TypeScript
- Turso (libSQL / SQLite)
- shadcn/ui + Tailwind 4
- Single-password auth (HMAC session cookie)

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Default login password: `changeme` (set `APP_PASSWORD` in `.env.local`).

Migrations run automatically on first DB access against `file:./local.db`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso URL or `file:./local.db` for local |
| `TURSO_AUTH_TOKEN` | Turso auth token (omit for local file) |
| `APP_PASSWORD` | Shared login password |
| `SESSION_SECRET` | HMAC secret for session cookie |

## Production (Turso + Vercel)

1. Create Turso database:
   ```bash
   turso db create brask-base-camp
   turso db show brask-base-camp --url
   turso db tokens create brask-base-camp
   ```

2. Run migrations:
   ```bash
   turso db shell brask-base-camp < migrations/001_schema.sql
   turso db shell brask-base-camp < migrations/002_seed_categories.sql
   turso db shell brask-base-camp < migrations/003_seed_ventures.sql
   ```

3. Deploy to Vercel and set env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_PASSWORD`, `SESSION_SECRET`).

4. Optional: enable Vercel Deployment Protection for an extra gate.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run migrate` — apply migrations to local.db manually
