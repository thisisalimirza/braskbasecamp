"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const validTabs = ["plan", "ledger", "ritual", ...(isStudio ? ["pipeline"] : []), "reference"];
  const activeTab = validTabs.includes(defaultTab) ? defaultTab : "plan";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(tab) => router.push(`/ventures/${ventureSlug}?tab=${tab}`)}
      className="space-y-5"
    >
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

      <TabsContent value="plan">
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

      <TabsContent value="ledger">
        <SectionCard title="Money history" description="Everything you've logged for this venture">
          <PnlEntriesTable
            entries={entries}
            ventureSlug={ventureSlug}
            ventureId={ventureId}
            ventureName={ventureName}
            categories={categories}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="ritual">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold">Past pulses</h2>
          <p className="mt-1 text-sm text-muted-foreground">How this venture has been doing over time.</p>
          {checkins.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Nothing here yet. Run a pulse from the portfolio home when you&apos;re ready.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
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
        </div>
      </TabsContent>

      {isStudio && (
        <TabsContent value="pipeline" className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold">Pipeline</h2>
            <div className="mt-4">
              <PipelineBoard clients={clients} studioVentureId={ventureId} />
            </div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold">Clients & revenue</h2>
            <div className="mt-4">
              <ClientList clients={clients} />
            </div>
          </div>
        </TabsContent>
      )}

      <TabsContent value="reference">
        <ReferencePanel facts={facts} links={links} scope={ventureId} ventureSlug={ventureSlug} title="Reference" />
      </TabsContent>
    </Tabs>
  );
}
