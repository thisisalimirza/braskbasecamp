"use client";

import { Button } from "@/components/ui/button";
import { openWeeklyCheckinForVentures, openWeeklyCheckin } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export function PortfolioPulseCta({
  label = "Run pulse",
  ventureIds,
  className,
}: {
  label?: string;
  ventureIds?: string[];
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn("gap-1.5", className)}
      onClick={() =>
        ventureIds && ventureIds.length > 0
          ? openWeeklyCheckinForVentures(ventureIds)
          : openWeeklyCheckin()
      }
    >
      {label}
    </Button>
  );
}
