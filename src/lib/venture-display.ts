import type { VentureHealth } from "./venture-health";

export type AttentionSnippet = {
  headline: string;
  context: string | null;
  badge: "Current blocker" | "Latest pulse" | null;
};

function normalize(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  return trimmed || null;
}

/** Current blocker from structured data or the latest pulse note with content. */
export function portfolioAttentionSnippet(
  row: Pick<VentureHealth, "trajectory" | "lastCheckinNote" | "primaryBlocker">
): AttentionSnippet | null {
  const pulseNote = normalize(row.lastCheckinNote);
  const blockerBody = normalize(row.primaryBlocker?.body);
  const headline = blockerBody ?? pulseNote;
  if (!headline) return null;

  if (blockerBody) {
    return {
      headline: blockerBody,
      context:
        pulseNote && pulseNote !== blockerBody ? `Latest pulse note: ${pulseNote}` : null,
      badge: "Current blocker",
    };
  }

  return { headline: pulseNote!, context: null, badge: "Latest pulse" };
}

/** One-line summary for tables and compact views. */
export function attentionHeadline(
  row: Pick<VentureHealth, "trajectory" | "lastCheckinNote" | "primaryBlocker">
): string | null {
  return portfolioAttentionSnippet(row)?.headline ?? null;
}

/** @deprecated Use attentionHeadline or portfolioAttentionSnippet */
export function displayBlockerText(
  row: Pick<VentureHealth, "trajectory" | "lastCheckinNote" | "primaryBlocker">
): string | null {
  return attentionHeadline(row);
}

/** First venture in priority order with something worth surfacing. */
export function topPortfolioAttention(summaries: VentureHealth[]): VentureHealth | null {
  return summaries.find((s) => portfolioAttentionSnippet(s) !== null) ?? null;
}
