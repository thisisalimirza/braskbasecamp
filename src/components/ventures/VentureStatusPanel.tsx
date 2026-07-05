"use client";

import Link from "next/link";
import { AlertCircle, ClipboardList, Star, ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { VentureDashboardCard } from "@/components/ventures/VentureDashboardCard";
import { PlanKpiBadge } from "@/components/plan/PlanKpiBadge";
import { formatDate, daysAgoMs } from "@/lib/format";
import { TRAJECTORY_LABELS, planStatusLabel } from "@/lib/next-actions";
import { openWeeklyCheckinForVenture, openRecordMoneyPrefilled } from "@/components/AppShell";
import type { Checkin } from "@/lib/checkins";
import type { PlanItemStatus } from "@/lib/plan-types";
import { portfolioAttentionSnippet } from "@/lib/venture-display";
import { cn } from "@/lib/utils";

export function VentureStatusPanel({
  latestCheckin,
  ventureId,
  ventureSlug,
  primaryBlocker,
  openBlockerCount,
  focusPlanItem,
}: {
  latestCheckin: Checkin | null;
  ventureId: string;
  ventureSlug: string;
  primaryBlocker: { id: string; body: string } | null;
  openBlockerCount: number;
  focusPlanItem: { id: string; title: string; status: PlanItemStatus; kpiName: string | null } | null;
}) {
  const cutoff = daysAgoMs(14);
  const weekCutoff = daysAgoMs(7);
  const stale = !latestCheckin || latestCheckin.checkedAt < cutoff;
  const needsPulse = !latestCheckin || latestCheckin.checkedAt < weekCutoff;
  const daysSince = latestCheckin
    ? Math.floor((Date.now() - latestCheckin.checkedAt) / (24 * 60 * 60 * 1000))
    : null;

  const trajectory = latestCheckin?.trajectory ?? null;
  const attention = portfolioAttentionSnippet({
    trajectory,
    lastCheckinNote: latestCheckin?.note ?? null,
    primaryBlocker,
  });

  return (
    <VentureDashboardCard
      label="How it's going"
      footer={
        <Link
          href={`/ventures/${ventureSlug}?tab=plan`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open plan & blockers →
        </Link>
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

      {attention ? (
        <div className="mt-4 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-red-800/80 dark:text-red-300/80">
            {attention.badge === "Current blocker" && <Star className="size-3 fill-current" />}
            {attention.badge ?? "Needs attention"}
            {openBlockerCount > 1 && ` · +${openBlockerCount - 1} more`}
          </p>
          <p className="mt-1.5">{attention.headline}</p>
          {attention.context && (
            <p className="mt-2 text-xs text-red-900/70 dark:text-red-200/70">{attention.context}</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No blocker yet — note what&apos;s in the way on your next pulse, or add one on the Plan tab.
        </p>
      )}

      {focusPlanItem && (
        <Link
          href={`/ventures/${ventureSlug}?tab=plan`}
          className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3 transition-colors hover:bg-primary/[0.07]"
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {planStatusLabel(focusPlanItem.status)}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug">{focusPlanItem.title}</p>
            {focusPlanItem.kpiName && (
              <div className="mt-2">
                <PlanKpiBadge name={focusPlanItem.kpiName} />
              </div>
            )}
          </div>
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary/60" />
        </Link>
      )}

      {stale && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {latestCheckin
              ? `It's been ${daysSince} days — a quick pulse keeps this venture current.`
              : "Run a pulse to capture how this venture is doing."}
          </span>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {needsPulse && (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3.5 text-xs font-medium text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
            onClick={() => openWeeklyCheckinForVenture(ventureId)}
          >
            <ClipboardList className="size-3.5" />
            Run a pulse
          </button>
        )}
        {trajectory === "down" && (
          <Link
            href={`/ventures/${ventureSlug}?tab=plan`}
            className="inline-flex h-9 items-center rounded-full border border-border/80 bg-background px-3.5 text-xs font-medium shadow-sm transition-all hover:bg-muted/60"
          >
            Log blocker
          </Link>
        )}
        {trajectory === "down" && (
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full border border-border/80 bg-background px-3.5 text-xs font-medium shadow-sm transition-all hover:bg-muted/60 active:scale-[0.98]"
            onClick={() => openRecordMoneyPrefilled({ ventureId, kind: "cost" })}
          >
            Log spending
          </button>
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
