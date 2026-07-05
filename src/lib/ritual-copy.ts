import { formatDate } from "./format";

export type RitualStatus = "never" | "overdue" | "due" | "current";

export type VenturePulseNeed = {
  id: string;
  name: string;
  slug: string;
};

export type PortfolioRitualStatus = {
  status: RitualStatus;
  lastFullRitualAt: number | null;
  daysSinceLastRitual: number | null;
  activeVentureCount: number;
  venturesMissingPulse: number;
  venturesNeedingPulse: VenturePulseNeed[];
};

export type PulseBannerCopy = {
  title: string;
  hint: string;
  buttonLabel: string;
  ventureIds: string[];
  prominent: boolean;
};

function formatVentureList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function pulseButtonLabel(ventures: VenturePulseNeed[]): string {
  if (ventures.length === 1) return `Pulse ${ventures[0].name}`;
  return `Pulse ${ventures.length} remaining`;
}

/** Returns null when every venture has a fresh pulse — banner should hide. */
export function pulseBannerCopy(status: PortfolioRitualStatus): PulseBannerCopy | null {
  const missing = status.venturesNeedingPulse;
  if (missing.length === 0) return null;

  const list = formatVentureList(missing.map((v) => v.name));
  const ids = missing.map((v) => v.id);
  const buttonLabel = pulseButtonLabel(missing);

  switch (status.status) {
    case "never":
      return {
        title: "Run your first portfolio pulse",
        hint:
          missing.length === status.activeVentureCount
            ? "Walk through each venture — how it's going, key numbers, what's in the way."
            : `${list} ${missing.length === 1 ? "hasn't" : "haven't"} had a pulse yet.`,
        buttonLabel: missing.length === status.activeVentureCount ? "Run first pulse" : buttonLabel,
        ventureIds: ids,
        prominent: true,
      };
    case "overdue":
      return {
        title: "Catch up on pulses",
        hint: `${list} ${missing.length === 1 ? "hasn't" : "haven't"} had a pulse in over a week.`,
        buttonLabel,
        ventureIds: ids,
        prominent: true,
      };
    case "due":
      return {
        title: "Time for your weekly pulse",
        hint: `Still due this week: ${list}.`,
        buttonLabel,
        ventureIds: ids,
        prominent: true,
      };
    case "current":
      return {
        title: missing.length === 1 ? `${missing[0].name} needs a pulse` : `${missing.length} ventures need a pulse`,
        hint: `${list} ${missing.length === 1 ? "hasn't" : "haven't"} been pulsed this week.`,
        buttonLabel,
        ventureIds: ids,
        prominent: true,
      };
  }
}

export function ritualWizardTitle(status: RitualStatus): string {
  switch (status) {
    case "never":
      return "Your first venture pulse";
    case "overdue":
      return "Catch up on ventures";
    case "due":
      return "Weekly venture pulse";
    case "current":
      return "Update venture pulse";
  }
}

export function venturePulseWizardTitle(ventureName: string): string {
  return `Pulse · ${ventureName}`;
}

export function remainingPulseWizardTitle(count: number): string {
  return `Pulse · ${count} remaining`;
}

export function portfolioHeaderLine(ritual: PortfolioRitualStatus, attentionCount: number): string {
  if (attentionCount > 0) {
    return `${attentionCount} venture${attentionCount === 1 ? " needs" : "s need"} attention — see your priority list below.`;
  }
  if (ritual.venturesNeedingPulse.length === 0 && ritual.lastFullRitualAt && ritual.daysSinceLastRitual != null) {
    const when =
      ritual.daysSinceLastRitual === 0
        ? "today"
        : ritual.daysSinceLastRitual === 1
          ? "yesterday"
          : formatDate(ritual.lastFullRitualAt);
    return `Last full pulse was ${when}. Everything else is below.`;
  }
  return "Your ventures at a glance — highest priority first.";
}
