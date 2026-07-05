import { formatDate } from "./format";

export type RitualStatus = "never" | "overdue" | "due" | "current";

export type PortfolioRitualStatus = {
  status: RitualStatus;
  lastFullRitualAt: number | null;
  daysSinceLastRitual: number | null;
  activeVentureCount: number;
  venturesMissingPulse: number;
};

export function ritualButtonCopy(status: PortfolioRitualStatus): {
  label: string;
  hint: string;
  variant: "default" | "secondary" | "outline" | "ghost";
  prominent: boolean;
} {
  const when = status.lastFullRitualAt
    ? status.daysSinceLastRitual === 0
      ? "today"
      : status.daysSinceLastRitual === 1
        ? "yesterday"
        : formatDate(status.lastFullRitualAt)
    : null;

  switch (status.status) {
    case "never":
      return {
        label: "Run your first pulse",
        hint: "Walk through each venture once — how it's going, key numbers, anything stuck.",
        variant: "default",
        prominent: true,
      };
    case "overdue":
      return {
        label: "Catch up on ventures",
        hint:
          status.venturesMissingPulse > 0
            ? `${status.venturesMissingPulse} venture${status.venturesMissingPulse === 1 ? " hasn't" : "s haven't"} had a pulse in over a week.`
            : "It's been more than two weeks since you walked through everything together.",
        variant: "default",
        prominent: true,
      };
    case "due":
      return {
        label: "Time for your weekly pulse",
        hint: when ? `Last full pulse was ${when}.` : "About a week since you checked everything.",
        variant: "default",
        prominent: true,
      };
    case "current":
      return {
        label: "Update pulse",
        hint: when
          ? `You're caught up — last pulse ${when}. Update anytime something changes.`
          : "You're caught up this week.",
        variant: "ghost",
        prominent: false,
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

export function portfolioHeaderLine(ritual: PortfolioRitualStatus, attentionCount: number): string {
  if (ritual.status === "overdue" || ritual.status === "due" || ritual.status === "never") {
    return ritualButtonCopy(ritual).hint;
  }
  if (attentionCount > 0) {
    return `${attentionCount} venture${attentionCount === 1 ? " needs" : "s need"} a look — details below.`;
  }
  const when =
    ritual.lastFullRitualAt && ritual.daysSinceLastRitual != null
      ? ritual.daysSinceLastRitual === 0
        ? "today"
        : ritual.daysSinceLastRitual === 1
          ? "yesterday"
          : formatDate(ritual.lastFullRitualAt)
      : null;
  return when ? `You're caught up. Last full pulse was ${when}.` : "Everything looks steady right now.";
}
