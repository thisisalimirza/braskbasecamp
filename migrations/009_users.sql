CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Per-user settings (replaces global app_settings; legacy values are copied
-- to the claiming user in code when the first account is created).
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT NOT NULL REFERENCES users(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Scope top-level data to a user. Rows with NULL user_id are pre-multi-user
-- legacy data; the first registered account claims them (see users.ts).
-- Venture children (checkins, kpi_*, venture_blockers, venture_plan_items,
-- venture_priorities) are scoped through their venture's user_id.
ALTER TABLE ventures ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE clients ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE pnl_entries ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE reference_facts ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE reference_links ADD COLUMN user_id TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_ventures_user ON ventures(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_pnl_user ON pnl_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_facts_user ON reference_facts(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_links_user ON reference_links(user_id);
