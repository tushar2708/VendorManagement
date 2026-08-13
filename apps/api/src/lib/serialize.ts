import type { Prisma } from '@prisma/client';
import {
  candidateSchema,
  documentResponseSchema,
  type Candidate,
  type DocumentResponse,
  verificationCheckResponseSchema,
  type VerificationCheckResponse,
} from '@vendor-management/shared';

type DocumentRecord = Prisma.DocumentGetPayload<object>;
type VerificationCheckRecord = Prisma.VerificationCheckGetPayload<object>;
type CandidateRecord = Prisma.RequestCandidateGetPayload<{
  include: { link: true; invitation: true };
}>;
type VendorRequestRecord = Prisma.VendorRequestGetPayload<object>;

export function toDocumentResponse(record: DocumentRecord): DocumentResponse {
  return documentResponseSchema.parse({
    id: record.id,
    checklistItemKey: record.checklistItemKey ?? '',
    fileName: record.fileName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    fileBlobId: record.fileBlobId,
    status: record.status,
    rejectionReason: record.rejectionReason ?? null,
    uploadedAt: record.uploadedAt.toISOString(),
    linkId: record.linkId,
  });
}

export function toVerificationCheckResponse(
  record: VerificationCheckRecord,
): VerificationCheckResponse {
  return verificationCheckResponseSchema.parse({
    id: record.id,
    checkType: record.checkType,
    status: record.status,
    matchScore: record.matchScore ?? null,
    detail: record.detail ?? null,
    ranAt: record.ranAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  });
}

export function toCandidateResponse(record: CandidateRecord): Candidate {
  return candidateSchema.parse({
    id: record.id,
    source: record.source,
    legalName: record.legalName ?? null,
    contactEmail: record.contactEmail ?? null,
    contactPhone: record.contactPhone ?? null,
    pan: record.pan ?? null,
    gstin: record.gstin ?? null,
    city: record.city ?? null,
    state: record.state ?? null,
    inviteStatus: record.invitation?.status ?? 'PENDING',
    link: record.link
      ? {
          id: record.link.id,
          state: record.link.state,
          prequalScore: record.link.prequalScore ?? null,
        }
      : null,
    createdAt: record.createdAt.toISOString(),
  });
}

export function toVendorRequestResponse(
  record: VendorRequestRecord,
): Record<string, unknown> {
  return {
    id: record.id,
    requestNumber: record.requestNumber,
    title: record.title ?? null,
    category: record.category,
    stage: record.stage,
    process: record.process,
    vendorType: record.vendorType,
    processCategories: record.processCategories ?? [],
    plantLocation: record.plantLocation ?? null,
    targetAwardDate: record.targetAwardDate?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
