import { getDb } from "./db";

export type Category = {
  id: string;
  entryType: "revenue" | "cost";
  label: string;
  isDefault: boolean;
};

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    entryType: String(row.entry_type) as Category["entryType"],
    label: String(row.label),
    isDefault: Number(row.is_default) === 1,
  };
}

export async function listCategories(entryType?: "revenue" | "cost"): Promise<Category[]> {
  const db = await getDb();
  const res = entryType
    ? await db.execute({ sql: "SELECT * FROM categories WHERE entry_type = ? ORDER BY label", args: [entryType] })
    : await db.execute("SELECT * FROM categories ORDER BY entry_type, label");
  return res.rows.map((r) => rowToCategory(r as Record<string, unknown>));
}

export async function getCategoriesForEntry(
  entryType: "revenue" | "cost",
  ventureSlug?: string | null
): Promise<Category[]> {
  const all = await listCategories(entryType);
  const { getCategoryHints } = await import("./venture-config");
  const hints = getCategoryHints(ventureSlug);
  if (!hints) return all;
  const hinted = all.filter((c) => hints.includes(c.label));
  const fallbacks = all.filter((c) => c.label === `other_${entryType === "revenue" ? "revenue" : "cost"}`);
  const ids = new Set(hinted.map((c) => c.id));
  for (const f of fallbacks) if (!ids.has(f.id)) hinted.push(f);
  return hinted.length > 0 ? hinted : all;
}
