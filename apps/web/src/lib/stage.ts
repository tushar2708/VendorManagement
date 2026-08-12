import { LINK_STATE_META } from "@vendor-management/shared";

export function getStatusLabel(state: string): string {
  return LINK_STATE_META[state]?.label ?? state;
}

export function getStatusVariant(state: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const meta = LINK_STATE_META[state];
  if (!meta) return "neutral";
  if (meta.court === "done") {
    if (state === "ONBOARDED") return "success";
    if (state === "REJECTED" || state === "EXPIRED" || state === "ERP_FAILED") return "danger";
    return "neutral";
  }
  if (meta.court === "vendor") return "warning";
  if (meta.court === "buyer") return "info";
  return "neutral";
}
