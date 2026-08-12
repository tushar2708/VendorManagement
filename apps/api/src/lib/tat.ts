import { LINK_STATE_META } from "@vendor-management/shared";

interface TimelinePoint {
  at: Date;
  state: string;
}

export interface Tat {
  vendorPendingDays: number;
  buyerPendingDays: number;
}

export function computeDualTat(points: TimelinePoint[], now?: Date): Tat {
  const end = now ?? new Date();
  let vendorMs = 0;
  let buyerMs = 0;

  const sorted = [...points].sort((a, b) => a.at.getTime() - b.at.getTime());

  for (let i = 0; i < sorted.length; i++) {
    const nextAt = i + 1 < sorted.length ? sorted[i + 1].at : end;
    const durationMs = nextAt.getTime() - sorted[i].at.getTime();
    const meta = LINK_STATE_META[sorted[i].state];
    if (!meta) continue;

    if (meta.court === "vendor") vendorMs += durationMs;
    else if (meta.court === "buyer") buyerMs += durationMs;
  }

  const msPerDay = 86_400_000;
  return {
    vendorPendingDays: Math.round((vendorMs / msPerDay) * 100) / 100,
    buyerPendingDays: Math.round((buyerMs / msPerDay) * 100) / 100,
  };
}
