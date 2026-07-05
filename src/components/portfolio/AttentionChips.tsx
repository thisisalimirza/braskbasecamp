import type { VentureHealth } from "@/lib/venture-health";
import { attentionChipClass, attentionChipsForVenture } from "@/lib/venture-attention-ui";
import { cn } from "@/lib/utils";

export function AttentionChips({
  row,
  className,
  max = 3,
}: {
  row: VentureHealth;
  className?: string;
  max?: number;
}) {
  const chips = attentionChipsForVenture(row).slice(0, max);
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={cn(
            "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] leading-tight",
            attentionChipClass(chip.tone)
          )}
        >
          <span className="truncate">{chip.label}</span>
        </span>
      ))}
    </div>
  );
}
