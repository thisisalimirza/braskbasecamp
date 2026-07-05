"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WizardShell, WizardStep, useWizard } from "./WizardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveWeeklyCheckinAction } from "@/app/actions";
import type { PulseReviewContext, VentureCheckinDraft } from "./weekly-checkin-types";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRAJECTORY_LABELS } from "@/lib/next-actions";
import type { Trajectory } from "@/lib/checkins";
import { PlanKpiSelect } from "@/components/plan/PlanKpiSelect";

function TrajectoryPicker({ value, onChange }: { value: Trajectory; onChange: (t: Trajectory) => void }) {
  const options = [
    { t: "up" as const, icon: TrendingUp, label: TRAJECTORY_LABELS.up, className: "status-up" },
    { t: "flat" as const, icon: Minus, label: TRAJECTORY_LABELS.flat, className: "status-flat" },
    { t: "down" as const, icon: TrendingDown, label: TRAJECTORY_LABELS.down, className: "status-down" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map(({ t, icon: Icon, label, className }) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-all duration-150",
            "hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-sm active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            value === t
              ? cn("border-primary/50 shadow-sm ring-1 ring-primary/15", className)
              : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
          )}
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
  reviewContext,
  onDone,
  singleVenture,
}: {
  initial: VentureCheckinDraft[];
  reviewContext: PulseReviewContext;
  onDone: () => void;
  singleVenture?: boolean;
}) {
  const { next, totalSteps } = useWizard();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);
  const reviewStep = totalSteps - 1;

  const updateItem = (idx: number, patch: Partial<VentureCheckinDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleTrajectory = (idx: number, trajectory: Trajectory) => {
    const item = items[idx];
    updateItem(idx, {
      trajectory,
      updateBlocker: trajectory === "down" ? true : item.updateBlocker,
    });
  };

  const validateVentureStep = (idx: number): boolean => {
    const item = items[idx];
    const needsStep =
      item.trajectory === "down" && !item.existingFocusTitle && !item.nextStepTitle.trim();
    if (needsStep) {
      toast.error(`Name the minimum next step for ${item.venture.name}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveWeeklyCheckinAction(
      items.map((item) => ({
        ventureId: item.venture.id,
        trajectory: item.trajectory,
        note: item.note || null,
        updateBlocker: item.note.trim() ? item.updateBlocker : false,
        nextStepTitle: item.nextStepTitle.trim() || null,
        nextStepKpiDefinitionId: item.nextStepKpiDefinitionId || null,
        kpiUpdates: item.kpis
          .filter((k) => item.kpiValues[k.id] !== "" && item.kpiValues[k.id] != null)
          .map((k) => ({ kpiDefinitionId: k.id, value: parseFloat(item.kpiValues[k.id]) })),
      }))
    );
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Pulse saved");
      router.refresh();
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
                    placeholder={
                      kpi.latestValue != null ? `Last pulse: ${kpi.latestValue}` : "Enter current value"
                    }
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
            <Label className="mb-2 block">How is it going?</Label>
            <TrajectoryPicker
              value={item.trajectory}
              onChange={(t) => handleTrajectory(idx, t)}
            />
          </div>
          <div className="mt-3">
            <Label>Anything stuck? (optional)</Label>
            <Textarea
              rows={2}
              value={item.note}
              onChange={(e) => {
                const note = e.target.value;
                updateItem(idx, {
                  note,
                  updateBlocker:
                    item.trajectory === "down" && note.trim().length > 0 ? true : item.updateBlocker,
                });
              }}
              placeholder="One line — what needs a decision?"
              className="mt-1"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Waiting on client", "Need to ship", "Revenue stalled", "Costs too high"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full border border-border/80 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground active:scale-[0.98]"
                  onClick={() =>
                    updateItem(idx, {
                      note: chip,
                      updateBlocker: item.trajectory === "down" ? true : item.updateBlocker,
                    })
                  }
                >
                  {chip}
                </button>
              ))}
            </div>
            {item.note.trim() && (
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={item.updateBlocker}
                  onChange={(e) => updateItem(idx, { updateBlocker: e.target.checked })}
                />
                <span>Update current blocker with this note</span>
              </label>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.03] p-3">
            <Label className="text-xs font-semibold text-foreground">
              Minimum next step
              {item.trajectory === "down" && !item.existingFocusTitle && (
                <span className="font-normal text-red-700 dark:text-red-300"> (required when struggling)</span>
              )}
            </Label>
            {item.existingFocusTitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                Current on plan: <span className="font-medium text-foreground">{item.existingFocusTitle}</span>
              </p>
            )}
            <Input
              className="mt-2"
              placeholder={
                item.existingFocusTitle
                  ? "Replace or add another step (optional)"
                  : "What's the smallest thing that moves this forward?"
              }
              value={item.nextStepTitle}
              onChange={(e) => updateItem(idx, { nextStepTitle: e.target.value })}
            />
            {item.kpis.length > 0 && (
              <PlanKpiSelect
                id={`pulse-kpi-${item.venture.id}`}
                label="Moves which KPI"
                kpis={item.kpis}
                value={item.nextStepKpiDefinitionId}
                onChange={(nextStepKpiDefinitionId) => updateItem(idx, { nextStepKpiDefinitionId })}
              />
            )}
          </div>

          <Button
            className="mt-4 w-full"
            onClick={() => {
              if (validateVentureStep(idx)) next();
            }}
          >
            {items.length === 1
              ? "Review"
              : idx === items.length - 1
                ? "Review everything"
                : "Next venture"}
          </Button>
        </WizardStep>
      ))}

      <WizardStep step={reviewStep}>
        <p className="text-sm font-medium">Quick review before saving</p>
        {reviewContext.pulseStreakWeeks > 0 && (
          <p className="mt-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
            {reviewContext.pulseStreakWeeks === 1
              ? "First full portfolio pulse this week — keep the streak going."
              : `${reviewContext.pulseStreakWeeks} weeks in a row with a full portfolio pulse.`}
          </p>
        )}
        {reviewContext.recentlyDone.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground">Shipped last 7 days</p>
            <ul className="mt-1.5 space-y-1">
              {reviewContext.recentlyDone.slice(0, 6).map((d) => (
                <li key={d.id} className="text-xs text-foreground">
                  <span className="font-medium">{d.ventureName}</span> · {d.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.venture.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.venture.name}</span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs",
                    item.trajectory === "up" && "status-up",
                    item.trajectory === "flat" && "status-flat",
                    item.trajectory === "down" && "status-down"
                  )}
                >
                  {TRAJECTORY_LABELS[item.trajectory]}
                </span>
              </div>
              {item.nextStepTitle.trim() && (
                <p className="mt-1 text-xs text-primary">Next: {item.nextStepTitle.trim()}</p>
              )}
              {item.tracksMoney && item.stalePnl && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  No money logged in {item.daysSincePnl != null ? `${item.daysSincePnl} days` : "over 2 weeks"}
                </p>
              )}
              {item.staleKpiNames.length > 0 && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {item.staleKpiNames.length === 1
                    ? `${item.staleKpiNames[0]} not updated on your last pulse`
                    : `${item.staleKpiNames.join(", ")} not updated on your last pulse`}
                </p>
              )}
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : singleVenture ? "Save pulse" : "Save all pulses"}
        </Button>
      </WizardStep>
    </>
  );
}

export function WeeklyCheckinWizard({
  open,
  onOpenChange,
  initial,
  reviewContext,
  title = "Venture pulse",
  singleVenture = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: VentureCheckinDraft[];
  reviewContext: PulseReviewContext;
  title?: string;
  singleVenture?: boolean;
}) {
  const totalSteps = initial.length + 1;
  return (
    <WizardShell open={open} onOpenChange={onOpenChange} title={title} totalSteps={totalSteps}>
      <WeeklyCheckinInner
        key={String(open)}
        initial={initial}
        reviewContext={reviewContext}
        singleVenture={singleVenture}
        onDone={() => onOpenChange(false)}
      />
    </WizardShell>
  );
}
