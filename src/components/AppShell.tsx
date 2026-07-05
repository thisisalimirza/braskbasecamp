"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, DollarSign, Plus, Tent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecordMoneyWizard } from "@/components/wizards/RecordMoneyWizard";
import { WeeklyCheckinWizard } from "@/components/wizards/WeeklyCheckinWizard";
import type { VentureCheckinDraft, PulseReviewContext } from "@/components/wizards/weekly-checkin-types";
import type { GlobalPlanItem } from "@/lib/plan-types";
import { logout } from "@/app/actions";
import type { Venture } from "@/lib/ventures";
import type { Category } from "@/lib/categories";
import type { Client } from "@/lib/clients";
import type { PortfolioRitualStatus } from "@/lib/ritual-copy";
import { ritualWizardTitle, venturePulseWizardTitle, remainingPulseWizardTitle } from "@/lib/ritual-copy";
import { cn } from "@/lib/utils";

type RecordPrefill = { ventureId?: string; clientId?: string; kind?: "revenue" | "cost" | "owner" };

const NAV = [
  { href: "/", label: "Portfolio", hint: "Pulse & priorities" },
  { href: "/tasks", label: "Tasks", hint: "Do the work" },
  { href: "/ventures", label: "Ventures", hint: "Setup & history" },
  { href: "/settings", label: "Settings", hint: "WIP & preferences" },
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
  recentlyDone,
  portfolioDoingCount,
}: {
  children: React.ReactNode;
  ventures: Venture[];
  revenueCategories: Category[];
  costCategories: Category[];
  clients: Client[];
  lastVentureId?: string;
  checkinDrafts: VentureCheckinDraft[];
  ritual: PortfolioRitualStatus;
  recentlyDone: GlobalPlanItem[];
  portfolioDoingCount: number;
}) {
  const pathname = usePathname();
  const wideLayout = pathname.startsWith("/tasks");
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordPrefill, setRecordPrefill] = useState<RecordPrefill>();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinFilter, setCheckinFilter] = useState<string[] | "all">("all");

  const openRecordMoney = useCallback((prefill?: RecordPrefill) => {
    setRecordPrefill(prefill);
    setRecordOpen(true);
  }, []);

  const openCheckin = useCallback(
    (ventureIds?: string | string[]) => {
      if (!ventureIds) {
        setCheckinFilter("all");
      } else if (typeof ventureIds === "string") {
        if (!checkinDrafts.some((d) => d.venture.id === ventureIds)) {
          toast.error("This venture isn't active — pulse it from the portfolio when ready.");
          return;
        }
        setCheckinFilter([ventureIds]);
      } else {
        const ids = ventureIds.filter((id) => checkinDrafts.some((d) => d.venture.id === id));
        if (ids.length === 0) {
          toast.error("No active ventures to pulse.");
          return;
        }
        setCheckinFilter(ids);
      }
      setCheckinOpen(true);
    },
    [checkinDrafts]
  );

  const handleCheckinOpenChange = (open: boolean) => {
    setCheckinOpen(open);
    if (!open) setCheckinFilter("all");
  };

  const activeCheckinDrafts =
    checkinFilter === "all"
      ? checkinDrafts
      : checkinDrafts.filter((d) => checkinFilter.includes(d.venture.id));

  const pulseDue = ritual.venturesNeedingPulse.length > 0;

  const reviewContext: PulseReviewContext = {
    recentlyDone,
    pulseStreakWeeks: ritual.consecutiveFullPulseWeeks,
  };

  const checkinTitle =
    checkinFilter !== "all" && activeCheckinDrafts.length === 1
      ? venturePulseWizardTitle(activeCheckinDrafts[0].venture.name)
      : checkinFilter !== "all" && activeCheckinDrafts.length > 1
        ? remainingPulseWizardTitle(activeCheckinDrafts.length)
        : ritualWizardTitle(ritual.status);

  const openPulseFromFab = () => {
    if (pulseDue) {
      openCheckin(ritual.venturesNeedingPulse.map((v) => v.id));
    } else {
      openCheckin();
    }
  };

  useEffect(() => {
    const w = window as Window & {
      __openCheckin?: () => void;
      __openCheckinVenture?: (ventureId: string) => void;
      __openCheckinVentures?: (ventureIds: string[]) => void;
      __openRecordMoney?: (p?: RecordPrefill) => void;
    };
    w.__openCheckin = () => openCheckin();
    w.__openCheckinVenture = (ventureId: string) => openCheckin(ventureId);
    w.__openCheckinVentures = (ventureIds: string[]) => openCheckin(ventureIds);
    w.__openRecordMoney = openRecordMoney;
    return () => {
      delete w.__openCheckin;
      delete w.__openCheckinVenture;
      delete w.__openCheckinVentures;
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
          <nav className="-mx-1 flex flex-1 gap-0.5 overflow-x-auto px-1 scrollbar-none">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.hint}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {pulseDue && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="hidden gap-1.5 border-primary/30 text-primary sm:inline-flex"
              onClick={() => openCheckin(ritual.venturesNeedingPulse.map((v) => v.id))}
            >
              <ClipboardList className="size-3.5" />
              {ritual.venturesNeedingPulse.length === 1
                ? "Pulse due"
                : `${ritual.venturesNeedingPulse.length} pulses due`}
            </Button>
          )}
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 py-8 sm:px-6",
          wideLayout ? "max-w-[min(1600px,100%)]" : "max-w-4xl"
        )}
      >
        {children}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center gap-2 pb-6">
        {pulseDue ? (
          <>
            <Button
              type="button"
              size="lg"
              className="pointer-events-auto h-12 gap-2 rounded-full px-6 shadow-lg transition-shadow hover:shadow-xl"
              onClick={openPulseFromFab}
            >
              <ClipboardList className="size-5" />
              Run pulse
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="pointer-events-auto h-12 gap-2 rounded-full border-border/80 bg-background/95 px-5 shadow-md backdrop-blur-sm"
              onClick={() => openRecordMoney()}
            >
              <DollarSign className="size-4" />
              <span className="hidden sm:inline">Money</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="pointer-events-auto h-12 gap-2 rounded-full border-border/80 bg-background/95 px-5 shadow-md backdrop-blur-sm"
              onClick={() => openCheckin()}
            >
              <ClipboardList className="size-4" />
              <span className="hidden sm:inline">Pulse</span>
            </Button>
            <Button
              type="button"
              size="lg"
              className="pointer-events-auto h-12 gap-2 rounded-full px-6 shadow-lg transition-shadow hover:shadow-xl"
              onClick={() => openRecordMoney()}
            >
              <Plus className="size-5" />
              Record money
            </Button>
          </>
        )}
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
          key={`${checkinOpen}-${checkinFilter === "all" ? "portfolio" : checkinFilter.join(",")}`}
          open={checkinOpen}
          onOpenChange={handleCheckinOpenChange}
          initial={activeCheckinDrafts}
          reviewContext={reviewContext}
          title={checkinTitle}
          singleVenture={checkinFilter !== "all" && activeCheckinDrafts.length === 1}
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

/** Pulse only the ventures that still need a check-in. */
export function openWeeklyCheckinForVentures(ventureIds: string[]) {
  (window as Window & { __openCheckinVentures?: (ventureIds: string[]) => void }).__openCheckinVentures?.(
    ventureIds
  );
}

export function openRecordMoneyPrefilled(prefill: RecordPrefill) {
  (window as Window & { __openRecordMoney?: (p?: RecordPrefill) => void }).__openRecordMoney?.(prefill);
}
