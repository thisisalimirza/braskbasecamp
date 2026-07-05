CREATE TABLE IF NOT EXISTS ventures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  venture_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  one_liner TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  entry_type TEXT NOT NULL,
  label TEXT NOT NULL,
  is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'lead',
  estimated_value_cents INTEGER,
  contact_info TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pnl_entries (
  id TEXT PRIMARY KEY,
  venture_id TEXT REFERENCES ventures(id),
  entry_type TEXT NOT NULL,
  direction TEXT,
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  occurred_on INTEGER NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  payment_source TEXT,
  client_id TEXT REFERENCES clients(id),
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pnl_venture_date ON pnl_entries(venture_id, occurred_on);
CREATE INDEX IF NOT EXISTS idx_pnl_type ON pnl_entries(entry_type);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL REFERENCES ventures(id),
  name TEXT NOT NULL,
  unit TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS kpi_entries (
  id TEXT PRIMARY KEY,
  kpi_definition_id TEXT NOT NULL REFERENCES kpi_definitions(id),
  value REAL NOT NULL,
  recorded_on INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kpi_entries_def_date ON kpi_entries(kpi_definition_id, recorded_on);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL REFERENCES ventures(id),
  checked_at INTEGER NOT NULL,
  trajectory TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_venture_date ON checkins(venture_id, checked_at);

CREATE TABLE IF NOT EXISTS reference_facts (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reference_links (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
