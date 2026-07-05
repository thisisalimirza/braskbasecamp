"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WizardShell, WizardStep, useWizard } from "./WizardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordPnlEntryAction, createClientAction } from "@/app/actions";
import { formatCents, formatDate, todayInput, categoryLabel, dateToMs } from "@/lib/format";
import { STUDIO_SLUG, getCategoryHints } from "@/lib/venture-config";
import type { Venture } from "@/lib/ventures";
import type { Category } from "@/lib/categories";
import type { Client } from "@/lib/clients";
import { ArrowDownCircle, ArrowUpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

type EntryKind = "revenue" | "cost" | "owner";

type RecordMoneyState = {
  kind: EntryKind | null;
  ventureId: string | null;
  amount: string;
  occurredOn: string;
  category: string;
  direction: "contribution" | "draw";
  clientId: string | null;
  notes: string;
};

const INITIAL: RecordMoneyState = {
  kind: null,
  ventureId: null,
  amount: "",
  occurredOn: todayInput(),
  category: "",
  direction: "contribution",
  clientId: null,
  notes: "",
};

function RecordMoneyInner({
  ventures,
  revenueCategories,
  costCategories,
  clients,
  lastVentureId,
  prefill,
  onDone,
}: {
  ventures: Venture[];
  revenueCategories: Category[];
  costCategories: Category[];
  clients: Client[];
  lastVentureId?: string;
  prefill?: { ventureId?: string; clientId?: string; kind?: EntryKind };
  onDone: () => void;
}) {
  const { step, next, setStep } = useWizard();
  const [state, setState] = useState<RecordMoneyState>({
    ...INITIAL,
    ventureId: prefill?.ventureId ?? lastVentureId ?? null,
    clientId: prefill?.clientId ?? null,
    kind: prefill?.kind ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [clientList, setClientList] = useState(clients);

  const activeVentures = ventures.filter((v) => v.status === "active");
  const selectedVenture = ventures.find((v) => v.id === state.ventureId);
  const isStudioRevenue = state.kind === "revenue" && selectedVenture?.slug === STUDIO_SLUG;
  const baseCategories = state.kind === "cost" ? costCategories : revenueCategories;
  const hints = getCategoryHints(selectedVenture?.slug);
  const categories = hints
    ? baseCategories.filter((c) => hints.includes(c.label) || c.label.startsWith("other_"))
    : baseCategories;

  const goNext = () => {
    if (step === 3 && !isStudioRevenue) {
      setStep(5);
      return;
    }
    next();
  };

  const handleSave = async () => {
    setSaving(true);
    const entryType =
      state.kind === "owner" ? "owner_transaction" : state.kind === "revenue" ? "revenue" : "cost";
    const res = await recordPnlEntryAction({
      ventureId: state.ventureId,
      entryType,
      direction: state.kind === "owner" ? state.direction : null,
      category: state.kind === "owner" ? "owner_equity" : state.category,
      amountDollars: state.amount,
      occurredOn: state.occurredOn,
      clientId: state.clientId,
      notes: state.notes || null,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Money recorded");
    onDone();
  };

  const cents = Math.round(parseFloat(state.amount || "0") * 100);
  const client = clientList.find((c) => c.id === state.clientId);
  let sentence = "";
  if (state.kind === "owner") {
    sentence = `Recording a ${formatCents(cents)} owner ${state.direction} into Brask Group${selectedVenture ? ` (tagged ${selectedVenture.name})` : ""}.`;
  } else if (state.kind === "revenue") {
    sentence = `Recording ${formatCents(cents)} revenue for ${selectedVenture?.name ?? "company overhead"}${client ? `, from ${client.name}` : ""}, received ${formatDate(dateToMs(state.occurredOn))}.`;
  } else {
    sentence = `Recording ${formatCents(cents)} cost for ${selectedVenture?.name ?? "company overhead"}, paid ${formatDate(dateToMs(state.occurredOn))}.`;
  }

  return (
    <>
      <WizardStep step={0}>
        <p className="text-sm text-muted-foreground">Money in or money out?</p>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => {
              setState((s) => ({ ...s, kind: "revenue" }));
              next();
            }}
            className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-900 dark:bg-emerald-950/30"
          >
            <ArrowUpCircle className="size-8 text-emerald-600" />
            <div>
              <p className="font-semibold">Revenue</p>
              <p className="text-xs text-muted-foreground">Money coming in</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setState((s) => ({ ...s, kind: "cost" }));
              next();
            }}
            className="flex items-center gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-4 text-left dark:border-zinc-700 dark:bg-zinc-900/50"
          >
            <ArrowDownCircle className="size-8 text-zinc-600" />
            <div>
              <p className="font-semibold">Cost</p>
              <p className="text-xs text-muted-foreground">Money going out</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setState((s) => ({ ...s, kind: "owner", ventureId: null }));
              next();
            }}
            className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground"
          >
            <User className="size-4" />
            Owner contribution / draw
          </button>
        </div>
      </WizardStep>

      <WizardStep step={1}>
        <p className="text-sm text-muted-foreground">Which venture?</p>
        <div className="grid gap-2">
          {state.kind !== "owner" && (
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, ventureId: null }))}
              className={cn("rounded-lg border p-3 text-left text-sm", state.ventureId === null && "border-primary bg-primary/5")}
            >
              Company-wide overhead
            </button>
          )}
          {activeVentures.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setState((s) => ({ ...s, ventureId: v.id }))}
              className={cn("rounded-lg border p-3 text-left text-sm", state.ventureId === v.id && "border-primary bg-primary/5")}
            >
              {v.name}
            </button>
          ))}
        </div>
        <Button className="mt-4 w-full" onClick={next}>
          Continue
        </Button>
      </WizardStep>

      <WizardStep step={2}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" min="0" value={state.amount} onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={state.occurredOn} onChange={(e) => setState((s) => ({ ...s, occurredOn: e.target.value }))} />
          </div>
        </div>
        <Button className="mt-4 w-full" disabled={!state.amount} onClick={next}>
          Continue
        </Button>
      </WizardStep>

      <WizardStep step={3}>
        {state.kind === "owner" ? (
          <div className="grid grid-cols-2 gap-2">
            {(["contribution", "draw"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setState((s) => ({ ...s, direction: d }))}
                className={cn("rounded-lg border p-3 text-sm capitalize", state.direction === d && "border-primary bg-primary/5")}
              >
                {d}
              </button>
            ))}
          </div>
        ) : (
          <Select value={state.category} onValueChange={(v) => setState((s) => ({ ...s, category: v ?? "" }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.label}>
                  {categoryLabel(c.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          className="mt-4 w-full"
          disabled={state.kind === "owner" ? false : !state.category}
          onClick={goNext}
        >
          Continue
        </Button>
      </WizardStep>

      <WizardStep step={4}>
        <Label>Client (optional)</Label>
        <Select value={state.clientId ?? "none"} onValueChange={(v) => setState((s) => ({ ...s, clientId: v === "none" ? null : v }))}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No client</SelectItem>
            {clientList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Or add new client"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (!newClientName.trim()) return;
              const res = await createClientAction({ name: newClientName.trim(), stage: "active" });
              if (res.error) toast.error(res.error);
              else if (res.clientId) {
                setClientList((prev) => [
                  ...prev,
                  {
                    id: res.clientId!,
                    name: newClientName.trim(),
                    stage: "active",
                    estimatedValueCents: null,
                    contactInfo: null,
                    notes: null,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  },
                ]);
                setState((s) => ({ ...s, clientId: res.clientId! }));
                setNewClientName("");
                toast.success("Client added");
              }
            }}
          >
            Add
          </Button>
        </div>
        <Button className="mt-4 w-full" onClick={next}>
          Continue
        </Button>
      </WizardStep>

      <WizardStep step={5}>
        <p className="text-base leading-relaxed">{sentence}</p>
        <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Confirm & save"}
        </Button>
      </WizardStep>
    </>
  );
}

function initialStepForPrefill(prefill?: {
  ventureId?: string;
  clientId?: string;
  kind?: EntryKind;
}): number {
  if (prefill?.kind && prefill?.ventureId) return 2;
  if (prefill?.kind) return 1;
  return 0;
}

export function RecordMoneyWizard({
  open,
  onOpenChange,
  ventures,
  revenueCategories,
  costCategories,
  clients,
  lastVentureId,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventures: Venture[];
  revenueCategories: Category[];
  costCategories: Category[];
  clients: Client[];
  lastVentureId?: string;
  prefill?: { ventureId?: string; clientId?: string; kind?: EntryKind };
}) {
  const key = useMemo(
    () => JSON.stringify({ open, prefill }),
    [open, prefill]
  );
  const initialStep = initialStepForPrefill(prefill);

  return (
    <WizardShell
      key={key}
      open={open}
      onOpenChange={onOpenChange}
      title="Record money"
      totalSteps={6}
      initialStep={initialStep}
    >
      <RecordMoneyInner
        key={key}
        ventures={ventures}
        revenueCategories={revenueCategories}
        costCategories={costCategories}
        clients={clients}
        lastVentureId={lastVentureId}
        prefill={prefill}
        onDone={() => onOpenChange(false)}
      />
    </WizardShell>
  );
}
