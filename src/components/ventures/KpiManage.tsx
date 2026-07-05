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
import { createKpiDefinitionAction, deleteKpiDefinitionAction, createKpiEntryAction } from "@/app/actions";
import { KPI_PRESETS, KPI_UNITS } from "@/lib/kpi-units";
import type { KpiWithLatest } from "@/lib/kpis";
import { todayInput } from "@/lib/format";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Collapsed metric management — logging and adding, kept out of the glance view */
export function KpiManage({
  ventureId,
  ventureSlug,
  kpis,
  defaultOpen,
}: {
  ventureId: string;
  ventureSlug: string;
  kpis: KpiWithLatest[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("count");

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

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Hide" : "Update or add metrics"}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {kpis.map((kpi) => (
            <LogKpiRow key={kpi.id} kpi={kpi} ventureSlug={ventureSlug} />
          ))}

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Add metric</p>
            <div className="flex flex-wrap gap-1.5">
              {KPI_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
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
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
              <Input
                placeholder="Custom name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
              />
              <Select value={unit} onValueChange={(v) => setUnit(v ?? "count")}>
                <SelectTrigger className="h-8 w-full">
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
              <Button size="sm" className="h-8" onClick={handleAddDef} disabled={!name.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogKpiRow({ kpi, ventureSlug }: { kpi: KpiWithLatest; ventureSlug: string }) {
  const [value, setValue] = useState("");

  const handleLog = async () => {
    if (!value) return;
    const res = await createKpiEntryAction(kpi.id, parseFloat(value), todayInput(), ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`${kpi.name} updated`);
      setValue("");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="w-28 shrink-0 truncate text-xs text-muted-foreground">{kpi.name}</Label>
      <Input
        type="number"
        placeholder="New value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 flex-1 text-sm"
      />
      <Button size="sm" variant="secondary" className="h-8 shrink-0" onClick={handleLog}>
        Log
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 shrink-0 px-2 text-muted-foreground"
        onClick={async () => {
          const res = await deleteKpiDefinitionAction(kpi.id, ventureSlug);
          if (res.error) toast.error(res.error);
        }}
      >
        ×
      </Button>
    </div>
  );
}
