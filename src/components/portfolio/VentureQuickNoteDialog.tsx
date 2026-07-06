"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveWeeklyCheckinAction } from "@/app/actions";
import type { Trajectory } from "@/lib/checkins";
import { TRAJECTORY_LABELS } from "@/lib/next-actions";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function VentureQuickNoteDialog({
  open,
  onOpenChange,
  ventureId,
  ventureName,
  defaultTrajectory = "flat",
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  ventureName: string;
  ventureSlug: string;
  defaultTrajectory?: Trajectory;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [trajectory, setTrajectory] = useState<Trajectory>(defaultTrajectory);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error("Add a short note so future-you remembers the plan.");
      return;
    }
    setSaving(true);
    const res = await saveWeeklyCheckinAction([
      {
        ventureId,
        trajectory,
        note: note.trim(),
      },
    ]);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Saved");
      setNote("");
      router.refresh();
      onOpenChange(false);
    }
  };

  const options = [
    { t: "up" as const, icon: TrendingUp, label: TRAJECTORY_LABELS.up },
    { t: "flat" as const, icon: Minus, label: TRAJECTORY_LABELS.flat },
    { t: "down" as const, icon: TrendingDown, label: TRAJECTORY_LABELS.down },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title ?? `Log update · ${ventureName}`}</DialogTitle>
          <DialogDescription>
            {description ??
              "One line on what's happening or what's blocking — shows up on your portfolio and venture page."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">How is it going?</p>
            <div className="grid grid-cols-3 gap-2">
              {options.map(({ t, icon: Icon, label }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrajectory(t)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                    trajectory === t
                      ? "border-primary/40 bg-primary/[0.06] text-foreground"
                      : "border-border/80 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">What&apos;s the situation?</p>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Waiting on client payment, Stripe not connected yet, paused spend until launch…"
            />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
