import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function VentureDashboardCard({
  label,
  children,
  footer,
  className,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: "default" | "positive" | "negative" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md",
        tone === "positive" && "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20",
        tone === "negative" && "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20",
        className
      )}
    >
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
      {footer && (
        <div className="mt-4 border-t border-border/50 pt-4">{footer}</div>
      )}
    </div>
  );
}
