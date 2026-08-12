import { LINK_PROGRESS_RAIL, LINK_STATE_META } from "@vendor-management/shared";

export { LINK_PROGRESS_RAIL, LINK_STATE_META };

export function getLinkStepIndex(state: string): number {
  const idx = (LINK_PROGRESS_RAIL as readonly string[]).indexOf(state);
  return idx >= 0 ? idx : -1;
}

export function getLinkStepState(stepIndex: number, currentIndex: number): "done" | "active" | "pending" {
  if (currentIndex < 0) return "pending";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export type WhoseCourt = "Buyer" | "Vendor" | "Done";

export function getWhoseCourt(state: string): WhoseCourt {
  const meta = LINK_STATE_META[state];
  if (!meta) return "Buyer";
  if (meta.court === "done") return "Done";
  if (meta.court === "vendor") return "Vendor";
  return "Buyer";
}

export function getOpenDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}
