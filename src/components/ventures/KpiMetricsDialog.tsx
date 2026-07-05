"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import {
  createKpiDefinitionAction,
  deleteKpiDefinitionAction,
  createKpiEntryAction,
} from "@/app/actions";
import { KPI_PRESETS, KPI_UNITS, formatKpiValue, kpiUnitLabel } from "@/lib/kpi-units";
import type { KpiWithLatest } from "@/lib/kpis";
import { todayInput } from "@/lib/format";

export function KpiMetricsDialog({
  ventureId,
  ventureSlug,
  kpis,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger,
}: {
  ventureId: string;
  ventureSlug: string;
  kpis: KpiWithLatest[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("count");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    controlledOnOpenChange?.(next);
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

  return (
    <>
      {!hideTrigger && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground"
          onClick={() => handleOpenChange(true)}
        >
          <Pencil className="size-3.5" />
          Update metrics
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[min(88vh,640px)] overflow-y-auto sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Key numbers</DialogTitle>
            <DialogDescription>
              Log fresh values during your weekly pulse — or anytime something moves.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {kpis.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No metrics yet. Pick a preset below or name your own.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {kpis.map((kpi) => (
                  <MetricUpdateCard key={kpi.id} kpi={kpi} ventureSlug={ventureSlug} />
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Add a metric
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {KPI_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/[0.04] active:scale-[0.98]"
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
                    <Plus className="size-3 opacity-60" />
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <Field label="Custom name" hint="e.g. Waitlist signups, Churn rate">
                  <Input
                    placeholder="Metric name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Field label="Unit">
                    <Select value={unit} onValueChange={(v) => setUnit(v ?? "count")}>
                      <SelectTrigger className="w-full">
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
                  </Field>
                  <div className="flex items-end">
                    <Button onClick={handleAddDef} disabled={!name.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricUpdateCard({ kpi, ventureSlug }: { kpi: KpiWithLatest; ventureSlug: string }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLog = async () => {
    if (!value) return;
    setSaving(true);
    const res = await createKpiEntryAction(kpi.id, parseFloat(value), todayInput(), ventureSlug);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`${kpi.name} updated`);
      setValue("");
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium leading-tight">{kpi.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{kpiUnitLabel(kpi.unit)}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-lg font-semibold tabular-nums">
            {formatKpiValue(kpi.latestValue, kpi.unit)}
          </p>
          <p className="text-[10px] text-muted-foreground">current</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="New value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          disabled={!value || saving}
          onClick={handleLog}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${kpi.name}`}
          onClick={async () => {
            const res = await deleteKpiDefinitionAction(kpi.id, ventureSlug);
            if (res.error) toast.error(res.error);
            else toast.success(`Removed ${kpi.name}`);
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function KpiMetricsDialogProminent({
  ventureId,
  ventureSlug,
  kpis,
}: {
  ventureId: string;
  ventureSlug: string;
  kpis: KpiWithLatest[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Add your first metric
      </Button>
      <KpiMetricsDialog
        ventureId={ventureId}
        ventureSlug={ventureSlug}
        kpis={kpis}
        open={open}
        onOpenChange={setOpen}
        hideTrigger
      />
    </>
  );
}
