INSERT OR IGNORE INTO ventures (id, name, slug, venture_type, status, one_liner, created_at, updated_at) VALUES
  ('v-rounds', 'Rounds', 'rounds', 'product', 'active', 'Daily trivia game', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('v-byline', 'Byline Blogs', 'byline-blogs', 'media', 'active', 'Blog network', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('v-medstack', 'Med Stack', 'med-stack', 'product', 'active', 'Medical education tools', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('v-sitr', 'Sitr', 'sitr', 'product', 'active', 'Restaurant seating app', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('v-studio', 'Brask Studio', 'brask-studio', 'service', 'active', 'Client services', strftime('%s','now') * 1000, strftime('%s','now') * 1000);

INSERT OR IGNORE INTO kpi_definitions (id, venture_id, name, unit, sort_order, created_at) VALUES
  ('kpi-studio-clients', 'v-studio', 'Active clients', 'count', 0, strftime('%s','now') * 1000),
  ('kpi-studio-pipeline', 'v-studio', 'Pipeline value', '$', 1, strftime('%s','now') * 1000);

INSERT OR IGNORE INTO reference_facts (id, scope, label, value, category, created_at, updated_at) VALUES
  ('ref-ein', 'global', 'EIN', '', 'legal', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('ref-agent', 'global', 'Registered agent', '', 'legal', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('ref-inc', 'global', 'Incorporation date', '', 'legal', strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('ref-bank', 'global', 'Bank', 'Mercury', 'financial', strftime('%s','now') * 1000, strftime('%s','now') * 1000);
