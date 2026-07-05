"use client";

import { ArrowDownCircle, ArrowUpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openRecordMoneyPrefilled } from "@/components/AppShell";

export function RecordMoneyButton({
  ventureId,
  kind,
  label,
  variant = "default",
  size = "default",
  className,
}: {
  ventureId?: string;
  kind?: "revenue" | "cost" | "owner";
  label: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => openRecordMoneyPrefilled({ ventureId, kind })}
    >
      {label}
    </Button>
  );
}

/** Prominent revenue/cost actions for a venture page or empty ledger */
export function VentureMoneyActions({
  ventureId,
  ventureName,
  compact,
}: {
  ventureId: string;
  ventureName: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <RecordMoneyButton
          ventureId={ventureId}
          kind="revenue"
          label="Record revenue"
          size="sm"
          variant="default"
        />
        <RecordMoneyButton
          ventureId={ventureId}
          kind="cost"
          label="Record cost"
          size="sm"
          variant="outline"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
      <p className="font-heading text-base font-semibold">Add money for {ventureName}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Revenue and costs you log here feed this venture&apos;s P&amp;L and the portfolio total.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          className="gap-2"
          onClick={() => openRecordMoneyPrefilled({ ventureId, kind: "revenue" })}
        >
          <ArrowUpCircle className="size-4" />
          Record revenue
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => openRecordMoneyPrefilled({ ventureId, kind: "cost" })}
        >
          <ArrowDownCircle className="size-4" />
          Record cost
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Or use the <strong>Record money</strong> button at the bottom of any page.
      </p>
    </div>
  );
}

export function LedgerEmptyState({
  ventureId,
  ventureName,
}: {
  ventureId: string;
  ventureName: string;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Plus className="size-5 text-muted-foreground" />
      </span>
      <p className="mt-4 font-medium">No money logged yet</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Record revenue when {ventureName} earns — subscriptions, client payments, product sales, etc.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <RecordMoneyButton ventureId={ventureId} kind="revenue" label="Record revenue" />
        <RecordMoneyButton ventureId={ventureId} kind="cost" label="Record cost" variant="outline" />
      </div>
    </div>
  );
}
