"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function PnlEntriesTable({
  entries,
  ventureSlug,
}: {
  entries: PnlEntry[];
  ventureSlug: string;
}) {
  const [editing, setEditing] = useState<PnlEntry | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No entries yet
              </TableCell>
            </TableRow>
          )}
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{formatDate(e.occurredOn)}</TableCell>
              <TableCell className="capitalize">{e.entryType}</TableCell>
              <TableCell>{categoryLabel(e.category)}</TableCell>
              <TableCell className="text-right tabular-nums">
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

      {editing && (
        <EditEntryDialog
          entry={editing}
          ventureSlug={ventureSlug}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function EditEntryDialog({
  entry,
  ventureSlug,
  onClose,
}: {
  entry: PnlEntry;
  ventureSlug: string;
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
          <DialogTitle>Edit entry</DialogTitle>
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
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            Save
          </Button>
          <Button variant="outline" className="w-full" onClick={handleDelete}>
            Delete entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
