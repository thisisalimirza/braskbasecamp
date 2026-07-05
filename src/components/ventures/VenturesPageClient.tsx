"use client";

import { useState } from "react";
import Link from "next/link";
import { NewVentureWizard } from "@/components/wizards/NewVentureWizard";
import { VentureEditDialog } from "@/components/ventures/VentureEditDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ventures</h1>
          <p className="text-sm text-muted-foreground">Manage product lines and status</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>New venture</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Net (month)</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventures.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <Link href={`/ventures/${v.slug}`} className="font-medium hover:underline">
                  {v.name}
                </Link>
                {v.oneLiner && (
                  <p className="text-xs text-muted-foreground">{v.oneLiner}</p>
                )}
              </TableCell>
              <TableCell className="capitalize">{v.ventureType}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 capitalize",
                    v.status === "active" && "status-up",
                    v.status === "paused" && "status-flat",
                    v.status === "closed" && "status-flat opacity-60"
                  )}
                >
                  {v.status}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  (netsByVentureId[v.id] ?? 0) > 0 && "text-emerald-700 dark:text-emerald-400",
                  (netsByVentureId[v.id] ?? 0) < 0 && "text-red-700 dark:text-red-400"
                )}
              >
                {formatCents(netsByVentureId[v.id] ?? 0)}
              </TableCell>
              <TableCell>
                <VentureEditDialog venture={v} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <NewVentureWizard open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
