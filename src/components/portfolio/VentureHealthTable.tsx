import Link from "next/link";
import { TrendingDown, TrendingUp, Minus, AlertCircle } from "lucide-react";
import { formatCents, formatDate, daysAgoMs } from "@/lib/format";
import type { VentureHealth } from "@/lib/venture-health";
import { cn } from "@/lib/utils";

function TrajectoryIcon({ trajectory }: { trajectory: VentureHealth["trajectory"] }) {
  if (trajectory === "up") return <TrendingUp className="size-4 text-emerald-600" />;
  if (trajectory === "down") return <TrendingDown className="size-4 text-red-600" />;
  if (trajectory === "flat") return <Minus className="size-4 text-stone-500" />;
  return <span className="text-xs text-muted-foreground">—</span>;
}

function relativeDays(ms: number | null): string {
  if (!ms) return "Never";
  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function VentureHealthTable({ summaries }: { summaries: VentureHealth[] }) {
  const cutoff = daysAgoMs(14);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Venture</th>
            <th className="pb-3 pr-4 font-medium">Net (month)</th>
            <th className="pb-3 pr-4 font-medium">Trajectory</th>
            <th className="pb-3 pr-4 font-medium">Last check-in</th>
            <th className="pb-3 pr-4 font-medium">Last $ entry</th>
            <th className="pb-3 font-medium">Next step</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {summaries.map((row) => {
            const needsAttention = row.reasons.length > 0;
            return (
              <tr key={row.venture.id} className={cn(needsAttention && "bg-amber-50/50 dark:bg-amber-950/10")}>
                <td className="py-3.5 pr-4">
                  <Link href={`/ventures/${row.venture.slug}`} className="font-medium hover:text-primary hover:underline">
                    {row.venture.name}
                  </Link>
                  {row.lastCheckinNote && row.trajectory === "down" && (
                    <p className="mt-1 line-clamp-1 text-xs text-red-700 dark:text-red-400">
                      Blocker: {row.lastCheckinNote}
                    </p>
                  )}
                </td>
                <td className={cn("py-3.5 pr-4 tabular-nums font-medium", row.netCents < 0 && "text-red-700 dark:text-red-400", row.netCents > 0 && "text-emerald-700 dark:text-emerald-400")}>
                  {formatCents(row.netCents)}
                </td>
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-1.5 capitalize">
                    <TrajectoryIcon trajectory={row.trajectory} />
                    <span className="text-muted-foreground">{row.trajectory ?? "none"}</span>
                  </div>
                </td>
                <td className={cn("py-3.5 pr-4 text-muted-foreground", (!row.lastCheckinAt || row.lastCheckinAt < cutoff) && "text-amber-700 dark:text-amber-400")}>
                  {relativeDays(row.lastCheckinAt)}
                </td>
                <td className={cn("py-3.5 pr-4 text-muted-foreground", (!row.lastPnlAt || row.lastPnlAt < cutoff) && "text-amber-700 dark:text-amber-400")}>
                  {relativeDays(row.lastPnlAt)}
                </td>
                <td className="py-3.5">
                  {needsAttention ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {row.primaryAction}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">On track</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
