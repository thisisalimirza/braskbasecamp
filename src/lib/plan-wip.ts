import type { PlanItem, PlanItemStatus } from "./plan-types";

export const MAX_DOING_PER_VENTURE = 2;
export const MAX_DOING_PORTFOLIO = 4;

export function countDoingItems(items: PlanItem[], excludeId?: string): number {
  return items.filter((i) => i.status === "doing" && i.id !== excludeId).length;
}

export function wipLimitMessage(ventureDoing: number, portfolioDoing: number): string | null {
  if (portfolioDoing >= MAX_DOING_PORTFOLIO) {
    return `You have ${portfolioDoing} steps in progress across ventures — finish one before starting another.`;
  }
  if (ventureDoing >= MAX_DOING_PER_VENTURE) {
    return `This venture already has ${ventureDoing} steps in progress — finish or park one first.`;
  }
  return null;
}

/** Days since the item entered its current status. */
export function daysInCurrentStatus(item: PlanItem): number {
  const anchor =
    item.status === "done" && item.completedAt != null
      ? item.completedAt
      : item.statusChangedAt;
  return Math.floor((Date.now() - anchor) / (24 * 60 * 60 * 1000));
}

export function stepAgingLabel(item: PlanItem): string | null {
  if (item.status !== "doing" && item.status !== "next") return null;
  const days = daysInCurrentStatus(item);
  if (days < 3) return null;
  return item.status === "doing" ? `In progress ${days}d` : `Queued ${days}d`;
}

export function evaluateWipLimits(input: {
  hard: boolean;
  ventureItems: PlanItem[];
  portfolioDoing: number;
  movingItemId: string;
  currentStatus: PlanItemStatus;
  targetStatus: PlanItemStatus;
}): { allowed: boolean; message: string | null } {
  if (input.targetStatus !== "doing" || input.currentStatus === "doing") {
    return { allowed: true, message: null };
  }

  const ventureDoing = countDoingItems(input.ventureItems, input.movingItemId);
  const message = wipLimitMessage(ventureDoing, input.portfolioDoing);

  if (!message) return { allowed: true, message: null };
  if (input.hard) return { allowed: false, message };
  return { allowed: true, message };
}

/** @deprecated Use evaluateWipLimits */
export function canStartWithoutWipWarning(
  ventureItems: PlanItem[],
  portfolioDoing: number,
  hard = false,
  movingItemId?: string
): { ok: boolean; message: string | null } {
  const ventureDoing = countDoingItems(ventureItems, movingItemId);
  const message = wipLimitMessage(ventureDoing, portfolioDoing);
  if (!message) return { ok: true, message: null };
  if (hard) return { ok: false, message };
  return { ok: true, message };
}

export function promoteFromBacklogRequiresIntent(from: PlanItemStatus, to: PlanItemStatus): boolean {
  return from === "backlog" && (to === "next" || to === "doing");
}
