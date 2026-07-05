CREATE TABLE IF NOT EXISTS venture_blockers (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL REFERENCES ventures(id),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  is_primary INTEGER NOT NULL DEFAULT 0,
  source_checkin_id TEXT REFERENCES checkins(id),
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blockers_venture_status ON venture_blockers(venture_id, status);

CREATE TABLE IF NOT EXISTS venture_plan_items (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL REFERENCES ventures(id),
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  blocker_id TEXT REFERENCES venture_blockers(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_plan_venture_status ON venture_plan_items(venture_id, status);
