"use client";

import { Button } from "@/components/ui/button";
import { openWeeklyCheckin } from "@/components/AppShell";
import { ClipboardCheck } from "lucide-react";

export function PortfolioActions() {
  return (
    <Button type="button" variant="secondary" className="gap-2" onClick={() => openWeeklyCheckin()}>
      <ClipboardCheck className="size-4" />
      Weekly check-in
    </Button>
  );
}
