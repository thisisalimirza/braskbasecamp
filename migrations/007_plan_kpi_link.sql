ALTER TABLE venture_plan_items ADD COLUMN kpi_definition_id TEXT REFERENCES kpi_definitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plan_kpi ON venture_plan_items(kpi_definition_id);
