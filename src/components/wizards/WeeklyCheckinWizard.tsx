"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WizardShell, WizardStep, useWizard } from "./WizardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveWeeklyCheckinAction } from "@/app/actions";
import type { VentureCheckinDraft } from "./weekly-checkin-types";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trajectory } from "@/lib/checkins";

function TrajectoryPicker({ value, onChange }: { value: Trajectory; onChange: (t: Trajectory) => void }) {
  const options = [
    { t: "up" as const, icon: TrendingUp, label: "Up", className: "status-up" },
    { t: "flat" as const, icon: Minus, label: "Flat", className: "status-flat" },
    { t: "down" as const, icon: TrendingDown, label: "Down", className: "status-down" },
  ];
  return (
    <div className="flex gap-2">
      {options.map(({ t, icon: Icon, label, className }) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn("flex flex-1 flex-col items-center gap-1 rounded-lg border p-2 text-xs", value === t && className)}
        >
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function WeeklyCheckinInner({
  initial,
  onDone,
}: {
  initial: VentureCheckinDraft[];
  onDone: () => void;
}) {
  const { next, totalSteps } = useWizard();
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);
  const reviewStep = totalSteps - 1;

  const updateItem = (idx: number, patch: Partial<VentureCheckinDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveWeeklyCheckinAction(
      items.map((item) => ({
        ventureId: item.venture.id,
        trajectory: item.trajectory,
        note: item.note || null,
        kpiUpdates: item.kpis
          .filter((k) => item.kpiValues[k.id] !== "" && item.kpiValues[k.id] != null)
          .map((k) => ({ kpiDefinitionId: k.id, value: parseFloat(item.kpiValues[k.id]) })),
      }))
    );
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Check-in saved");
      onDone();
    }
  };

  return (
    <>
      {items.map((item, idx) => (
        <WizardStep key={item.venture.id} step={idx}>
          <h3 className="font-semibold">{item.venture.name}</h3>
          {item.kpis.length > 0 && (
            <div className="mt-3 space-y-3">
              {item.kpis.map((kpi) => (
                <div key={kpi.id}>
                  <Label>
                    {kpi.name}
                    {kpi.unit ? ` (${kpi.unit})` : ""}
                  </Label>
                  <Input
                    type="number"
                    className="mt-1"
                    placeholder={kpi.latestValue?.toString() ?? ""}
                    value={item.kpiValues[kpi.id] ?? ""}
                    onChange={(e) =>
                      updateItem(idx, { kpiValues: { ...item.kpiValues, [kpi.id]: e.target.value } })
                    }
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Label className="mb-2 block">Trajectory</Label>
            <TrajectoryPicker value={item.trajectory} onChange={(t) => updateItem(idx, { trajectory: t })} />
          </div>
          <div className="mt-3">
            <Label>What&apos;s blocked? (optional)</Label>
            <Textarea
              rows={2}
              value={item.note}
              onChange={(e) => updateItem(idx, { note: e.target.value })}
              placeholder="One line — what needs a decision?"
              className="mt-1"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Waiting on client", "Need to ship", "Revenue stalled", "Costs too high"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full border border-border/80 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                  onClick={() => updateItem(idx, { note: chip })}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <Button className="mt-4 w-full" onClick={next}>
            {idx === items.length - 1 ? "Review" : "Next venture"}
          </Button>
        </WizardStep>
      ))}

      <WizardStep step={reviewStep}>
        <p className="text-sm font-medium">Review before saving</p>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.venture.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.venture.name}</span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs capitalize",
                    item.trajectory === "up" && "status-up",
                    item.trajectory === "flat" && "status-flat",
                    item.trajectory === "down" && "status-down"
                  )}
                >
                  {item.trajectory}
                </span>
              </div>
              {item.stalePnl && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  No money entry in {item.daysSincePnl != null ? `${item.daysSincePnl} days` : "over 2 weeks"}
                </p>
              )}
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save check-in"}
        </Button>
      </WizardStep>
    </>
  );
}

export function WeeklyCheckinWizard({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: VentureCheckinDraft[];
}) {
  const totalSteps = initial.length + 1;
  return (
    <WizardShell open={open} onOpenChange={onOpenChange} title="Weekly check-in" totalSteps={totalSteps}>
      <WeeklyCheckinInner key={String(open)} initial={initial} onDone={() => onOpenChange(false)} />
    </WizardShell>
  );
}
