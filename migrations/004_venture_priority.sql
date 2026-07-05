CREATE TABLE IF NOT EXISTS venture_priorities (
  venture_id TEXT PRIMARY KEY REFERENCES ventures(id) ON DELETE CASCADE,
  priority_order INTEGER NOT NULL
);

-- Default order for seeded ventures (lower = higher priority)
INSERT OR IGNORE INTO venture_priorities (venture_id, priority_order) VALUES
  ('v-rounds', 0),
  ('v-byline', 1),
  ('v-medstack', 2),
  ('v-sitr', 3),
  ('v-studio', 4);
