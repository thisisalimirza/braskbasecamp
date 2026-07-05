"use client";

import { sparklinePoints } from "@/lib/chart";
import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
  width = 80,
  height = 28,
  positive,
}: {
  values: number[];
  className?: string;
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  if (values.length === 0) return null;
  const path = sparklinePoints(values, width, height);
  const stroke =
    positive === undefined
      ? "currentColor"
      : positive
        ? "rgb(16 185 129)"
        : "rgb(239 68 68)";

  return (
    <svg
      width={width}
      height={height}
      className={cn("shrink-0 opacity-80", className)}
      aria-hidden
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
