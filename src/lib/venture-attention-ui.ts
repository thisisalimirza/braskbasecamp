import type { AttentionReason } from "./attention";
import type { VentureHealth } from "./venture-health";
import { friendlyActionHint } from "./next-actions";

export type AttentionChip = {
  reason: AttentionReason;
  label: string;
  tone: "danger" | "warning" | "neutral";
};

const CHIP_TONE: Record<AttentionReason, AttentionChip["tone"]> = {
  trajectory_down: "danger",
  stale_checkin: "warning",
  stale_pnl: "warning",
  stale_kpi: "warning",
  new_negative_month: "warning",
};

export function attentionChipsForVenture(row: VentureHealth): AttentionChip[] {
  const chips: AttentionChip[] = row.reasons.map((reason) => ({
    reason,
    label: friendlyActionHint(reason),
    tone: CHIP_TONE[reason],
  }));

  if (!row.nextPlanStep) {
    chips.push({
      reason: "stale_checkin",
      label: "No minimum next step set",
      tone: "neutral",
    });
  }

  return chips;
}

export function attentionChipClass(tone: AttentionChip["tone"]): string {
  switch (tone) {
    case "danger":
      return "border-red-200/80 bg-red-50/90 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100";
    case "warning":
      return "border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100";
    case "neutral":
      return "border-border/80 bg-muted/40 text-muted-foreground";
  }
}
