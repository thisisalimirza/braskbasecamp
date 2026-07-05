export const KPI_UNITS = [
  { value: "count", label: "Count", hint: "Whole numbers — clients, items, etc." },
  { value: "users", label: "Users", hint: "Daily or monthly active users" },
  { value: "subscribers", label: "Subscribers", hint: "Paying or registered subscribers" },
  { value: "$", label: "Dollars", hint: "Revenue, pipeline value, MRR" },
  { value: "%", label: "Percent", hint: "Rates and ratios" },
] as const;

export type KpiUnit = (typeof KPI_UNITS)[number]["value"];

export const KPI_PRESETS = [
  { name: "Active subscribers", unit: "subscribers" as KpiUnit },
  { name: "Daily active users", unit: "users" as KpiUnit },
  { name: "Active clients", unit: "count" as KpiUnit },
  { name: "Pipeline value", unit: "$" as KpiUnit },
  { name: "Monthly revenue", unit: "$" as KpiUnit },
  { name: "Conversion rate", unit: "%" as KpiUnit },
] as const;

export function kpiUnitLabel(unit: string | null): string {
  return KPI_UNITS.find((u) => u.value === unit)?.label ?? unit ?? "Count";
}

export function formatKpiValue(value: number | null, unit: string | null): string {
  if (value == null) return "—";
  switch (unit) {
    case "$":
      return `$${value.toLocaleString()}`;
    case "%":
      return `${value}%`;
    case "users":
      return `${value.toLocaleString()} users`;
    case "subscribers":
      return `${value.toLocaleString()} subs`;
    case "count":
      return value.toLocaleString();
    default:
      return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
  }
}
