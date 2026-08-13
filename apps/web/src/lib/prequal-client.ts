import {
  fullPrequalSubmissionSchema,
  uploadDocumentSchema,
  type FullPrequalSubmissionInput,
  type PrequalSubmitResult,
  type VendorConsoleStatusResponse,
  type UploadDocumentInput,
  type DocumentCategory,
  type VerificationCheckType,
  type VerificationStatus,
} from "@vendor-management/shared";
import { http } from "./http.js";

/**
 * Screen 3 — Pre-qual + inline verification (vendor lane).
 *
 * This module is the single integration seam for the pre-qual screen. Today the
 * inline verification runs client-side as a realistic simulation so the screen
 * is fully interactive without depending on backend work owned by other screens.
 *
 * When the API endpoints land, only the two functions marked `INTEGRATION POINT`
 * need to change — the screen component never talks to `http` directly.
 */

/** One row in the live verification panel. */
export interface InlineCheck {
  type: VerificationCheckType;
  label: string;
  status: VerificationStatus;
  matchScore: number | null;
  detail: string;
}

export type InlineCheckType = Extract<VerificationCheckType, "PAN" | "GST" | "UDYAM">;

const CHECK_META: Record<InlineCheckType, { label: string; detailPending: string }> = {
  PAN: { label: "PAN — Income Tax", detailPending: "Awaiting entry" },
  GST: { label: "GST — GST Network", detailPending: "Awaiting entry" },
  UDYAM: { label: "Udyam — MSME registry", detailPending: "Optional" },
};

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
// Standard 15-char GSTIN: 2-digit state, 10-char PAN, entity digit, 'Z', checksum.
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

/** Live per-field format validity used for the inline green ticks. */
export function panIsValid(value: string): boolean {
  return PAN_REGEX.test(value.trim().toUpperCase());
}
export function gstinIsValid(value: string): boolean {
  return GSTIN_REGEX.test(value.trim().toUpperCase());
}
export function udyamIsValid(value: string): boolean {
  return UDYAM_REGEX.test(value.trim().toUpperCase());
}

/** The PAN is embedded in the GSTIN at positions 3–12; they must agree. */
export function gstinContainsPan(gstin: string, pan: string): boolean {
  const g = gstin.trim().toUpperCase();
  const p = pan.trim().toUpperCase();
  if (g.length < 12 || p.length < 10) return false;
  return g.slice(2, 12) === p;
}

export interface VerificationSummary {
  checks: InlineCheck[];
  outcome: "clear" | "review" | "blocked";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Build the initial (pending) rows for the checks the vendor can run. */
export function initialChecks(input: {
  panNumber: string;
  gstin: string;
  udyamNumber: string;
}): InlineCheck[] {
  const rows: InlineCheck[] = [
    { type: "PAN", label: CHECK_META.PAN.label, status: "RUNNING", matchScore: null, detail: CHECK_META.PAN.detailPending },
    { type: "GST", label: CHECK_META.GST.label, status: "RUNNING", matchScore: null, detail: CHECK_META.GST.detailPending },
  ];
  if (input.udyamNumber.trim().length > 0) {
    rows.push({ type: "UDYAM", label: CHECK_META.UDYAM.label, status: "RUNNING", matchScore: null, detail: CHECK_META.UDYAM.detailPending });
  }
  return rows;
}

/** Resolve a single check into its final status + detail + score. */
function resolveCheck(
  type: InlineCheckType,
  input: { panNumber: string; gstin: string; udyamNumber: string },
): Pick<InlineCheck, "status" | "matchScore" | "detail"> {
  if (type === "PAN") {
    return panIsValid(input.panNumber)
      ? { status: "PASSED", matchScore: 98, detail: "Name & status matched" }
      : { status: "FAILED", matchScore: 0, detail: "PAN format not recognised" };
  }
  if (type === "GST") {
    if (!gstinIsValid(input.gstin)) {
      return { status: "FAILED", matchScore: 0, detail: "GSTIN format not recognised" };
    }
    if (!gstinContainsPan(input.gstin, input.panNumber)) {
      return { status: "NEEDS_REVIEW", matchScore: 64, detail: "GSTIN does not embed this PAN" };
    }
    return { status: "PASSED", matchScore: 95, detail: "Active · filings up to date" };
  }
  // UDYAM
  return udyamIsValid(input.udyamNumber)
    ? { status: "PASSED", matchScore: 92, detail: "MSME registration matched" }
    : { status: "NEEDS_REVIEW", matchScore: 50, detail: "Could not match Udyam number" };
}

function summarise(checks: InlineCheck[]): VerificationSummary["outcome"] {
  if (checks.some((c) => c.status === "FAILED")) return "blocked";
  if (checks.some((c) => c.status === "NEEDS_REVIEW")) return "review";
  return "clear";
}

/**
 * INTEGRATION POINT — inline auto-verification.
 *
 * Streams each check PENDING → IN_PROGRESS → resolved, invoking `onProgress`
 * after every transition so the UI can animate live. Swap the body for a call
 * to `POST /api/vendor/prequal/verify` (or an SSE stream) when it exists; the
 * `onProgress`/return contract stays identical.
 */
export async function runInlineVerification(
  input: { panNumber: string; gstin: string; udyamNumber: string },
  onProgress: (checks: InlineCheck[]) => void,
): Promise<VerificationSummary> {
  const checks = initialChecks(input);
  onProgress(structuredClone(checks));

  for (let i = 0; i < checks.length; i += 1) {
    checks[i] = { ...checks[i], status: "RUNNING", detail: "Verifying…" };
    onProgress(structuredClone(checks));

    // Staggered, slightly randomised latency so checks resolve one by one.
    await delay(650 + Math.round(Math.random() * 600));

    checks[i] = { ...checks[i], ...resolveCheck(checks[i].type as InlineCheckType, input) };
    onProgress(structuredClone(checks));
  }

  return { checks, outcome: summarise(checks) };
}

/* ------------------------- Capability + documents ------------------------- */

export const PROCESS_OPTIONS = [
  "Casting",
  "CNC machining",
  "Forging",
  "Sheet metal",
  "Injection moulding",
  "Assembly",
  "Heat treatment",
  "Surface coating",
] as const;

export const CERTIFICATION_OPTIONS = [
  "IATF 16949",
  "ISO 9001",
  "ISO 14001",
  "ISO 45001",
  "AS9100",
] as const;

/** The three documents the supplier must scan for pre-qual. */
export interface RequiredDoc {
  key: "GST" | "UDYAM" | "PAN";
  label: string;
  category: DocumentCategory;
}
export const REQUIRED_DOCS: RequiredDoc[] = [
  { key: "GST", label: "GST registration certificate", category: "STATUTORY" },
  { key: "UDYAM", label: "Udyam registration", category: "STATUTORY" },
  { key: "PAN", label: "Company PAN card", category: "CAPABILITY" },
];

export const MAX_DOC_BYTES = 1_048_576; // 1 MB — matches the shared upload schema.
export const ALLOWED_DOC_MIME = ["application/pdf", "image/png", "image/jpeg"];

export class PrequalFileError extends Error {}

/**
 * Read a picked file into an upload payload: enforce the ≤1 MB + allowed-type
 * rules, then Base64-encode it (prefix stripped) to match how documents are
 * stored in Neon. Throws `PrequalFileError` with a user-facing message.
 */
export async function readFileAsUpload(
  file: File,
  category: DocumentCategory,
): Promise<UploadDocumentInput> {
  if (!ALLOWED_DOC_MIME.includes(file.type)) {
    throw new PrequalFileError("Use a PDF, PNG, or JPG file.");
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new PrequalFileError("File is over the 1 MB limit.");
  }
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new PrequalFileError("Could not read that file."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1)); // strip "data:...;base64,"
    };
    reader.readAsDataURL(file);
  });
  return uploadDocumentSchema.parse({
    name: file.name,
    category,
    mimeType: file.type,
    sizeBytes: file.size,
    data,
  });
}

export interface PrequalStatusDoc {
  id: string;
  name: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  uploadedAt: string;
}
export interface PrequalStatus {
  submitted: boolean;
  vendorId?: string;
  category?: string | null;
  certifications?: string[];
  documents: PrequalStatusDoc[];
}

/** Read the signed-in vendor's current pre-qual status (documents readback). */
export async function getVendorStatus(): Promise<VendorConsoleStatusResponse | null> {
  try {
    const response = await http.get("/api/vendor/status");
    return response.data as VendorConsoleStatusResponse;
  } catch {
    return null;
  }
}

/**
 * Final submission — persists identity + capability + documents to the API,
 * which writes them to Neon in a single transaction. Validates the payload
 * against the shared schema first, then throws if the request fails so the
 * screen can surface the error.
 */
export async function submitPrequal(input: FullPrequalSubmissionInput): Promise<PrequalSubmitResult> {
  const parsed = fullPrequalSubmissionSchema.parse(input);
  const response = await http.post("/api/vendor/prequal", parsed);
  return response.data as PrequalSubmitResult;
}
