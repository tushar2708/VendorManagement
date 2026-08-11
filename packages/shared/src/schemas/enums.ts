import { z } from "zod";

export const userRoleSchema = z.enum(["BUYER", "VENDOR", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const vendorTypeSchema = z.enum(["PRODUCTION_PART", "INDIRECT_SERVICES"]);
export type VendorType = z.infer<typeof vendorTypeSchema>;

export const requestProcessSchema = z.enum(["RFQ", "NOMINATION", "DIRECT"]);
export type RequestProcess = z.infer<typeof requestProcessSchema>;

export const requestStatusSchema = z.enum([
  "DRAFT", "CANDIDATES_SELECTED", "INVITES_DISPATCHED", "PREQUAL_IN_PROGRESS",
  "PREQUAL_COMPLETE", "AWARDED", "FULL_PACK_SUBMITTED", "DEEP_VERIFICATION",
  "APPROVALS_IN_PROGRESS", "CONTRACT_REVIEW", "ERP_PUSH", "COMPLETED", "CANCELLED"
]);
export type RequestStatus = z.infer<typeof requestStatusSchema>;

export const inviteChannelSchema = z.enum(["EMAIL", "WHATSAPP"]);
export type InviteChannel = z.infer<typeof inviteChannelSchema>;

export const inviteStatusSchema = z.enum(["PENDING", "INVITED", "OPENED", "REGISTERED", "EXPIRED"]);
export type InviteStatus = z.infer<typeof inviteStatusSchema>;

export const candidateStatusSchema = z.enum([
  "SELECTED", "INVITED", "PREQUAL_SUBMITTED", "APPROVED", "REJECTED", "AWARDED", "WARM_POOL"
]);
export type CandidateStatus = z.infer<typeof candidateStatusSchema>;

export const verificationCheckTypeSchema = z.enum([
  "PAN", "GSTIN", "UDYAM", "BANK_PENNY_DROP", "COMPANY_FILINGS", "DIRECTOR_UBO_SCREENING"
]);
export type VerificationCheckType = z.infer<typeof verificationCheckTypeSchema>;

export const verificationCheckStatusSchema = z.enum([
  "PENDING", "IN_PROGRESS", "PASS", "PARTIAL_MATCH", "FAIL", "MANUAL_OVERRIDE"
]);
export type VerificationCheckStatus = z.infer<typeof verificationCheckStatusSchema>;

export const documentCategorySchema = z.enum(["BANK_DETAILS", "STATUTORY", "LEGAL", "IDENTITY", "CAPABILITY"]);
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const documentStatusSchema = z.enum(["PENDING", "UPLOADED", "VERIFIED", "REJECTED"]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const approvalStageSchema = z.enum(["FINANCE", "LEGAL", "IT_SECURITY", "QUALITY"]);
export type ApprovalStage = z.infer<typeof approvalStageSchema>;

export const approvalStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "ESCALATED"]);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

export const slaRiskSchema = z.enum(["ON_TRACK", "AT_RISK", "OVERDUE"]);
export type SlaRisk = z.infer<typeof slaRiskSchema>;

export const contractStatusSchema = z.enum([
  "DRAFT", "BUYER_REVIEW", "VENDOR_REVIEW", "AWAITING_BUYER_SIGNATURE", "AWAITING_VENDOR_SIGNATURE", "SIGNED", "VOIDED"
]);
export type ContractStatus = z.infer<typeof contractStatusSchema>;

export const erpPushStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "SUCCESS", "FAILED"]);
export type ErpPushStatus = z.infer<typeof erpPushStatusSchema>;

export const activityActionSchema = z.enum([
  "REQUEST_CREATED", "REQUEST_UPDATED", "CANDIDATES_SELECTED", "INVITES_DISPATCHED",
  "INVITE_OPENED", "VENDOR_REGISTERED", "PREQUAL_SUBMITTED", "VERIFICATION_STARTED",
  "VERIFICATION_COMPLETED", "PREQUAL_APPROVED", "PREQUAL_REJECTED", "VENDOR_AWARDED",
  "WARM_POOL_ADDED", "FULL_PACK_SUBMITTED", "DOCUMENT_UPLOADED", "DOCUMENT_VERIFIED",
  "DEEP_VERIFICATION_STARTED", "DEEP_VERIFICATION_COMPLETED", "APPROVAL_SUBMITTED",
  "APPROVAL_APPROVED", "APPROVAL_REJECTED", "APPROVAL_ESCALATED", "CONTRACT_UPLOADED",
  "CONTRACT_COMMENT_ADDED", "CONTRACT_SIGNED", "ERP_PUSH_INITIATED", "ERP_PUSH_COMPLETED",
  "REMINDER_SENT", "ISSUE_FLAGGED", "VENDOR_ACTIVATED"
]);
export type ActivityAction = z.infer<typeof activityActionSchema>;
