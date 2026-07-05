import { TrendingDown, TrendingUp, Minus, AlertCircle, ClipboardCheck } from "lucide-react";
import { formatDate, daysAgoMs } from "@/lib/format";
import type { Checkin } from "@/lib/checkins";
import { cn } from "@/lib/utils";

export function VentureStatusPanel({
  latestCheckin,
}: {
  latestCheckin: Checkin | null;
}) {
  const cutoff = daysAgoMs(14);
  const stale = !latestCheckin || latestCheckin.checkedAt < cutoff;
  const daysSince = latestCheckin
    ? Math.floor((Date.now() - latestCheckin.checkedAt) / (24 * 60 * 60 * 1000))
    : null;

  const trajectory = latestCheckin?.trajectory ?? null;
  const note = latestCheckin?.note?.trim() || null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Status & blockers
      </p>

      <div className="mt-4 flex items-center gap-3">
        <TrajectoryBadge trajectory={trajectory} />
        {latestCheckin ? (
          <span className="text-sm text-muted-foreground">
            Check-in {formatDate(latestCheckin.checkedAt)}
            {daysSince != null && daysSince > 0 && ` · ${daysSince}d ago`}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">No check-ins yet</span>
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
            {trajectory === "down" ? "Blocker" : "Latest note"}
          </p>
          <p className="mt-1.5">{note}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {trajectory === "down"
            ? "Trajectory is down but no note was captured — add one in your next check-in."
            : "No notes from the last check-in."}
        </p>
      )}

      {stale && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {latestCheckin
              ? `Check-in is ${daysSince} days old — run a weekly check-in to stay current.`
              : "Run a weekly check-in from the portfolio home to set trajectory and note blockers."}
          </span>
        </div>
      )}

      <p className="mt-auto pt-4 text-xs text-muted-foreground">
        <ClipboardCheck className="mr-1 inline size-3.5" />
        Full history in the Check-ins tab below.
      </p>
    </div>
  );
}

function TrajectoryBadge({ trajectory }: { trajectory: Checkin["trajectory"] | null }) {
  if (!trajectory) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const config = {
    up: { icon: TrendingUp, label: "Up", className: "status-up" },
    flat: { icon: Minus, label: "Flat", className: "status-flat" },
    down: { icon: TrendingDown, label: "Down", className: "status-down" },
  }[trajectory];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium capitalize",
        config.className
      )}
    >
      <Icon className="size-4" />
      {config.label}
    </span>
  );
}
