"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import {
  createFactAction,
  createLinkAction,
  deleteFactAction,
  deleteLinkAction,
} from "@/app/actions";
import type { ReferenceFact, ReferenceLink } from "@/lib/reference";
import { toast } from "sonner";

const FACT_CATEGORIES = ["legal", "financial", "credentials", "other"] as const;
const LINK_CATEGORIES = ["repo", "analytics", "banking", "docs", "social", "other"] as const;

export function ReferencePanel({
  facts,
  links,
  scope,
  ventureSlug,
  title = "Reference",
}: {
  facts: ReferenceFact[];
  links: ReferenceLink[];
  scope: string;
  ventureSlug?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border border-border/80 bg-card shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-5 py-4 text-left">
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        <span className="font-heading text-base font-semibold">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{facts.length + links.length} saved</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 border-t border-border/60 px-5 py-4">
        <ReferenceList title="Facts" items={facts} type="fact" ventureSlug={ventureSlug} />
        <ReferenceList title="Links" items={links} type="link" ventureSlug={ventureSlug} />
        <AddReferenceForm scope={scope} ventureSlug={ventureSlug} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReferenceList({
  title,
  items,
  type,
  ventureSlug,
}: {
  title: string;
  items: (ReferenceFact | ReferenceLink)[];
  type: "fact" | "link";
  ventureSlug?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{item.label}</p>
              {type === "fact" ? (
                <p className="text-muted-foreground">{(item as ReferenceFact).value || "—"}</p>
              ) : (
                <a
                  href={(item as ReferenceLink).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {(item as ReferenceLink).url}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={async () => {
                const res =
                  type === "fact"
                    ? await deleteFactAction(item.id, ventureSlug)
                    : await deleteLinkAction(item.id, ventureSlug);
                if (res.error) toast.error(res.error);
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddReferenceForm({ scope, ventureSlug }: { scope: string; ventureSlug?: string }) {
  const [mode, setMode] = useState<"fact" | "link">("fact");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("other");

  const handleAdd = async () => {
    if (!label.trim() || !value.trim()) return;
    const res =
      mode === "fact"
        ? await createFactAction({ scope, label: label.trim(), value: value.trim(), category, ventureSlug })
        : await createLinkAction({ scope, label: label.trim(), url: value.trim(), category, ventureSlug });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Saved");
      setLabel("");
      setValue("");
    }
  };

  const categories = mode === "fact" ? FACT_CATEGORIES : LINK_CATEGORIES;

  return (
    <div className="rounded-xl border border-dashed border-border/80 p-4">
      <div className="mb-3 flex gap-2">
        <Button type="button" size="sm" variant={mode === "fact" ? "default" : "outline"} onClick={() => setMode("fact")}>
          Fact
        </Button>
        <Button type="button" size="sm" variant={mode === "link" ? "default" : "outline"} onClick={() => setMode("link")}>
          Link
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" placeholder="Stripe dashboard" />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "other")}>
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">{mode === "fact" ? "Value" : "URL"}</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
        </div>
      </div>
      <Button type="button" size="sm" className="mt-3" onClick={handleAdd}>
        Add {mode}
      </Button>
    </div>
  );
}
