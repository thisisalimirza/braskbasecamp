export type EntryType = "revenue" | "cost";
export type OwnerDirection = "contribution" | "draw";

export const VENTURE_CATEGORY_HINTS: Record<string, string[]> = {
  "brask-studio": [
    "client_revenue",
    "service_fee",
    "contractor_payment",
    "software",
    "marketing",
    "other_revenue",
    "other_cost",
  ],
  rounds: [
    "subscription_revenue",
    "product_sale",
    "hosting",
    "software",
    "marketing",
    "other_revenue",
    "other_cost",
  ],
  "byline-blogs": [
    "subscription_revenue",
    "product_sale",
    "hosting",
    "software",
    "marketing",
    "other_revenue",
    "other_cost",
  ],
  "med-stack": [
    "subscription_revenue",
    "product_sale",
    "hosting",
    "software",
    "marketing",
    "other_revenue",
    "other_cost",
  ],
  sitr: [
    "subscription_revenue",
    "product_sale",
    "hosting",
    "software",
    "marketing",
    "other_revenue",
    "other_cost",
  ],
};

export const STUDIO_SLUG = "brask-studio";

export function getCategoryHints(slug: string | null | undefined): string[] | null {
  if (!slug) return null;
  return VENTURE_CATEGORY_HINTS[slug] ?? null;
}
