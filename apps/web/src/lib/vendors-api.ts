import { http } from "./http.js";

export async function getVendorProfile(vendorId: string) {
  const { data } = await http.get(`/api/vendors/${vendorId}/profile`);
  return data;
}

export async function getVerificationChecks(vendorId: string) {
  const { data } = await http.get(`/api/vendors/${vendorId}/verification-checks`);
  return data;
}

export async function overrideCheck(vendorId: string, checkId: string, action: "accept" | "reject") {
  const { data } = await http.post(`/api/vendors/${vendorId}/verification-checks/${checkId}/override`, { action });
  return data;
}

export async function getVendorDocuments(vendorId: string) {
  const { data } = await http.get(`/api/vendors/${vendorId}/documents`);
  return data;
}

export function downloadDocumentUrl(vendorId: string, docId: string): string {
  return `/api/vendors/${vendorId}/documents/${docId}`;
}

export async function prequalDecision(vendorId: string, input: Record<string, unknown>) {
  const { data } = await http.post(`/api/vendors/${vendorId}/prequal-decision`, input);
  return data;
}
