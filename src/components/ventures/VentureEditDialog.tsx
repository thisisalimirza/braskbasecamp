"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateVentureAction } from "@/app/actions";
import type { Venture, VentureStatus, VentureType } from "@/lib/ventures";

export function VentureEditDialog({ venture }: { venture: Venture }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(venture.name);
  const [ventureType, setVentureType] = useState<VentureType>(venture.ventureType);
  const [status, setStatus] = useState<VentureStatus>(venture.status);
  const [oneLiner, setOneLiner] = useState(venture.oneLiner ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateVentureAction(venture.id, {
      name,
      ventureType,
      status,
      oneLiner: oneLiner || null,
    });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Venture updated");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit venture</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
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
          </div>
          <div>
            <Label>One-liner</Label>
            <Textarea value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} className="mt-1" rows={2} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
