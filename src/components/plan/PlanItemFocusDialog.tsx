"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pause, Play, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlanTaskLinks } from "@/components/plan/PlanKpiBadge";
import { movePlanItemAction } from "@/app/actions";
import { planStatusLabel } from "@/lib/next-actions";
import type { PlanItem } from "@/lib/plan-types";
import { stepAgingLabel } from "@/lib/plan-wip";
import { useFocusTimer } from "@/hooks/use-focus-timer";
import { cn } from "@/lib/utils";

const TIMER_PRESETS = [15, 25, 45] as const;

export function PlanItemFocusDialog({
  open,
  onOpenChange,
  item,
  ventureName,
  ventureSlug,
  blockerBody,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanItem | null;
  ventureName: string;
  ventureSlug: string;
  blockerBody?: string | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const timer = useFocusTimer(25);

  useEffect(() => {
    if (!open) {
      timer.reset();
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (timer.finished) {
      toast.success("Focus block complete — mark done if you shipped it.");
    }
  }, [timer.finished]);

  if (!item || !open) return null;

  const aging = stepAgingLabel(item);

  const handleDone = async () => {
    const res = await movePlanItemAction(item.id, "done", 0, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Marked done");
      onOpenChange(false);
      onDone?.();
      router.refresh();
    }
  };

  const handleStart = async () => {
    if (item.status === "doing") return;
    const res = await movePlanItemAction(item.id, "doing", 0, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("In progress");
      router.refresh();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-mode-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{ventureName}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {planStatusLabel(item.status)}
            {aging ? ` · ${aging}` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close focus mode"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-5" />
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
        <div className="relative mb-8 flex size-40 items-center justify-center sm:size-48">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - timer.progress)}
              className="text-primary transition-[stroke-dashoffset] duration-1000"
            />
          </svg>
          <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
            {timer.label}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {TIMER_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => timer.setMinutes(m)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                "border-border/80 hover:border-primary/40 hover:bg-primary/[0.04]"
              )}
            >
              {m}m
            </button>
          ))}
        </div>

        <div className="mb-6 flex gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={timer.toggle}>
            {timer.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {timer.running ? "Pause" : "Start timer"}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={timer.reset}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>

        <h1
          id="focus-mode-title"
          className="font-heading max-w-lg text-2xl font-semibold leading-snug sm:text-3xl"
        >
          {item.title}
        </h1>
        {item.notes && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{item.notes}</p>
        )}
        <PlanTaskLinks className="mt-4 justify-center" kpiName={item.kpiName} blockerBody={blockerBody ?? null} />
        <p className="mt-6 max-w-sm text-xs text-muted-foreground">
          One step. No distractions. Use the timer if it helps — mark done when it ships.
        </p>
      </main>

      <footer className="shrink-0 border-t border-border/80 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:justify-between">
          <Link
            href={`/ventures/${ventureSlug}?tab=plan`}
            className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-primary hover:underline"
          >
            Open full plan
          </Link>
          <div className="flex gap-2">
            {item.status !== "doing" && item.status !== "done" && (
              <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none" onClick={handleStart}>
                Start step
              </Button>
            )}
            <Button type="button" className="h-11 flex-1 gap-1.5 sm:flex-none" onClick={handleDone}>
              <Check className="size-4" />
              Mark done
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
