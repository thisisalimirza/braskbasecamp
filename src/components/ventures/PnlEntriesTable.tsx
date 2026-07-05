"use client";

import { useState } from "react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePnlEntryAction, updatePnlEntryAction } from "@/app/actions";
import { formatCents, formatDate, msToDateInput, categoryLabel } from "@/lib/format";
import type { PnlEntry } from "@/lib/pnl";
import type { Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { LedgerEmptyState } from "@/components/ventures/RecordMoneyButton";

export function PnlEntriesTable({
  entries,
  ventureSlug,
  ventureId,
  ventureName,
  categories,
}: {
  entries: PnlEntry[];
  ventureSlug: string;
  ventureId: string;
  ventureName: string;
  categories: Category[];
}) {
  const [editing, setEditing] = useState<PnlEntry | null>(null);
  const hasClients = entries.some((e) => e.clientName);

  return (
    <>
      {entries.length === 0 ? (
        <LedgerEmptyState ventureId={ventureId} ventureName={ventureName} />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            {hasClients && <TableHead>Client</TableHead>}
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id} className="transition-colors hover:bg-muted/40">
              <TableCell className="text-muted-foreground">{formatDate(e.occurredOn)}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    e.entryType === "revenue" && "status-up",
                    e.entryType === "cost" && "status-flat"
                  )}
                >
                  {e.entryType}
                </span>
              </TableCell>
              <TableCell>{categoryLabel(e.category)}</TableCell>
              {hasClients && (
                <TableCell className="text-muted-foreground">{e.clientName ?? "—"}</TableCell>
              )}
              <TableCell className="text-right tabular-nums font-medium">
                {e.entryType === "cost" ? "−" : "+"}
                {formatCents(e.amountCents)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}

      {editing && (
        <EditEntryDialog
          entry={editing}
          ventureSlug={ventureSlug}
          categories={categories.filter((c) => c.entryType === editing.entryType)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function EditEntryDialog({
  entry,
  ventureSlug,
  categories,
  onClose,
}: {
  entry: PnlEntry;
  ventureSlug: string;
  categories: Category[];
  onClose: () => void;
}) {
  const [amount, setAmount] = useState((entry.amountCents / 100).toFixed(2));
  const [date, setDate] = useState(msToDateInput(entry.occurredOn));
  const [category, setCategory] = useState(entry.category);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updatePnlEntryAction(
      entry.id,
      { category, amountDollars: amount, occurredOn: date, notes: notes || null },
      ventureSlug
    );
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Entry updated");
      onClose();
    }
  };

  const handleDelete = async () => {
    const res = await deletePnlEntryAction(entry.id, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Entry deleted");
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit ledger entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? category)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.label}>
                    {categoryLabel(c.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            Save changes
          </Button>
          <Button variant="outline" className="w-full text-muted-foreground" onClick={handleDelete}>
            Delete entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
