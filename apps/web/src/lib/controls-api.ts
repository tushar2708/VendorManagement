import { http } from "./http.js";

export async function getControls(vendorId: string) {
  const { data } = await http.get(`/api/vendors/${vendorId}/controls`);
  return data;
}

export async function decideControl(vendorId: string, stage: string, input: Record<string, unknown>) {
  const { data } = await http.patch(`/api/vendors/${vendorId}/controls/${stage}`, input);
  return data;
}
