import crypto from "node:crypto";
import { prisma } from "@vendor-management/db";
import { FILE_CONSTRAINTS, type UploadKind } from "@vendor-management/shared";

export class FileValidationError extends Error {}

export interface UploadResult {
  fileBlobId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export async function storeUpload(
  kind: UploadKind,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
): Promise<UploadResult> {
  const constraints = FILE_CONSTRAINTS[kind];
  if (!constraints.allowedMime.includes(file.mimetype)) {
    throw new FileValidationError(`MIME type ${file.mimetype} not allowed for ${kind}`);
  }
  if (file.size > constraints.maxBytes) {
    throw new FileValidationError(`File too large: ${file.size} > ${constraints.maxBytes}`);
  }

  const base64 = file.buffer.toString("base64");
  const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");

  const blob = await prisma.fileBlob.create({
    data: { data: base64, sha256 },
  });

  return {
    fileBlobId: blob.id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    sha256,
  };
}
