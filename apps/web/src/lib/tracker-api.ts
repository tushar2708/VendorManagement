import { http } from "./http.js";

export async function getMyTracker() {
  const { data } = await http.get("/api/vendors/me/tracker");
  return data;
}

export async function getVendorTracker(vendorId: string) {
  const { data } = await http.get(`/api/vendors/${vendorId}/tracker`);
  return data;
}
