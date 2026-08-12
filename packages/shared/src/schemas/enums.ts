import { z } from "zod";

export const userRoleSchema = z.enum(["BUYER", "VENDOR", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userTierSchema = z.enum(["EXECUTIVE", "LEADERSHIP"]);
export type UserTier = z.infer<typeof userTierSchema>;

export const vendorTypeSchema = z.enum(["PRODUCTION_PART", "INDIRECT_SERVICES"]);
export type VendorType = z.infer<typeof vendorTypeSchema>;

export const requestProcessSchema = z.enum(["RFQ", "NOMINATION", "DIRECT"]);
export type RequestProcess = z.infer<typeof requestProcessSchema>;

export const candidateSourceSchema = z.enum(["MANUAL", "DIRECTORY"]);
export type CandidateSource = z.infer<typeof candidateSourceSchema>;

export const inviteStatusSchema = z.enum(["PENDING", "INVITED", "OPENED", "REGISTERED", "EXPIRED"]);
export type InviteStatus = z.infer<typeof inviteStatusSchema>;

export const approvalStageSchema = z.enum([
  "FINANCIAL_CRIME", "COMPLIANCE", "LEGAL", "IT_INFOSEC",
  "TAX", "PROCUREMENT", "DATA_PRIVACY", "BUSINESS_OWNER",
]);
export type ApprovalStage = z.infer<typeof approvalStageSchema>;

export const slaRiskSchema = z.enum(["ON_TRACK", "AT_RISK", "OVERDUE"]);
export type SlaRisk = z.infer<typeof slaRiskSchema>;

export const requirementStageSchema = z.enum([
  "DRAFT", "CANDIDATES_SELECTED", "INVITES_SENT", "IN_PROGRESS", "CLOSED",
]);
export type RequirementStage = z.infer<typeof requirementStageSchema>;

export const linkStateSchema = z.enum([
  "INVITED", "PREQUAL_IN_PROGRESS", "PREQUAL_SUBMITTED", "PREQUAL_UNDER_REVIEW",
  "PREQUAL_CLEARED", "AWARDED", "FULL_IN_PROGRESS", "FULL_SUBMITTED",
  "FULL_UNDER_REVIEW", "CONTRACTS_IN_PROGRESS", "APPROVED", "ERP_SYNCING",
  "ONBOARDED", "REJECTED", "ON_HOLD", "WITHDRAWN", "ERP_FAILED", "EXPIRED",
]);
export type LinkState = z.infer<typeof linkStateSchema>;

export const linkStageSchema = z.enum(["PREQUAL", "FULL"]);
export type LinkStage = z.infer<typeof linkStageSchema>;

export const actorSideSchema = z.enum(["VENDOR", "BUYER", "SYSTEM"]);
export type ActorSide = z.infer<typeof actorSideSchema>;

export const partySideSchema = z.enum(["VENDOR", "BUYER"]);
export type PartySide = z.infer<typeof partySideSchema>;

export const submissionStatusSchema = z.enum(["IN_PROGRESS", "SUBMITTED"]);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const contractTypeSchema = z.enum([
  "NDA", "MSA", "QUALITY_AGREEMENT", "SUPPLY_AGREEMENT",
  "PRICING_AGREEMENT", "DATA_PROCESSING",
]);
export type ContractType = z.infer<typeof contractTypeSchema>;

export const contractStateSchema = z.enum([
  "DRAFT_PENDING", "DRAFT_UPLOADED", "VENDOR_REVIEW", "CHANGES_REQUESTED",
  "REVISED", "AGREED", "AWAITING_SIGNATURES", "PARTIALLY_EXECUTED", "EXECUTED",
]);
export type ContractState = z.infer<typeof contractStateSchema>;

export const contractVersionKindSchema = z.enum(["DRAFT", "REVISED", "VENDOR_SIGNED", "BUYER_SIGNED"]);
export type ContractVersionKind = z.infer<typeof contractVersionKindSchema>;

export const reviewTaskStatusSchema = z.enum(["PENDING", "APPROVED", "CHANGES_REQUESTED"]);
export type ReviewTaskStatus = z.infer<typeof reviewTaskStatusSchema>;

export const approvalDecisionTypeSchema = z.enum(["APPROVED", "CHANGES_REQUESTED"]);
export type ApprovalDecisionType = z.infer<typeof approvalDecisionTypeSchema>;

export const buyerRoleSchema = z.enum(["OWNER", "QUALITY", "FINANCE", "TAX", "LEGAL"]);
export type BuyerRole = z.infer<typeof buyerRoleSchema>;

export const verificationStatusSchema = z.enum([
  "RUNNING", "PASSED", "FAILED", "NEEDS_REVIEW", "ACCEPTED", "REJECTED",
]);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const verificationCheckTypeSchema = z.enum(["PAN", "GST", "UDYAM", "PENNY_DROP", "GST_FILINGS"]);
export type VerificationCheckType = z.infer<typeof verificationCheckTypeSchema>;

export const documentStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const badgeStateSchema = z.enum(["VERIFIED", "LISTED", "STALE"]);
export type BadgeState = z.infer<typeof badgeStateSchema>;
