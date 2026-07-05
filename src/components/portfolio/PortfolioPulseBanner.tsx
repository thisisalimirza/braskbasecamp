"use client";

import { CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWeeklyCheckin } from "@/components/AppShell";
import { ritualButtonCopy, type PortfolioRitualStatus } from "@/lib/ritual-copy";
import { cn } from "@/lib/utils";

export function PortfolioPulseBanner({ ritual }: { ritual: PortfolioRitualStatus }) {
  const copy = ritualButtonCopy(ritual);
  const caughtUp = ritual.status === "current";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        caughtUp
          ? "border-border/80 bg-card shadow-sm"
          : "border-primary/20 bg-primary/[0.04] shadow-sm"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {caughtUp ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <ClipboardList className="size-4 shrink-0 text-primary" />
          )}
          <p className="font-medium text-foreground">
            {caughtUp ? "Portfolio pulse" : copy.label}
          </p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.hint}</p>
      </div>
      <Button
        type="button"
        variant={caughtUp ? "outline" : copy.variant}
        className={cn("shrink-0 gap-2", !caughtUp && copy.prominent && "shadow-sm")}
        onClick={() => openWeeklyCheckin()}
      >
        <ClipboardList className="size-4" />
        {caughtUp ? "Run full pulse" : copy.label}
      </Button>
    </div>
  );
}
