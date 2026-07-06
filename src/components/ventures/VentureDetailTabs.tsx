"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionCard } from "@/components/ui/page-header";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PnlEntriesTable } from "@/components/ventures/PnlEntriesTable";
import { PipelineBoard } from "@/components/studio/PipelineBoard";
import { ClientList } from "@/components/studio/ClientList";
import { VenturePlanPanel } from "@/components/ventures/VenturePlanPanel";
import { formatDate } from "@/lib/format";
import { TRAJECTORY_LABELS } from "@/lib/next-actions";
import type { Checkin } from "@/lib/checkins";
import type { VentureBlocker } from "@/lib/blocker-types";
import type { KpiDefinition } from "@/lib/kpis";
import type { PlanItem } from "@/lib/plan-types";
import type { PnlEntry } from "@/lib/pnl";
import type { Category } from "@/lib/categories";
import type { Client } from "@/lib/clients";
import type { ReferenceFact, ReferenceLink } from "@/lib/reference";
import { cn } from "@/lib/utils";

type Props = {
  defaultTab: string;
  ventureId: string;
  ventureSlug: string;
  ventureName: string;
  isStudio: boolean;
  checkins: Checkin[];
  entries: PnlEntry[];
  categories: Category[];
  clients: Client[];
  facts: ReferenceFact[];
  links: ReferenceLink[];
  blockers: VentureBlocker[];
  planItems: PlanItem[];
  kpis: KpiDefinition[];
  planCount: number;
  openBlockerCount: number;
  portfolioDoingCount?: number;
};

export function VentureDetailTabs({
  defaultTab,
  ventureId,
  ventureSlug,
  ventureName,
  isStudio,
  checkins,
  entries,
  categories,
  clients,
  facts,
  links,
  blockers,
  planItems,
  kpis,
  planCount,
  openBlockerCount,
  portfolioDoingCount = 0,
}: Props) {
  const validTabs = ["plan", "ledger", "ritual", ...(isStudio ? ["pipeline"] : []), "reference"];
  const [activeTab, setActiveTab] = useState(validTabs.includes(defaultTab) ? defaultTab : "plan");

  // All tab data arrives as props, so switching is pure client state. Only the
  // URL is synced (silently, no navigation) so the tab survives reload/share.
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/ventures/${ventureSlug}?tab=${tab}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
      <TabsList className="h-auto w-full justify-start gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
        <TabsTrigger value="plan" className="rounded-lg px-4 py-2 data-active:bg-background data-active:shadow-sm">
          Plan
          {(planCount > 0 || openBlockerCount > 0) && (
            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {openBlockerCount > 0 ? openBlockerCount : planCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ledger" className="rounded-lg px-4 py-2 data-active:bg-background data-active:shadow-sm">
          Money history
        </TabsTrigger>
        <TabsTrigger value="ritual" className="rounded-lg px-4 py-2 data-active:bg-background data-active:shadow-sm">
          Past pulses
        </TabsTrigger>
        {isStudio && (
          <TabsTrigger value="pipeline" className="rounded-lg px-4 py-2 data-active:bg-background data-active:shadow-sm">
            Pipeline
          </TabsTrigger>
        )}
        <TabsTrigger value="reference" className="rounded-lg px-4 py-2 data-active:bg-background data-active:shadow-sm">
          Reference
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plan" className="min-h-[420px]">
        <VenturePlanPanel
          ventureId={ventureId}
          ventureSlug={ventureSlug}
          ventureName={ventureName}
          blockers={blockers}
          planItems={planItems}
          kpis={kpis}
          portfolioDoingCount={portfolioDoingCount}
        />
      </TabsContent>

      <TabsContent value="ledger" className="min-h-[420px]">
        <SectionCard
          title="Money history"
          description="Everything you've logged for this venture"
          tone="quiet"
        >
          <PnlEntriesTable
            entries={entries}
            ventureSlug={ventureSlug}
            ventureId={ventureId}
            ventureName={ventureName}
            categories={categories}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="ritual" className="min-h-[420px]">
        <SectionCard
          title="Past pulses"
          description="How this venture has been doing over time."
          tone="quiet"
        >
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Run a pulse from the portfolio home when you&apos;re ready.
            </p>
          ) : (
            <ul className="space-y-3">
              {checkins.map((c) => (
                <li key={c.id} className="rounded-xl bg-muted/35 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        c.trajectory === "up" && "status-up",
                        c.trajectory === "flat" && "status-flat",
                        c.trajectory === "down" && "status-down"
                      )}
                    >
                      {TRAJECTORY_LABELS[c.trajectory]}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatDate(c.checkedAt)}</span>
                  </div>
                  {c.note ? (
                    <p className="mt-2 text-sm leading-relaxed">{c.note}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted-foreground">No note</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </TabsContent>

      {isStudio && (
        <TabsContent value="pipeline" className="min-h-[420px] space-y-6">
          <SectionCard title="Pipeline" description="Move clients from lead to closed.">
            <PipelineBoard clients={clients} studioVentureId={ventureId} />
          </SectionCard>
          <SectionCard title="Clients & revenue" tone="quiet">
            <ClientList clients={clients} />
          </SectionCard>
        </TabsContent>
      )}

      <TabsContent value="reference" className="min-h-[420px]">
        <ReferencePanel facts={facts} links={links} scope={ventureId} ventureSlug={ventureSlug} title="Reference" />
      </TabsContent>
    </Tabs>
  );
}
