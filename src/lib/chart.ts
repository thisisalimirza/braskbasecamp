export function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min];
  const range = max - min;
  const rawStep = range / Math.max(count - 1, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const step = (residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1) * magnitude;

  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    if (v >= min - step * 0.5) ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

export function pickLabelIndices(n: number, count: number): number[] {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const out = new Set<number>();
  for (let i = 0; i < count; i++) {
    out.add(Math.round((i / (count - 1)) * (n - 1)));
  }
  return [...out].sort((a, b) => a - b);
}

export function sparklinePoints(
  values: number[],
  width: number,
  height: number,
  padding = 2
): string {
  if (values.length === 0) return "";
  if (values.length === 1) {
    const y = height / 2;
    return `M${padding},${y} L${width - padding},${y}`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerH = height - padding * 2;
  const innerW = width - padding * 2;
  return values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * innerW;
      const y = padding + innerH - ((v - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
