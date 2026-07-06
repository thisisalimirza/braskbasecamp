# Brask Base Camp

Venture management hub — each user has their own account and their own portfolio of ventures.

## Stack

- Next.js 16 + TypeScript
- Turso (libSQL / SQLite)
- shadcn/ui + Tailwind 4
- Email + password accounts (scrypt password hashes, HMAC-signed session cookie)

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit `/register` to create an account. Migrations run automatically on first DB access against `file:./local.db`.

## Accounts & data ownership

- Anyone can create an account at `/register`; every account has fully isolated ventures, P&L, tasks, and settings.
- **The first account ever registered claims all data created before multi-user support** (pre-existing ventures, money history, settings). If you are upgrading an existing deployment, register your own account before sharing the link.

## Environment variables

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso URL or `file:./local.db` for local |
| `TURSO_AUTH_TOKEN` | Turso auth token (omit for local file) |
| `SESSION_SECRET` | HMAC secret for session cookies. **Required in production** — generate with `openssl rand -base64 32` |

`APP_PASSWORD` is no longer used — logins are per-account.

## Production (Turso + Vercel)

1. Create Turso database:
   ```bash
   turso db create brask-base-camp
   turso db show brask-base-camp --url
   turso db tokens create brask-base-camp
   ```

2. Run migrations (pick one):
   ```bash
   # Against Turso — set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first
   npm run migrate
   ```
   Migrations also run automatically on first DB access in the app, but running `npm run migrate` once after deploy confirms the remote schema is current.

3. Deploy to Vercel and set env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`).

4. Register your account first so it claims your existing data, then share the URL with friends.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run migrate` — apply migrations to local.db manually
