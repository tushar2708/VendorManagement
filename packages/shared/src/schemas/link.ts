import { z } from "zod";
import { linkStateSchema, linkStageSchema } from "./enums.js";
import { contractDTOSchema } from "./contract-v2.js";

export const LINK_STATES = linkStateSchema.options;

export type Court = "vendor" | "buyer" | "system" | "done";

export const LINK_STATE_META: Record<string, { label: string; court: Court }> = {
  INVITED:                 { label: "Invited",                court: "vendor" },
  PREQUAL_IN_PROGRESS:     { label: "Pre-qual in progress",   court: "vendor" },
  PREQUAL_SUBMITTED:       { label: "Pre-qual submitted",     court: "buyer" },
  PREQUAL_UNDER_REVIEW:    { label: "Pre-qual under review",  court: "buyer" },
  PREQUAL_CLEARED:         { label: "Pre-qual cleared",       court: "buyer" },
  AWARDED:                 { label: "Awarded",                 court: "vendor" },
  FULL_IN_PROGRESS:        { label: "Full pack in progress",  court: "vendor" },
  FULL_SUBMITTED:          { label: "Full pack submitted",     court: "buyer" },
  FULL_UNDER_REVIEW:       { label: "Full pack under review", court: "buyer" },
  CONTRACTS_IN_PROGRESS:   { label: "Contracts in progress",  court: "buyer" },
  APPROVED:                { label: "Approved",                court: "buyer" },
  ERP_SYNCING:             { label: "ERP syncing",             court: "system" },
  ONBOARDED:               { label: "Onboarded",               court: "done" },
  REJECTED:                { label: "Rejected",                court: "done" },
  ON_HOLD:                 { label: "On hold",                 court: "done" },
  WITHDRAWN:               { label: "Withdrawn",               court: "done" },
  ERP_FAILED:              { label: "ERP failed",              court: "system" },
  EXPIRED:                 { label: "Expired",                 court: "done" },
};

export const LINK_PROGRESS_RAIL = [
  "INVITED", "PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED",
  "PREQUAL_CLEARED", "AWARDED", "FULL_IN_PROGRESS",
  "CONTRACTS_IN_PROGRESS", "APPROVED", "ONBOARDED",
] as const;

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "multiselect";
  required: boolean;
  pattern?: string;
  options?: string[];
}

export interface DocItemDef {
  key: string;
  label: string;
  required: boolean;
  accept: string[];
}

export interface Checklist {
  fields: FieldDef[];
  documents: DocItemDef[];
}

const PREQUAL_FIELDS: FieldDef[] = [
  { key: "legalName", label: "Legal name", type: "text", required: true },
  { key: "pan", label: "PAN", type: "text", required: true, pattern: "^[A-Z]{5}[0-9]{4}[A-Z]$" },
  { key: "gstin", label: "GSTIN", type: "text", required: true, pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$" },
  { key: "udyam", label: "Udyam number", type: "text", required: false },
  { key: "contactEmail", label: "Contact email", type: "email", required: true },
  { key: "contactPhone", label: "Phone", type: "text", required: false },
  { key: "city", label: "City", type: "text", required: true },
  { key: "state", label: "State", type: "text", required: true },
];

const PREQUAL_DOCS: DocItemDef[] = [
  { key: "pan_card", label: "PAN card copy", required: true, accept: ["application/pdf", "image/jpeg", "image/png"] },
  { key: "gst_certificate", label: "GST certificate", required: true, accept: ["application/pdf"] },
  { key: "incorporation_cert", label: "Certificate of incorporation", required: false, accept: ["application/pdf"] },
];

const FULL_BASE_FIELDS: FieldDef[] = [
  { key: "bankAccountName", label: "Bank account name", type: "text", required: true },
  { key: "bankAccountNumber", label: "Bank account number", type: "text", required: true },
  { key: "bankIfsc", label: "IFSC code", type: "text", required: true },
  { key: "bankBranch", label: "Bank branch", type: "text", required: false },
  { key: "authorizedSignatory", label: "Authorized signatory", type: "text", required: true },
  { key: "signatoryDesignation", label: "Signatory designation", type: "text", required: true },
  { key: "annualTurnover", label: "Annual turnover (INR)", type: "number", required: true },
  { key: "employeeCount", label: "Employee count", type: "number", required: false },
];

const FULL_BASE_DOCS: DocItemDef[] = [
  { key: "cancelled_cheque", label: "Cancelled cheque", required: true, accept: ["application/pdf", "image/jpeg", "image/png"] },
  { key: "gst_returns", label: "Last 3 months GST returns", required: true, accept: ["application/pdf"] },
  { key: "financial_statements", label: "Audited financial statements", required: true, accept: ["application/pdf"] },
  { key: "quality_certifications", label: "Quality certifications (ISO, etc.)", required: false, accept: ["application/pdf"] },
  { key: "msme_certificate", label: "MSME certificate", required: false, accept: ["application/pdf"] },
];

export function checklistFor(stage: string, _processCategories: string[]): Checklist {
  if (stage === "PREQUAL") {
    return { fields: PREQUAL_FIELDS, documents: PREQUAL_DOCS };
  }
  return { fields: FULL_BASE_FIELDS, documents: FULL_BASE_DOCS };
}

export const redeemInviteSchema = z.object({
  token: z.string().min(1),
});
export type RedeemInviteInput = z.infer<typeof redeemInviteSchema>;

export const setVendorPasswordSchema = z.object({
  password: z.string().min(8),
});
export type SetVendorPasswordInput = z.infer<typeof setVendorPasswordSchema>;

export const saveFieldsSchema = z.object({
  fields: z.record(z.string(), z.string().nullable()),
});
export type SaveFieldsInput = z.infer<typeof saveFieldsSchema>;

export const attachDocumentSchema = z.object({
  checklistItemKey: z.string().min(1),
  fileBlobId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type AttachDocumentInput = z.infer<typeof attachDocumentSchema>;

export interface Tat {
  vendorPendingDays: number;
  buyerPendingDays: number;
}

export type { ContractDTO } from "./contract-v2.js";

export const vendorLinkDTOSchema = z.object({
  id: z.string(),
  state: linkStateSchema,
  stage: linkStageSchema.nullable(),
  requirementTitle: z.string(),
  processCategories: z.array(z.string()),
  buyerOrgName: z.string(),
  buyerContact: z.object({
    name: z.string().nullable(),
    email: z.string(),
  }),
  fields: z.record(z.string(), z.string().nullable()),
  documents: z.array(z.object({
    id: z.string(),
    checklistItemKey: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    fileBlobId: z.string(),
    status: z.string(),
    uploadedAt: z.string(),
  })),
  contracts: z.array(contractDTOSchema),
  prequalScore: z.number().nullable(),
  erpVendorCode: z.string().nullable(),
  tat: z.object({
    vendorPendingDays: z.number(),
    buyerPendingDays: z.number(),
  }),
  createdAt: z.string(),
});
export type VendorLinkDTO = z.infer<typeof vendorLinkDTOSchema>;

export const redeemResultSchema = z.object({
  needsPassword: z.boolean(),
  linkId: z.string(),
  requirementTitle: z.string(),
  email: z.string(),
});
export type RedeemResult = z.infer<typeof redeemResultSchema>;
