"use client";

import { DollarSign, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openRecordMoneyPrefilled, openWeeklyCheckinForVenture } from "@/components/AppShell";

export function VenturePageActions({ ventureId }: { ventureId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        className="gap-1.5"
        onClick={() => openRecordMoneyPrefilled({ ventureId })}
      >
        <DollarSign className="size-3.5" />
        Log money
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => openWeeklyCheckinForVenture(ventureId)}
      >
        <ClipboardList className="size-3.5" />
        Update pulse
      </Button>
    </div>
  );
}
