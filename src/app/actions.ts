"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import * as ventures from "@/lib/ventures";
import * as pnl from "@/lib/pnl";
import * as kpis from "@/lib/kpis";
import * as checkins from "@/lib/checkins";
import * as reference from "@/lib/reference";
import * as clients from "@/lib/clients";
import * as blockers from "@/lib/blockers";
import * as plan from "@/lib/plan";
import { dateToMs, dollarsToCents } from "@/lib/format";
import type { VentureType, VentureStatus } from "@/lib/ventures";
import type { PnlEntryType, OwnerDirection } from "@/lib/pnl";
import type { Trajectory } from "@/lib/checkins";
import type { ClientStage } from "@/lib/clients";
import type { PlanItemStatus } from "@/lib/plan-types";

export type FormState = { ok?: boolean; error?: string };

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/unique/i.test(msg)) return "That slug is already in use.";
  return msg || "Something went wrong — try again.";
}

async function run(fn: () => Promise<void>): Promise<FormState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

function revalidatePortfolio() {
  revalidatePath("/");
  revalidatePath("/ventures");
}

function revalidateVenture(slug?: string) {
  revalidatePortfolio();
  if (slug) revalidatePath(`/ventures/${slug}`);
}

// --- Auth ---

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    redirect("/login?error=1");
  }
  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

// --- Ventures ---

export async function createVentureAction(input: {
  name: string;
  ventureType: VentureType;
  oneLiner?: string;
  status?: VentureStatus;
  kpis?: { name: string; unit?: string }[];
}): Promise<FormState & { slug?: string }> {
  try {
    const venture = await ventures.createVenture({
      name: input.name,
      ventureType: input.ventureType,
      oneLiner: input.oneLiner,
      status: input.status,
    });
    if (input.kpis) {
      for (let i = 0; i < input.kpis.length; i++) {
        await kpis.createKpiDefinition({
          ventureId: venture.id,
          name: input.kpis[i].name,
          unit: input.kpis[i].unit,
          sortOrder: i,
        });
      }
    }
    revalidateVenture(venture.slug);
    return { ok: true, slug: venture.slug };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function updateVentureAction(
  id: string,
  input: Partial<{ name: string; ventureType: VentureType; status: VentureStatus; oneLiner: string | null }>
): Promise<FormState> {
  return run(async () => {
    await ventures.updateVenture(id, input);
    const v = await ventures.getVentureById(id);
    revalidateVenture(v?.slug);
  });
}

export async function reorderVenturesPriorityAction(orderedIds: string[]): Promise<FormState> {
  return run(async () => {
    if (orderedIds.length === 0) return;
    await ventures.reorderVentures(orderedIds);
    revalidatePortfolio();
  });
}

// --- P&L ---

export async function recordPnlEntryAction(input: {
  ventureId: string | null;
  entryType: PnlEntryType;
  direction?: OwnerDirection | null;
  category: string;
  amountDollars: string;
  occurredOn: string;
  clientId?: string | null;
  notes?: string | null;
  paymentSource?: string | null;
}): Promise<FormState> {
  try {
    const amountCents = dollarsToCents(input.amountDollars);
    const occurredOn = dateToMs(input.occurredOn);
    await pnl.createPnlEntry({
      ventureId: input.ventureId,
      entryType: input.entryType,
      direction: input.direction,
      category: input.category,
      amountCents,
      occurredOn,
      clientId: input.clientId,
      notes: input.notes,
      paymentSource: input.paymentSource,
    });

    const jar = await cookies();
    if (input.ventureId) {
      jar.set("last_venture_id", input.ventureId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }

    let slug: string | undefined;
    if (input.ventureId) {
      const v = await ventures.getVentureById(input.ventureId);
      slug = v?.slug;
    }
    revalidateVenture(slug);
    return { ok: true };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function updatePnlEntryAction(
  id: string,
  input: { category: string; amountDollars: string; occurredOn: string; notes?: string | null },
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await pnl.updatePnlEntry(id, {
      category: input.category,
      amountCents: dollarsToCents(input.amountDollars),
      occurredOn: dateToMs(input.occurredOn),
      notes: input.notes ?? null,
    });
    revalidateVenture(ventureSlug);
  });
}

export async function deletePnlEntryAction(id: string, ventureSlug?: string): Promise<FormState> {
  return run(async () => {
    await pnl.deletePnlEntry(id);
    revalidateVenture(ventureSlug);
  });
}

// --- KPIs ---

export async function createKpiDefinitionAction(
  ventureId: string,
  name: string,
  unit: string,
  ventureSlug: string
): Promise<FormState> {
  return run(async () => {
    await kpis.createKpiDefinition({ ventureId, name, unit });
    revalidateVenture(ventureSlug);
  });
}

export async function deleteKpiDefinitionAction(id: string, ventureSlug: string): Promise<FormState> {
  return run(async () => {
    await kpis.deleteKpiDefinition(id);
    revalidateVenture(ventureSlug);
  });
}

export async function createKpiEntryAction(
  kpiDefinitionId: string,
  value: number,
  recordedOn: string,
  ventureSlug: string
): Promise<FormState> {
  return run(async () => {
    await kpis.createKpiEntry({
      kpiDefinitionId,
      value,
      recordedOn: dateToMs(recordedOn),
    });
    revalidateVenture(ventureSlug);
  });
}

// --- Check-ins ---

export async function saveWeeklyCheckinAction(
  items: {
    ventureId: string;
    trajectory: Trajectory;
    note?: string | null;
    kpiUpdates?: { kpiDefinitionId: string; value: number }[];
  }[]
): Promise<FormState> {
  return run(async () => {
    const checkedAt = Date.now();
    for (const item of items) {
      const checkinId = await checkins.createCheckin({
        ventureId: item.ventureId,
        checkedAt,
        trajectory: item.trajectory,
        note: item.note,
      });
      if (item.note?.trim()) {
        await blockers.syncPrimaryBlockerFromCheckin({
          ventureId: item.ventureId,
          checkinId,
          body: item.note.trim(),
        });
      }
      if (item.kpiUpdates) {
        for (const k of item.kpiUpdates) {
          await kpis.createKpiEntry({
            kpiDefinitionId: k.kpiDefinitionId,
            value: k.value,
            recordedOn: checkedAt,
          });
        }
      }
    }
    revalidatePortfolio();
    for (const item of items) {
      const v = await ventures.getVentureById(item.ventureId);
      if (v) revalidatePath(`/ventures/${v.slug}`);
    }
  });
}

// --- Blockers ---

export async function createBlockerAction(input: {
  ventureId: string;
  body: string;
  makePrimary?: boolean;
  ventureSlug?: string;
}): Promise<FormState> {
  return run(async () => {
    await blockers.createBlocker({
      ventureId: input.ventureId,
      body: input.body,
      makePrimary: input.makePrimary,
    });
    revalidateVenture(input.ventureSlug);
  });
}

export async function updateBlockerAction(
  id: string,
  body: string,
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await blockers.updateBlocker(id, body);
    revalidateVenture(ventureSlug);
  });
}

export async function setPrimaryBlockerAction(
  ventureId: string,
  blockerId: string,
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await blockers.setPrimaryBlocker(ventureId, blockerId);
    revalidateVenture(ventureSlug);
  });
}

export async function resolveBlockerAction(id: string, ventureSlug?: string): Promise<FormState> {
  return run(async () => {
    await blockers.resolveBlocker(id);
    revalidateVenture(ventureSlug);
  });
}

// --- Plan ---

export async function createPlanItemAction(input: {
  ventureId: string;
  title: string;
  notes?: string | null;
  status?: PlanItemStatus;
  blockerId?: string | null;
  ventureSlug?: string;
}): Promise<FormState> {
  return run(async () => {
    await plan.createPlanItem(input);
    revalidateVenture(input.ventureSlug);
  });
}

export async function updatePlanItemAction(
  id: string,
  input: Partial<{ title: string; notes: string | null; blockerId: string | null }>,
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await plan.updatePlanItem(id, input);
    revalidateVenture(ventureSlug);
  });
}

export async function movePlanItemAction(
  id: string,
  status: PlanItemStatus,
  sortOrder: number,
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await plan.movePlanItem(id, status, sortOrder);
    revalidateVenture(ventureSlug);
  });
}

export async function deletePlanItemAction(id: string, ventureSlug?: string): Promise<FormState> {
  return run(async () => {
    await plan.deletePlanItem(id);
    revalidateVenture(ventureSlug);
  });
}

// --- Reference ---

export async function createFactAction(input: {
  scope: string;
  label: string;
  value: string;
  category?: string;
  ventureSlug?: string;
}): Promise<FormState> {
  return run(async () => {
    await reference.createFact(input);
    revalidatePortfolio();
    if (input.ventureSlug) revalidatePath(`/ventures/${input.ventureSlug}`);
  });
}

export async function updateFactAction(
  id: string,
  label: string,
  value: string,
  category: string | undefined,
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await reference.updateFact(id, label, value, category);
    revalidatePortfolio();
    if (ventureSlug) revalidatePath(`/ventures/${ventureSlug}`);
  });
}

export async function deleteFactAction(id: string, ventureSlug?: string): Promise<FormState> {
  return run(async () => {
    await reference.deleteFact(id);
    revalidatePortfolio();
    if (ventureSlug) revalidatePath(`/ventures/${ventureSlug}`);
  });
}

export async function createLinkAction(input: {
  scope: string;
  label: string;
  url: string;
  category?: string;
  ventureSlug?: string;
}): Promise<FormState> {
  return run(async () => {
    await reference.createLink(input);
    revalidatePortfolio();
    if (input.ventureSlug) revalidatePath(`/ventures/${input.ventureSlug}`);
  });
}

export async function updateLinkAction(
  id: string,
  label: string,
  url: string,
  category: string | undefined,
  ventureSlug?: string
): Promise<FormState> {
  return run(async () => {
    await reference.updateLink(id, label, url, category);
    revalidatePortfolio();
    if (ventureSlug) revalidatePath(`/ventures/${ventureSlug}`);
  });
}

export async function deleteLinkAction(id: string, ventureSlug?: string): Promise<FormState> {
  return run(async () => {
    await reference.deleteLink(id);
    revalidatePortfolio();
    if (ventureSlug) revalidatePath(`/ventures/${ventureSlug}`);
  });
}

// --- Clients (Studio) ---

export async function createClientAction(input: {
  name: string;
  stage?: ClientStage;
  estimatedValueCents?: number | null;
  contactInfo?: string | null;
}): Promise<FormState & { clientId?: string }> {
  try {
    const client = await clients.createClient(input);
    revalidateVenture("brask-studio");
    return { ok: true, clientId: client.id };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function updateClientStageAction(id: string, stage: ClientStage): Promise<FormState> {
  return run(async () => {
    await clients.updateClientStage(id, stage);
    revalidateVenture("brask-studio");
  });
}

export async function updateClientAction(
  id: string,
  input: Partial<{
    name: string;
    stage: ClientStage;
    estimatedValueCents: number | null;
    contactInfo: string | null;
    notes: string | null;
  }>
): Promise<FormState> {
  return run(async () => {
    await clients.updateClient(id, input);
    revalidateVenture("brask-studio");
  });
}
