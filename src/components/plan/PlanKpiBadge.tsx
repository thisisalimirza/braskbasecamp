import { BarChart3, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlanKpiBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-sky-900 dark:text-sky-200",
        className
      )}
      title={`Moves ${name}`}
    >
      <BarChart3 className="size-3 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function PlanTaskLinks({
  blockerBody,
  kpiName,
  className,
}: {
  blockerBody?: string | null;
  kpiName?: string | null;
  className?: string;
}) {
  if (!blockerBody && !kpiName) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {kpiName && <PlanKpiBadge name={kpiName} />}
      {blockerBody && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-red-950/70 dark:text-red-200/70">
          <Link2 className="mt-0.5 size-3 shrink-0 opacity-70" />
          <span className="line-clamp-2">Unblocks: {blockerBody}</span>
        </p>
      )}
    </div>
  );
}

export const NO_KPI_VALUE = "none";
