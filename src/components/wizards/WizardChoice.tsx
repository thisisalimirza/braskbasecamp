import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WizardChoice({
  onClick,
  selected,
  children,
  className,
  size = "default",
}: {
  onClick: () => void;
  selected?: boolean;
  children: ReactNode;
  className?: string;
  size?: "default" | "compact";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 text-left transition-all duration-150",
        "hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-sm",
        "active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary/15"
          : "border-border/80 bg-card",
        size === "default" ? "p-4" : "p-3",
        className
      )}
    >
      {children}
    </button>
  );
}

export function WizardChoiceGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-2.5", className)}>{children}</div>;
}
