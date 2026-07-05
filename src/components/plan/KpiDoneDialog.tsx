"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createKpiEntryAction } from "@/app/actions";
import { movePlanItemAction } from "@/app/actions";
import { todayInput } from "@/lib/format";

export function KpiDoneDialog({
  open,
  onOpenChange,
  kpiDefinitionId,
  kpiName,
  kpiUnit,
  ventureSlug,
  itemId,
  sortOrder,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiDefinitionId: string;
  kpiName: string;
  kpiUnit: string | null;
  ventureSlug: string;
  itemId: string;
  sortOrder: number;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const finish = async (logKpi: boolean) => {
    setSaving(true);
    if (logKpi && value.trim()) {
      const num = parseFloat(value);
      if (!Number.isFinite(num)) {
        toast.error("Enter a valid number");
        setSaving(false);
        return;
      }
      const resKpi = await createKpiEntryAction(
        kpiDefinitionId,
        num,
        todayInput(),
        ventureSlug
      );
      if (resKpi.error) {
        toast.error(resKpi.error);
        setSaving(false);
        return;
      }
    }
    const res = await movePlanItemAction(itemId, "done", sortOrder, ventureSlug);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Step completed");
      onOpenChange(false);
      onComplete?.();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Did this move {kpiName}?</DialogTitle>
          <DialogDescription>Optional — log the metric if you have an updated value.</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs">
            {kpiName}
            {kpiUnit ? ` (${kpiUnit})` : ""}
          </Label>
          <Input
            type="number"
            className="mt-1.5"
            placeholder="Current value (optional)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => finish(false)}>
            Skip & mark done
          </Button>
          <Button type="button" disabled={saving} onClick={() => finish(!!value.trim())}>
            {saving ? "Saving…" : "Log & mark done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
