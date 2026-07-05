"use client";

import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWeeklyCheckinForVentures } from "@/components/AppShell";
import { pulseBannerCopy, type PortfolioRitualStatus } from "@/lib/ritual-copy";
import { cn } from "@/lib/utils";

export function PortfolioPulseBanner({ ritual }: { ritual: PortfolioRitualStatus }) {
  const copy = pulseBannerCopy(ritual);
  if (!copy) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 shrink-0 text-primary" />
          <p className="font-medium text-foreground">{copy.title}</p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.hint}</p>
      </div>
      <Button
        type="button"
        variant="default"
        className={cn("shrink-0 gap-2", copy.prominent && "shadow-sm")}
        onClick={() => openWeeklyCheckinForVentures(copy.ventureIds)}
      >
        <ClipboardList className="size-4" />
        {copy.buttonLabel}
      </Button>
    </div>
  );
}
