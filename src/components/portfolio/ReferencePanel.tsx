"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ExternalLink, Pencil, Check, X } from "lucide-react";
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
  updateFactAction,
  updateLinkAction,
} from "@/app/actions";
import type { ReferenceFact, ReferenceLink } from "@/lib/reference";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FACT_CATEGORIES = ["legal", "financial", "credentials", "other"] as const;
const LINK_CATEGORIES = ["repo", "analytics", "banking", "docs", "social", "other"] as const;

type ReferenceItem = ReferenceFact | ReferenceLink;

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const total = facts.length + links.length;

  const refresh = () => router.refresh();

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl border border-border/80 bg-card shadow-sm"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-5 py-4 text-left">
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        <span className="font-heading text-base font-semibold">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {total} saved
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 border-t border-border/60 px-5 py-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet — add facts and links you&apos;ll want handy later.
          </p>
        ) : (
          <>
            {facts.length > 0 && (
              <ReferenceSection title="Facts">
                {facts.map((item) => (
                  <ReferenceItemRow
                    key={item.id}
                    item={item}
                    type="fact"
                    ventureSlug={ventureSlug}
                    onChanged={refresh}
                  />
                ))}
              </ReferenceSection>
            )}
            {links.length > 0 && (
              <ReferenceSection title="Links">
                {links.map((item) => (
                  <ReferenceItemRow
                    key={item.id}
                    item={item}
                    type="link"
                    ventureSlug={ventureSlug}
                    onChanged={refresh}
                  />
                ))}
              </ReferenceSection>
            )}
          </>
        )}
        <AddReferenceForm scope={scope} ventureSlug={ventureSlug} onChanged={refresh} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReferenceSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function ReferenceItemRow({
  item,
  type,
  ventureSlug,
  onChanged,
}: {
  item: ReferenceItem;
  type: "fact" | "link";
  ventureSlug?: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [value, setValue] = useState(
    type === "fact" ? (item as ReferenceFact).value : (item as ReferenceLink).url
  );
  const [category, setCategory] = useState(item.category ?? "other");
  const [saving, setSaving] = useState(false);

  const categories = type === "fact" ? FACT_CATEGORIES : LINK_CATEGORIES;
  const displayValue = type === "fact" ? (item as ReferenceFact).value : (item as ReferenceLink).url;
  const isEmpty = !displayValue.trim();

  const resetForm = () => {
    setLabel(item.label);
    setValue(type === "fact" ? (item as ReferenceFact).value : (item as ReferenceLink).url);
    setCategory(item.category ?? "other");
    setEditing(false);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!value.trim()) {
      toast.error(type === "fact" ? "Value is required" : "URL is required");
      return;
    }
    setSaving(true);
    const res =
      type === "fact"
        ? await updateFactAction(item.id, label.trim(), value.trim(), category, ventureSlug)
        : await updateLinkAction(item.id, label.trim(), value.trim(), category, ventureSlug);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Saved");
      setEditing(false);
      onChanged();
    }
  };

  const handleDelete = async () => {
    const res =
      type === "fact"
        ? await deleteFactAction(item.id, ventureSlug)
        : await deleteLinkAction(item.id, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Removed");
      onChanged();
    }
  };

  if (editing) {
    return (
      <li className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" />
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
            <Label className="text-xs">{type === "fact" ? "Value" : "URL"}</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1" onClick={handleSave} disabled={saving}>
            <Check className="size-3.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={resetForm} disabled={saving}>
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleDelete}
            disabled={saving}
          >
            Delete
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{item.label}</p>
          {item.category && (
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
              {item.category}
            </span>
          )}
        </div>
        {type === "fact" ? (
          <p className={cn("mt-0.5", isEmpty ? "italic text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
            {isEmpty ? "Not set — tap Edit to fill in" : displayValue}
          </p>
        ) : (
          <a
            href={displayValue}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-primary hover:underline"
          >
            {displayValue}
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-muted-foreground"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={handleDelete}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function AddReferenceForm({
  scope,
  ventureSlug,
  onChanged,
}: {
  scope: string;
  ventureSlug?: string;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"fact" | "link">("fact");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!label.trim() || !value.trim()) {
      toast.error("Label and value are required");
      return;
    }
    setSaving(true);
    const res =
      mode === "fact"
        ? await createFactAction({
            scope,
            label: label.trim(),
            value: value.trim(),
            category,
            ventureSlug,
          })
        : await createLinkAction({
            scope,
            label: label.trim(),
            url: value.trim(),
            category,
            ventureSlug,
          });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Added");
      setLabel("");
      setValue("");
      onChanged();
    }
  };

  const categories = mode === "fact" ? FACT_CATEGORIES : LINK_CATEGORIES;

  return (
    <div className="rounded-xl border border-dashed border-border/80 p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Add new</p>
      <div className="mb-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "fact" ? "default" : "outline"}
          onClick={() => setMode("fact")}
        >
          Fact
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "link" ? "default" : "outline"}
          onClick={() => setMode("link")}
        >
          Link
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1"
            placeholder={mode === "fact" ? "EIN" : "Stripe dashboard"}
          />
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
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1"
            placeholder={mode === "fact" ? "33-2756896" : "https://"}
          />
        </div>
      </div>
      <Button type="button" size="sm" className="mt-3" onClick={handleAdd} disabled={saving}>
        {saving ? "Adding…" : `Add ${mode}`}
      </Button>
    </div>
  );
}
