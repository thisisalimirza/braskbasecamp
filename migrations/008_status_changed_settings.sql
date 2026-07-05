ALTER TABLE venture_plan_items ADD COLUMN status_changed_at INTEGER;

UPDATE venture_plan_items
SET status_changed_at = COALESCE(completed_at, created_at)
WHERE status_changed_at IS NULL;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('hard_wip_limits', '0', (strftime('%s', 'now') * 1000));
