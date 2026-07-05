"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/portfolio/KpiCard";
import { createKpiDefinitionAction, deleteKpiDefinitionAction, createKpiEntryAction } from "@/app/actions";
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
  const [unit, setUnit] = useState("count");

  const handleAddDef = async () => {
    if (!name.trim()) return;
    const res = await createKpiDefinitionAction(ventureId, name.trim(), unit, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("KPI added");
      setName("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.id}>
            <KpiCard name={kpi.name} value={kpi.latestValue} unit={kpi.unit} history={kpi.history} />
            <div className="mt-2 flex gap-2">
              <LogKpiForm kpiId={kpi.id} ventureSlug={ventureSlug} />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={async () => {
                  const res = await deleteKpiDefinitionAction(kpi.id, ventureSlug);
                  if (res.error) toast.error(res.error);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 rounded-lg border p-3">
        <Input placeholder="New KPI name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-[160px]" />
        <Input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="max-w-[100px]" />
        <Button size="sm" onClick={handleAddDef}>
          Add KPI
        </Button>
      </div>
    </div>
  );
}

function LogKpiForm({ kpiId, ventureSlug }: { kpiId: string; ventureSlug: string }) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayInput());

  const handleLog = async () => {
    if (!value) return;
    const res = await createKpiEntryAction(kpiId, parseFloat(value), date, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("KPI logged");
      setValue("");
    }
  };

  return (
    <div className="flex flex-1 gap-1">
      <Input
        type="number"
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 text-xs"
      />
      <Button size="sm" variant="outline" onClick={handleLog}>
        Log
      </Button>
    </div>
  );
}
