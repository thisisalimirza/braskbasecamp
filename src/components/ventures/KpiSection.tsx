"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/portfolio/KpiCard";
import { createKpiDefinitionAction, deleteKpiDefinitionAction, createKpiEntryAction } from "@/app/actions";
import { KPI_PRESETS, KPI_UNITS } from "@/lib/kpi-units";
import type { KpiWithLatest } from "@/lib/kpis";
import { todayInput } from "@/lib/format";

export function KpiSection({
  ventureId,
  ventureSlug,
  kpis,
}: {
  ventureId: string;
  ventureSlug: string;
  kpis: KpiWithLatest[];
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<string>("count");

  const applyPreset = (preset: (typeof KPI_PRESETS)[number]) => {
    setName(preset.name);
    setUnit(preset.unit);
  };

  const handleAddDef = async () => {
    if (!name.trim()) return;
    const res = await createKpiDefinitionAction(ventureId, name.trim(), unit, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Metric added");
      setName("");
      setUnit("count");
    }
  };

  if (kpis.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Track health metrics separate from money — subscribers, users, clients, etc.
        </p>
        <div className="flex flex-wrap gap-2">
          {KPI_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const res = await createKpiDefinitionAction(
                  ventureId,
                  preset.name,
                  preset.unit,
                  ventureSlug
                );
                if (res.error) toast.error(res.error);
                else toast.success(`Added ${preset.name}`);
              }}
            >
              + {preset.name}
            </Button>
          ))}
        </div>
        <CustomKpiForm
          name={name}
          unit={unit}
          onName={setName}
          onUnit={setUnit}
          onPreset={applyPreset}
          onSubmit={handleAddDef}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {kpis.map((kpi) => {
          const previous =
            kpi.history.length >= 2 ? kpi.history[kpi.history.length - 2] : null;
          return (
            <div key={kpi.id} className="space-y-3">
              <KpiCard
                name={kpi.name}
                value={kpi.latestValue}
                unit={kpi.unit}
                history={kpi.history}
                previousValue={previous}
              />
              <LogKpiForm kpiId={kpi.id} kpiName={kpi.name} ventureSlug={ventureSlug} />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={async () => {
                  const res = await deleteKpiDefinitionAction(kpi.id, ventureSlug);
                  if (res.error) toast.error(res.error);
                }}
              >
                Remove metric
              </Button>
            </div>
          );
        })}
      </div>
      <details className="rounded-xl border border-dashed border-border/80 p-4">
        <summary className="cursor-pointer text-sm font-medium">Add another metric</summary>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {KPI_PRESETS.map((preset) => (
              <Button key={preset.name} type="button" variant="outline" size="sm" onClick={() => applyPreset(preset)}>
                {preset.name}
              </Button>
            ))}
          </div>
          <CustomKpiForm
            name={name}
            unit={unit}
            onName={setName}
            onUnit={setUnit}
            onPreset={applyPreset}
            onSubmit={handleAddDef}
          />
        </div>
      </details>
    </div>
  );
}

function CustomKpiForm({
  name,
  unit,
  onName,
  onUnit,
  onSubmit,
}: {
  name: string;
  unit: string;
  onName: (v: string) => void;
  onUnit: (v: string) => void;
  onPreset: (p: (typeof KPI_PRESETS)[number]) => void;
  onSubmit: () => void;
}) {
  const selectedUnit = KPI_UNITS.find((u) => u.value === unit);
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
      <div>
        <Label className="text-xs">Metric name</Label>
        <Input value={name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Active subscribers" className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Unit</Label>
        <Select value={unit} onValueChange={(v) => onUnit(v ?? "count")}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KPI_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedUnit && <p className="mt-1 text-[11px] text-muted-foreground">{selectedUnit.hint}</p>}
      </div>
      <div className="flex items-end">
        <Button onClick={onSubmit} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

function LogKpiForm({
  kpiId,
  kpiName,
  ventureSlug,
}: {
  kpiId: string;
  kpiName: string;
  ventureSlug: string;
}) {
  const [value, setValue] = useState("");

  const handleLog = async () => {
    if (!value) return;
    const res = await createKpiEntryAction(kpiId, parseFloat(value), todayInput(), ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`${kpiName} updated`);
      setValue("");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder="New value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9"
      />
      <Button size="sm" variant="secondary" onClick={handleLog}>
        Log today
      </Button>
    </div>
  );
}
