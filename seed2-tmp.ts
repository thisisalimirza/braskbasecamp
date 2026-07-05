import { createClient } from "@libsql/client";
const db = createClient({ url: "file:./local.db" });
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
await db.execute(`INSERT OR REPLACE INTO venture_plan_items (id, venture_id, title, notes, status, blocker_id, sort_order, created_at, status_changed_at, completed_at) VALUES
  ('p3', 'v-rounds', 'Interview 5 churned users', 'Ask why they stopped after the paywall', 'backlog', NULL, 0, ${now - 2 * day}, ${now - 2 * day}, NULL),
  ('p4', 'v-rounds', 'Ship daily streak feature', NULL, 'done', NULL, 0, ${now - 9 * day}, ${now - 3 * day}, ${now - 3 * day}),
  ('p5', 'v-youtube', 'Outline next 3 videos', NULL, 'backlog', NULL, 1, ${now - 1 * day}, ${now - 1 * day}, NULL),
  ('p6', 'v-studio', 'DM 10 past contacts about availability', 'Start with old coworkers', 'doing', 'b3', 0, ${now - 6 * day}, ${now - 6 * day}, NULL),
  ('p7', 'v-byline', 'Set up plausible analytics', NULL, 'done', NULL, 1, ${now - 12 * day}, ${now - 5 * day}, ${now - 5 * day})`);
console.log("seeded extra plan items");
