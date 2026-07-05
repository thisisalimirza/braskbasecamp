"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordMoneyWizard } from "@/components/wizards/RecordMoneyWizard";
import { WeeklyCheckinWizard } from "@/components/wizards/WeeklyCheckinWizard";
import type { VentureCheckinDraft } from "@/components/wizards/weekly-checkin-types";
import { logout } from "@/app/actions";
import type { Venture } from "@/lib/ventures";
import type { Category } from "@/lib/categories";
import type { Client } from "@/lib/clients";

type RecordPrefill = { ventureId?: string; clientId?: string; kind?: "revenue" | "cost" | "owner" };

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
    <div className="flex min-h-screen flex-col pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Mountain className="size-5" />
            Base Camp
          </Link>
          <nav className="flex flex-1 gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Portfolio
            </Link>
            <Link href="/ventures" className="text-muted-foreground hover:text-foreground">
              Ventures
            </Link>
          </nav>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <Button
        type="button"
        size="icon-lg"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg"
        onClick={() => openRecordMoney()}
        aria-label="Record money"
      >
        <Plus className="size-6" />
      </Button>

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
