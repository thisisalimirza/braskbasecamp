"use client";

import { useState } from "react";
import Link from "next/link";
import { NewVentureWizard } from "@/components/wizards/NewVentureWizard";
import { VentureEditDialog } from "@/components/ventures/VentureEditDialog";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/format";
import type { Venture } from "@/lib/ventures";
import { cn } from "@/lib/utils";

export function VenturesPageClient({
  ventures,
  netsByVentureId,
}: {
  ventures: Venture[];
  netsByVentureId: Record<string, number>;
}) {
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow="Portfolio"
        title="Ventures"
        description="Setup, money history, and reference — day-to-day work lives on Portfolio and Tasks."
        actions={<Button onClick={() => setNewOpen(true)}>New venture</Button>}
      />

      <div className="divide-y divide-border/70 rounded-2xl border border-border/80 bg-card shadow-sm">
        {ventures.map((v) => {
          const net = netsByVentureId[v.id] ?? 0;
          return (
            <div key={v.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/ventures/${v.slug}`} className="font-heading text-lg font-semibold hover:text-primary">
                  {v.name}
                </Link>
                {v.oneLiner && <p className="mt-0.5 text-sm text-muted-foreground">{v.oneLiner}</p>}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "border-0 capitalize",
                  v.status === "active" && "status-up",
                  v.status === "paused" && "status-flat"
                )}
              >
                {v.status}
              </Badge>
              <span className="w-24 text-right text-sm capitalize text-muted-foreground">{v.ventureType}</span>
              <span
                className={cn(
                  "w-28 text-right tabular-nums font-medium",
                  net > 0 && "text-emerald-700 dark:text-emerald-400",
                  net < 0 && "text-red-700 dark:text-red-400"
                )}
              >
                {formatCents(net)}
              </span>
              <VentureEditDialog venture={v} />
            </div>
          );
        })}
      </div>

      <NewVentureWizard open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
