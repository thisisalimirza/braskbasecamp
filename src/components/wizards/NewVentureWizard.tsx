"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WizardShell, WizardStep, useWizard } from "./WizardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createVentureAction } from "@/app/actions";
import { KPI_PRESETS, KPI_UNITS } from "@/lib/kpi-units";
import type { VentureType, VentureStatus } from "@/lib/ventures";

type KpiDraft = { name: string; unit: string };

function NewVentureContent({ onDone }: { onDone: () => void }) {
  const { next } = useWizard();
  const [name, setName] = useState("");
  const [ventureType, setVentureType] = useState<VentureType>("product");
  const [oneLiner, setOneLiner] = useState("");
  const [skipKpis, setSkipKpis] = useState(false);
  const [kpis, setKpis] = useState<KpiDraft[]>([{ name: "", unit: "count" }]);
  const [status, setStatus] = useState<VentureStatus>("active");
  const [saving, setSaving] = useState(false);

  const kpiNames = skipKpis ? [] : kpis.filter((k) => k.name.trim()).map((k) => ({ name: k.name.trim(), unit: k.unit }));

  const confirmSentence = `Creating ${name} as an ${status} ${ventureType} venture${
    kpiNames.length ? `, tracking ${kpiNames.map((k) => k.name).join(" and ")}` : ", P&L only"
  }.`;

  const handleSave = async () => {
    setSaving(true);
    const res = await createVentureAction({
      name: name.trim(),
      ventureType,
      oneLiner: oneLiner.trim() || undefined,
      status,
      kpis: kpiNames.length ? kpiNames : undefined,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Venture created");
    onDone();
  };

  return (
    <>
      <WizardStep step={0}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="vname">Name</Label>
            <Input id="vname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Brask Studio" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={ventureType} onValueChange={(v) => setVentureType(v as VentureType)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="oneline">One-liner</Label>
            <Textarea id="oneline" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} rows={2} />
          </div>
        </div>
        <Button className="mt-4 w-full" disabled={!name.trim()} onClick={next}>
          Continue
        </Button>
      </WizardStep>

      <WizardStep step={1}>
        <p className="text-sm text-muted-foreground">
          Pick metrics to track, or skip and add them later on the venture page.
        </p>
        {!skipKpis && (
          <div className="mt-3 flex flex-wrap gap-2">
            {KPI_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const exists = kpis.some((k) => k.name === preset.name);
                  if (!exists && kpis.length < 3) {
                    const empty = kpis.findIndex((k) => !k.name.trim());
                    if (empty >= 0) {
                      const nextKpis = [...kpis];
                      nextKpis[empty] = { name: preset.name, unit: preset.unit };
                      setKpis(nextKpis);
                    } else if (kpis.length < 3) {
                      setKpis([...kpis, { name: preset.name, unit: preset.unit }]);
                    }
                  }
                }}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        )}
        {!skipKpis &&
          kpis.map((kpi, i) => (
            <div key={i} className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px]">
              <Input
                placeholder="Metric name"
                value={kpi.name}
                onChange={(e) => {
                  const nextKpis = [...kpis];
                  nextKpis[i] = { ...nextKpis[i], name: e.target.value };
                  setKpis(nextKpis);
                }}
              />
              <Select
                value={kpi.unit}
                onValueChange={(v) => {
                  const nextKpis = [...kpis];
                  nextKpis[i] = { ...nextKpis[i], unit: v ?? "count" };
                  setKpis(nextKpis);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        {!skipKpis && kpis.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setKpis([...kpis, { name: "", unit: "count" }])}
          >
            Add another KPI
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => {
            setSkipKpis(true);
            next();
          }}
        >
          Just track P&L for now
        </Button>
        {!skipKpis && (
          <Button className="mt-4 w-full" onClick={next}>
            Continue
          </Button>
        )}
      </WizardStep>

      <WizardStep step={2}>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as VentureStatus)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button className="mt-4 w-full" onClick={next}>
          Continue
        </Button>
      </WizardStep>

      <WizardStep step={3}>
        <p className="text-base leading-relaxed">{confirmSentence}</p>
        <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Creating…" : "Confirm & create"}
        </Button>
      </WizardStep>
    </>
  );
}

export function NewVentureWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <WizardShell open={open} onOpenChange={onOpenChange} title="New venture" totalSteps={4}>
      <NewVentureContent onDone={() => onOpenChange(false)} />
    </WizardShell>
  );
}
