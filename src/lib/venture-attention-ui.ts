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
      return "border-red-600/10 bg-red-50/70 text-red-900/80 dark:border-red-400/15 dark:bg-red-950/25 dark:text-red-200/90";
    case "warning":
      return "border-amber-600/10 bg-amber-50/70 text-amber-900/80 dark:border-amber-400/15 dark:bg-amber-950/20 dark:text-amber-200/90";
    case "neutral":
      return "border-border/60 bg-muted/50 text-muted-foreground/90";
  }
}
