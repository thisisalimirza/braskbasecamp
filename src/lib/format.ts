/** Date helpers — all business dates stored as local-midnight unix ms. */

export function dateToMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function msToDateInput(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function dollarsToCents(dollars: string | number): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (Number.isNaN(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function startOfMonthMs(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

export function startOfPrevMonthMs(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime();
}

export function endOfMonthMs(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
}

export function todayMs(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function todayInput(): string {
  return msToDateInput(todayMs());
}

export function daysAgoMs(days: number): number {
  return todayMs() - days * 24 * 60 * 60 * 1000;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function categoryLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
