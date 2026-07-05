"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Focus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/page-header";
import { PlanTaskLinks } from "@/components/plan/PlanKpiBadge";
import { movePlanItemAction } from "@/app/actions";
import { planStatusLabel } from "@/lib/next-actions";
import type { VentureHealth } from "@/lib/venture-health";
import { stepAgingLabel, evaluateWipLimits } from "@/lib/plan-wip";
import { useAppSettings } from "@/components/AppSettingsProvider";
import { cn } from "@/lib/utils";

export function ThisWeekWork({
  summaries,
  portfolioDoingCount,
}: {
  summaries: VentureHealth[];
  portfolioDoingCount: number;
}) {
  const router = useRouter();
  const { hardWipLimits } = useAppSettings();
  const focusRows = summaries
    .filter((s) => s.focusPlanItem && s.focusPlanItem.status !== "done")
    .slice(0, 6);

  const handleDone = async (row: VentureHealth) => {
    const item = row.focusPlanItem;
    if (!item) return;
    const res = await movePlanItemAction(item.id, "done", 0, row.venture.slug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Marked done");
      router.refresh();
    }
  };

  const handleStart = async (row: VentureHealth) => {
    const item = row.focusPlanItem;
    if (!item || item.status === "doing") return;
    const { allowed, message } = evaluateWipLimits({
      hard: hardWipLimits,
      ventureItems: [
        {
          id: item.id,
          ventureId: row.venture.id,
          title: item.title,
          notes: null,
          status: item.status,
          blockerId: null,
          kpiDefinitionId: null,
          kpiName: item.kpiName,
          sortOrder: 0,
          createdAt: item.createdAt,
          statusChangedAt: item.statusChangedAt,
          completedAt: null,
        },
      ],
      portfolioDoing: portfolioDoingCount,
      movingItemId: item.id,
      currentStatus: item.status,
      targetStatus: "doing",
    });
    if (!allowed) {
      toast.error(message ?? "WIP limit reached");
      return;
    }
    if (message) toast.message("Heads up", { description: message });
    const res = await movePlanItemAction(item.id, "doing", 0, row.venture.slug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Started");
      router.refresh();
    }
  };

  if (focusRows.length === 0) {
    return (
      <SectionCard
        title="This week's work"
        description="Your minimum next steps — one small move per venture."
      >
        <p className="text-sm text-muted-foreground">
          No next steps queued yet. Run a pulse or open a venture plan to name the smallest thing that
          moves each venture forward.
        </p>
        <Link
          href="/tasks"
          className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Open tasks board
        </Link>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="This week's work"
      description={
        portfolioDoingCount > 0
          ? `${portfolioDoingCount} in progress portfolio-wide — finish before starting more.`
          : "Your minimum next steps across ventures."
      }
    >
      <ul className="space-y-2">
        {focusRows.map((row) => {
          const item = row.focusPlanItem!;
          const aging = stepAgingLabel({
            id: item.id,
            ventureId: row.venture.id,
            title: item.title,
            notes: null,
            status: item.status,
            blockerId: null,
            kpiDefinitionId: null,
            kpiName: item.kpiName,
            sortOrder: 0,
            createdAt: item.createdAt,
            statusChangedAt: item.statusChangedAt,
            completedAt: null,
          });
          return (
            <li
              key={row.venture.id}
              className="flex flex-col gap-3 rounded-xl border border-border/80 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/ventures/${row.venture.slug}?tab=plan`}
                    className="font-heading text-sm font-semibold hover:text-primary"
                  >
                    {row.venture.name}
                  </Link>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {planStatusLabel(item.status)}
                  </span>
                  {aging && (
                    <span className="text-[10px] text-amber-800 dark:text-amber-300">{aging}</span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium leading-snug">{item.title}</p>
                <PlanTaskLinks
                  className="mt-1.5"
                  kpiName={item.kpiName}
                  blockerBody={row.primaryBlocker?.body ?? null}
                />
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => router.push(`/ventures/${row.venture.slug}?tab=plan&focus=${item.id}`)}
                >
                  <Focus className="size-3" />
                  Focus
                </Button>
                {item.status !== "doing" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleStart(row)}
                  >
                    Start
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => handleDone(row)}
                >
                  <Check className="size-3.5" />
                  Done
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {focusRows.length < summaries.filter((s) => s.nextPlanStep).length && (
        <p className="mt-3 text-xs text-muted-foreground">
          <Link href="/tasks" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            See all tasks
            <ArrowRight className="size-3" />
          </Link>
        </p>
      )}
    </SectionCard>
  );
}
