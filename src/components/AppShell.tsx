"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Tent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordMoneyWizard } from "@/components/wizards/RecordMoneyWizard";
import { WeeklyCheckinWizard } from "@/components/wizards/WeeklyCheckinWizard";
import type { VentureCheckinDraft } from "@/components/wizards/weekly-checkin-types";
import { logout } from "@/app/actions";
import type { Venture } from "@/lib/ventures";
import type { Category } from "@/lib/categories";
import type { Client } from "@/lib/clients";
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
}: {
  children: React.ReactNode;
  ventures: Venture[];
  revenueCategories: Category[];
  costCategories: Category[];
  clients: Client[];
  lastVentureId?: string;
  checkinDrafts: VentureCheckinDraft[];
}) {
  const pathname = usePathname();
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordPrefill, setRecordPrefill] = useState<RecordPrefill>();
  const [checkinOpen, setCheckinOpen] = useState(false);

  const openRecordMoney = (prefill?: RecordPrefill) => {
    setRecordPrefill(prefill);
    setRecordOpen(true);
  };

  useEffect(() => {
    const w = window as Window & {
      __openCheckin?: () => void;
      __openRecordMoney?: (p?: RecordPrefill) => void;
    };
    w.__openCheckin = () => setCheckinOpen(true);
    w.__openRecordMoney = openRecordMoney;
    return () => {
      delete w.__openCheckin;
      delete w.__openRecordMoney;
    };
  }, []);

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
          className="pointer-events-auto h-12 gap-2 rounded-full px-6 shadow-lg"
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

      <WeeklyCheckinWizard open={checkinOpen} onOpenChange={setCheckinOpen} initial={checkinDrafts} />
    </div>
  );
}

export function openWeeklyCheckin() {
  (window as Window & { __openCheckin?: () => void }).__openCheckin?.();
}

export function openRecordMoneyPrefilled(prefill: RecordPrefill) {
  (window as Window & { __openRecordMoney?: (p?: RecordPrefill) => void }).__openRecordMoney?.(prefill);
}
