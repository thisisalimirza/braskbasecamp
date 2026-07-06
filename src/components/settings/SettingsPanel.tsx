"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { setHardWipLimitsAction } from "@/app/actions";
import type { AppSettings } from "@/lib/settings";
import { MAX_DOING_PER_VENTURE, MAX_DOING_PORTFOLIO } from "@/lib/plan-wip";

export function SettingsPanel({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [hardWipLimits, setHardWipLimits] = useState(initial.hardWipLimits);
  const [saving, setSaving] = useState(false);

  const save = async (enabled: boolean) => {
    setSaving(true);
    setHardWipLimits(enabled);
    const res = await setHardWipLimitsAction(enabled);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      setHardWipLimits(!enabled);
    } else {
      toast.success(enabled ? "Hard WIP limits on" : "Hard WIP limits off");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        eyebrow="Base Camp"
        title="Settings"
        description="Tune how strictly the app enforces your planning rules."
      />

      <SectionCard
        title="Work in progress limits"
        description="Keep your minimum-next-step habit honest by limiting how many steps can be in progress at once."
      >
        <div className="space-y-4">
          <ul className="text-sm text-muted-foreground">
            <li>· Max {MAX_DOING_PER_VENTURE} in progress per venture</li>
            <li>· Max {MAX_DOING_PORTFOLIO} in progress across the portfolio</li>
          </ul>

          <div className="flex flex-col gap-3 rounded-xl border border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Hard WIP limits</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hardWipLimits
                  ? "Starting another step is blocked until you finish or park one."
                  : "You'll get a warning but can still start another step."}
              </p>
            </div>
            <Button
              type="button"
              variant={hardWipLimits ? "default" : "outline"}
              className="shrink-0"
              disabled={saving}
              onClick={() => save(!hardWipLimits)}
            >
              {hardWipLimits ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Mobile" description="Optimized for phones." tone="quiet">
        <p className="text-sm text-muted-foreground">
          Inputs use 16px text on small screens so iOS Safari won&apos;t zoom when you tap to type.
          Focus mode opens full-screen for distraction-free work.
        </p>
      </SectionCard>
    </div>
  );
}
