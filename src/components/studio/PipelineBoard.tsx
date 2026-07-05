"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateClientStageAction } from "@/app/actions";
import { openRecordMoneyPrefilled } from "@/components/AppShell";
import { formatCents } from "@/lib/format";
import type { Client, ClientStage } from "@/lib/clients";

const STAGES: { id: ClientStage; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "proposal", label: "Proposal" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "lost", label: "Lost" },
];

const STUDIO_VENTURE_ID = "v-studio";

export function PipelineBoard({
  clients,
  studioVentureId = STUDIO_VENTURE_ID,
}: {
  clients: Client[];
  studioVentureId?: string;
}) {
  const [items, setItems] = useState(clients);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [promptClient, setPromptClient] = useState<Client | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStage = (stage: ClientStage) => items.filter((c) => c.stage === stage);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const clientId = String(active.id);
    const newStage = String(over.id) as ClientStage;
    const client = items.find((c) => c.id === clientId);
    if (!client || client.stage === newStage) return;

    setItems((prev) => prev.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c)));
    const res = await updateClientStageAction(clientId, newStage);
    if (res.error) {
      toast.error(res.error);
      setItems(clients);
      return;
    }

    if (newStage === "active") {
      setPromptClient(client);
    }
  };

  const activeClient = activeId ? items.find((c) => c.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              id={stage.id}
              className="min-w-[180px] flex-1 rounded-xl bg-muted/40 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const clientId = e.dataTransfer.getData("clientId");
                if (clientId) handleDragEnd({ active: { id: clientId }, over: { id: stage.id } } as DragEndEvent);
              }}
            >
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stage.label}
              </p>
              <div className="space-y-2 min-h-[80px]">
                {byStage(stage.id).map((client) => (
                  <Card
                    key={client.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("clientId", client.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm">{client.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                      {client.estimatedValueCents != null && formatCents(client.estimatedValueCents)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeClient && (
            <Card className="w-[180px] opacity-90 shadow-lg">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{activeClient.name}</CardTitle>
              </CardHeader>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={!!promptClient} onOpenChange={(o) => !o && setPromptClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log revenue?</DialogTitle>
            <DialogDescription>
              {promptClient?.name} moved to Active — want to record a revenue entry now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPromptClient(null)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                openRecordMoneyPrefilled({
                  ventureId: studioVentureId,
                  clientId: promptClient?.id,
                  kind: "revenue",
                });
                setPromptClient(null);
              }}
            >
              Record revenue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
