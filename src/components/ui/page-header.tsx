import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * tone establishes the page's visual hierarchy:
 * - "attention": needs the user to act — warm tint, strongest weight
 * - "default": today's working surface
 * - "quiet": reference/monitoring — recedes until needed
 */
export function SectionCard({
  title,
  description,
  children,
  className,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "attention" | "default" | "quiet";
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        tone === "attention" &&
          "border-red-200/80 bg-red-50/40 shadow-sm dark:border-red-900/40 dark:bg-red-950/15",
        tone === "default" && "border-border/80 bg-card shadow-sm",
        tone === "quiet" && "border-border/60 bg-card/50",
        className
      )}
    >
      <div className={cn("mb-5", tone === "quiet" && "mb-4")}>
        <h2
          className={cn(
            "font-heading font-semibold tracking-tight",
            tone === "quiet" ? "text-sm text-muted-foreground" : "text-base"
          )}
        >
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
