import { http } from "./http.js";

export async function getMyFullPack() {
  const { data } = await http.get("/api/vendors/me/full-pack");
  return data;
}

export async function getVendorFullPack(vendorId: string) {
  const { data } = await http.get(`/api/vendors/${vendorId}/full-pack`);
  return data;
}

export async function uploadChecklistFile(code: string, input: Record<string, unknown>) {
  const { data } = await http.put(`/api/vendors/me/full-pack/${code}`, input);
  return data;
}

export async function submitFullPack() {
  const { data } = await http.post("/api/vendors/me/full-pack", { acceptDeclarations: true });
  return data;
}
