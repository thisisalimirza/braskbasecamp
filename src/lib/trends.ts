export type MoneyTrend = "up" | "down" | "flat" | "new";

/** Compare this month net vs last month for trend arrows. */
export function moneyTrend(thisMonthCents: number, lastMonthCents: number): MoneyTrend {
  if (lastMonthCents === 0 && thisMonthCents > 0) return "new";
  if (thisMonthCents > lastMonthCents) return "up";
  if (thisMonthCents < lastMonthCents) return "down";
  return "flat";
}

export function moneyTrendDelta(thisMonthCents: number, lastMonthCents: number): number {
  return thisMonthCents - lastMonthCents;
}
