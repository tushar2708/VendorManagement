import { http } from "./http.js";

export async function getScoring(requestId: string) {
  const { data } = await http.get(`/api/requests/${requestId}/scoring`);
  return data;
}

export async function upsertQuotation(requestId: string, vendorId: string, input: Record<string, unknown>) {
  const { data } = await http.put(`/api/requests/${requestId}/quotations/${vendorId}`, input);
  return data;
}
