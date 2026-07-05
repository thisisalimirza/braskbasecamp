import type { VentureHealth } from "./venture-health";

export type AttentionSnippet = {
  headline: string;
  context: string | null;
  badge: "Latest pulse" | "Primary blocker" | null;
};

function normalize(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  return trimmed || null;
}

/**
 * Merges pulse notes and structured blockers for portfolio UI.
 * Latest pulse wins when you're actively struggling; primary blocker anchors
 * longer-running issues. When both differ, pulse is the headline and
 * primary blocker becomes supporting context.
 */
export function portfolioAttentionSnippet(
  row: Pick<VentureHealth, "trajectory" | "lastCheckinNote" | "primaryBlocker">
): AttentionSnippet | null {
  const pulseNote = normalize(row.lastCheckinNote);
  const blockerBody = normalize(row.primaryBlocker?.body);
  const struggling = row.trajectory === "down";

  if (!pulseNote && !blockerBody) return null;

  if (pulseNote && blockerBody) {
    if (pulseNote === blockerBody) {
      return { headline: pulseNote, context: null, badge: "Latest pulse" };
    }
    if (struggling) {
      return {
        headline: pulseNote,
        context: `Main blocker: ${blockerBody}`,
        badge: "Latest pulse",
      };
    }
    return {
      headline: blockerBody,
      context: `Last pulse: ${pulseNote}`,
      badge: "Primary blocker",
    };
  }

  if (pulseNote && struggling) {
    return { headline: pulseNote, context: null, badge: "Latest pulse" };
  }

  if (blockerBody) {
    return { headline: blockerBody, context: null, badge: "Primary blocker" };
  }

  return null;
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
