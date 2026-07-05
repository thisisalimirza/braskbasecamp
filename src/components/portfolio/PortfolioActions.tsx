"use client";

import { Button } from "@/components/ui/button";
import { openWeeklyCheckin } from "@/components/AppShell";

export function PortfolioActions() {
  return (
    <Button type="button" variant="secondary" onClick={() => openWeeklyCheckin()}>
      Weekly check-in
    </Button>
  );
}
