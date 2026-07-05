"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createFactAction,
  createLinkAction,
  updateFactAction,
  updateLinkAction,
  deleteFactAction,
  deleteLinkAction,
} from "@/app/actions";
import type { ReferenceFact, ReferenceLink } from "@/lib/reference";
import { toast } from "sonner";

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
  const ventureFacts = facts.filter((f) => f.scope !== "global");
  const globalFacts = facts.filter((f) => f.scope === "global");
  const ventureLinks = links.filter((l) => l.scope !== "global");
  const globalLinks = links.filter((l) => l.scope === "global");

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium">
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        {title}
        <span className="ml-auto text-xs text-muted-foreground">
          {facts.length + links.length} items
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t px-4 py-3">
        {ventureFacts.length > 0 && (
          <Section title="Venture facts" items={ventureFacts} type="fact" ventureSlug={ventureSlug} />
        )}
        {globalFacts.length > 0 && (
          <Section title="Brask Group" items={globalFacts} type="fact" ventureSlug={ventureSlug} />
        )}
        {ventureLinks.length > 0 && (
          <Section title="Venture links" items={ventureLinks} type="link" ventureSlug={ventureSlug} />
        )}
        {globalLinks.length > 0 && (
          <Section title="Global links" items={globalLinks} type="link" ventureSlug={ventureSlug} />
        )}
        <AddReferenceForm scope={scope} ventureSlug={ventureSlug} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function Section({
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
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0 flex-1">
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

  const handleAdd = async () => {
    if (!label.trim() || !value.trim()) return;
    const res =
      mode === "fact"
        ? await createFactAction({ scope, label: label.trim(), value: value.trim(), ventureSlug })
        : await createLinkAction({ scope, label: label.trim(), url: value.trim(), ventureSlug });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Added");
      setLabel("");
      setValue("");
    }
  };

  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="mb-2 flex gap-2">
        <Button type="button" size="sm" variant={mode === "fact" ? "default" : "outline"} onClick={() => setMode("fact")}>
          Fact
        </Button>
        <Button type="button" size="sm" variant={mode === "link" ? "default" : "outline"} onClick={() => setMode("link")}>
          Link
        </Button>
      </div>
      <div className="grid gap-2">
        <div>
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>{mode === "fact" ? "Value" : "URL"}</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
        </div>
        <Button type="button" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
