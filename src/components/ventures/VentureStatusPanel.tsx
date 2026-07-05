"use client";

import { AlertCircle, ClipboardList, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VentureDashboardCard } from "@/components/ventures/VentureDashboardCard";
import { formatDate, daysAgoMs } from "@/lib/format";
import { TRAJECTORY_LABELS } from "@/lib/next-actions";
import { openWeeklyCheckin, openRecordMoneyPrefilled } from "@/components/AppShell";
import type { Checkin } from "@/lib/checkins";
import { cn } from "@/lib/utils";

export function VentureStatusPanel({
  latestCheckin,
  ventureId,
}: {
  latestCheckin: Checkin | null;
  ventureId: string;
}) {
  const cutoff = daysAgoMs(14);
  const weekCutoff = daysAgoMs(7);
  const stale = !latestCheckin || latestCheckin.checkedAt < cutoff;
  const needsPulse = !latestCheckin || latestCheckin.checkedAt < weekCutoff;
  const daysSince = latestCheckin
    ? Math.floor((Date.now() - latestCheckin.checkedAt) / (24 * 60 * 60 * 1000))
    : null;

  const trajectory = latestCheckin?.trajectory ?? null;
  const note = latestCheckin?.note?.trim() || null;

  return (
    <VentureDashboardCard
      label="How it's going"
      footer={
        <p className="text-xs text-muted-foreground">
          Full history in the <strong>Past pulses</strong> tab below.
        </p>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <TrajectoryBadge trajectory={trajectory} />
        {latestCheckin ? (
          <span className="text-sm text-muted-foreground">
            Last pulse {formatDate(latestCheckin.checkedAt)}
            {daysSince != null && daysSince > 0 && ` · ${daysSince}d ago`}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">No pulse yet</span>
        )}
      </div>

      {note ? (
        <div
          className={cn(
            "mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed",
            trajectory === "down"
              ? "border border-red-200/80 bg-red-50/90 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
              : "bg-muted/50 text-foreground"
          )}
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {trajectory === "down" ? "What's stuck" : "Latest note"}
          </p>
          <p className="mt-1.5">{note}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {trajectory === "down"
            ? "Marked as struggling — add a note next time so you remember what's in the way."
            : "No notes from the last pulse."}
        </p>
      )}

      {stale && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {latestCheckin
              ? `It's been ${daysSince} days — a quick pulse keeps this venture current.`
              : "Run a pulse from the portfolio home to capture how this venture is doing."}
          </span>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {needsPulse && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openWeeklyCheckin()}>
            <ClipboardList className="size-3.5" />
            Run a pulse
          </Button>
        )}
        {trajectory === "down" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openRecordMoneyPrefilled({ ventureId, kind: "cost" })}
          >
            Log spending
          </Button>
        )}
      </div>
    </VentureDashboardCard>
  );
}

function TrajectoryBadge({ trajectory }: { trajectory: Checkin["trajectory"] | null }) {
  if (!trajectory) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const config = {
    up: { icon: TrendingUp, label: TRAJECTORY_LABELS.up, className: "status-up" },
    flat: { icon: Minus, label: TRAJECTORY_LABELS.flat, className: "status-flat" },
    down: { icon: TrendingDown, label: TRAJECTORY_LABELS.down, className: "status-down" },
  }[trajectory];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        config.className
      )}
    >
      <Icon className="size-4" />
      {config.label}
    </span>
  );
}
