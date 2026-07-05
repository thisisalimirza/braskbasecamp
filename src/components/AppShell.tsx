"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Tent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecordMoneyWizard } from "@/components/wizards/RecordMoneyWizard";
import { WeeklyCheckinWizard } from "@/components/wizards/WeeklyCheckinWizard";
import type { VentureCheckinDraft } from "@/components/wizards/weekly-checkin-types";
import { logout } from "@/app/actions";
import type { Venture } from "@/lib/ventures";
import type { Category } from "@/lib/categories";
import type { Client } from "@/lib/clients";
import type { PortfolioRitualStatus } from "@/lib/ritual-copy";
import { ritualWizardTitle, venturePulseWizardTitle } from "@/lib/ritual-copy";
import { cn } from "@/lib/utils";

type RecordPrefill = { ventureId?: string; clientId?: string; kind?: "revenue" | "cost" | "owner" };

const NAV = [
  { href: "/", label: "Portfolio" },
  { href: "/ventures", label: "Ventures" },
];

export function AppShell({
  children,
  ventures,
  revenueCategories,
  costCategories,
  clients,
  lastVentureId,
  checkinDrafts,
  ritual,
}: {
  children: React.ReactNode;
  ventures: Venture[];
  revenueCategories: Category[];
  costCategories: Category[];
  clients: Client[];
  lastVentureId?: string;
  checkinDrafts: VentureCheckinDraft[];
  ritual: PortfolioRitualStatus;
}) {
  const pathname = usePathname();
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordPrefill, setRecordPrefill] = useState<RecordPrefill>();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinVentureId, setCheckinVentureId] = useState<string | null>(null);

  const openRecordMoney = useCallback((prefill?: RecordPrefill) => {
    setRecordPrefill(prefill);
    setRecordOpen(true);
  }, []);

  const openCheckin = useCallback(
    (ventureId?: string) => {
      if (ventureId && !checkinDrafts.some((d) => d.venture.id === ventureId)) {
        toast.error("This venture isn't active — pulse it from the portfolio when ready.");
        return;
      }
      setCheckinVentureId(ventureId ?? null);
      setCheckinOpen(true);
    },
    [checkinDrafts]
  );

  const handleCheckinOpenChange = (open: boolean) => {
    setCheckinOpen(open);
    if (!open) setCheckinVentureId(null);
  };

  const activeCheckinDrafts = checkinVentureId
    ? checkinDrafts.filter((d) => d.venture.id === checkinVentureId)
    : checkinDrafts;

  const checkinTitle =
    checkinVentureId && activeCheckinDrafts[0]
      ? venturePulseWizardTitle(activeCheckinDrafts[0].venture.name)
      : ritualWizardTitle(ritual.status);

  useEffect(() => {
    const w = window as Window & {
      __openCheckin?: () => void;
      __openCheckinVenture?: (ventureId: string) => void;
      __openRecordMoney?: (p?: RecordPrefill) => void;
    };
    w.__openCheckin = () => openCheckin();
    w.__openCheckinVenture = (ventureId: string) => openCheckin(ventureId);
    w.__openRecordMoney = openRecordMoney;
    return () => {
      delete w.__openCheckin;
      delete w.__openCheckinVenture;
      delete w.__openRecordMoney;
    };
  }, [openCheckin, openRecordMoney]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tent className="size-4" />
            </span>
            Base Camp
          </Link>
          <nav className="flex flex-1 gap-1">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6">
        <Button
          type="button"
          size="lg"
          className="pointer-events-auto h-12 gap-2 rounded-full px-6 shadow-lg transition-shadow hover:shadow-xl"
          onClick={() => openRecordMoney()}
        >
          <Plus className="size-5" />
          Record money
        </Button>
      </div>

      <RecordMoneyWizard
        open={recordOpen}
        onOpenChange={setRecordOpen}
        ventures={ventures}
        revenueCategories={revenueCategories}
        costCategories={costCategories}
        clients={clients}
        lastVentureId={lastVentureId}
        prefill={recordPrefill}
      />

      {activeCheckinDrafts.length > 0 && (
        <WeeklyCheckinWizard
          key={`${checkinOpen}-${checkinVentureId ?? "portfolio"}`}
          open={checkinOpen}
          onOpenChange={handleCheckinOpenChange}
          initial={activeCheckinDrafts}
          title={checkinTitle}
          singleVenture={checkinVentureId != null}
        />
      )}
    </div>
  );
}

/** Full portfolio pulse — all ventures in priority order. */
export function openWeeklyCheckin() {
  (window as Window & { __openCheckin?: () => void }).__openCheckin?.();
}

/** Single-venture pulse from a venture page or row action. */
export function openWeeklyCheckinForVenture(ventureId: string) {
  (window as Window & { __openCheckinVenture?: (ventureId: string) => void }).__openCheckinVenture?.(
    ventureId
  );
}

export function openRecordMoneyPrefilled(prefill: RecordPrefill) {
  (window as Window & { __openRecordMoney?: (p?: RecordPrefill) => void }).__openRecordMoney?.(prefill);
}
