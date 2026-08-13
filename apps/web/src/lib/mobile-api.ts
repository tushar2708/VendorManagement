import { http } from "./http.js";

export async function getMobileStatus() {
  const { data } = await http.get("/api/vendor/mobile");
  return data;
}

export async function startMobileVerification(mobileNumber: string) {
  const { data } = await http.post("/api/vendor/mobile/start", { mobileNumber });
  return data;
}

export async function verifyMobile(code: string) {
  const { data } = await http.post("/api/vendor/mobile/verify", { code });
  return data;
}
