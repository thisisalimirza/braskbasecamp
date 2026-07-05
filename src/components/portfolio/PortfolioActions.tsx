"use client";

import { CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWeeklyCheckin } from "@/components/AppShell";
import { ritualButtonCopy, type PortfolioRitualStatus } from "@/lib/ritual-copy";
import { cn } from "@/lib/utils";

export function PortfolioActions({ ritual }: { ritual: PortfolioRitualStatus }) {
  const copy = ritualButtonCopy(ritual);
  const caughtUp = ritual.status === "current";

  if (caughtUp) {
    return (
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {copy.hint}
        </span>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openWeeklyCheckin()}>
          <ClipboardList className="size-4" />
          {copy.label}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={copy.variant}
        className={cn("gap-2", copy.prominent && "shadow-sm")}
        onClick={() => openWeeklyCheckin()}
      >
        <ClipboardList className="size-4" />
        {copy.label}
      </Button>
      <p className="max-w-xs text-right text-xs text-muted-foreground">{copy.hint}</p>
    </div>
  );
}
