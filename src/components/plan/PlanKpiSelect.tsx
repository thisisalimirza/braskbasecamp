import type { KpiDefinition } from "@/lib/kpis";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kpiUnitLabel } from "@/lib/kpi-units";
import { NO_KPI_VALUE } from "./PlanKpiBadge";

export function PlanKpiSelect({
  id,
  label = "Linked KPI",
  optionalLabel = "(optional)",
  kpis,
  value,
  onChange,
}: {
  id: string;
  label?: string;
  optionalLabel?: string;
  kpis: KpiDefinition[];
  value: string;
  onChange: (kpiDefinitionId: string) => void;
}) {
  if (kpis.length === 0) return null;

  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label}{" "}
        <span className="font-normal text-muted-foreground">{optionalLabel}</span>
      </Label>
      <Select
        value={value || NO_KPI_VALUE}
        onValueChange={(v) => onChange(!v || v === NO_KPI_VALUE ? "" : v)}
      >
        <SelectTrigger id={id} className="mt-1.5 w-full">
          <SelectValue>
            {(v) => {
              if (!v || v === NO_KPI_VALUE) return "No KPI link";
              const kpi = kpis.find((k) => k.id === v);
              if (!kpi) return "No KPI link";
              const unit = kpi.unit ? kpiUnitLabel(kpi.unit) : null;
              return unit ? `${kpi.name} · ${unit}` : kpi.name;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_KPI_VALUE}>No KPI link</SelectItem>
          {kpis.map((k) => (
            <SelectItem key={k.id} value={k.id}>
              {k.name}
              {k.unit ? ` · ${kpiUnitLabel(k.unit)}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Visual only — shows which metric this task should move.
      </p>
    </div>
  );
}
