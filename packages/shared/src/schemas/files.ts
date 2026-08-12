import { z } from "zod";

export const UPLOAD_KINDS = ["document", "contract"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const FILE_CONSTRAINTS: Record<UploadKind, { maxBytes: number; allowedMime: string[] }> = {
  document: {
    maxBytes: 5 * 1024 * 1024,
    allowedMime: ["application/pdf", "image/jpeg", "image/png"],
  },
  contract: {
    maxBytes: 10 * 1024 * 1024,
    allowedMime: ["application/pdf"],
  },
};

export const uploadKindSchema = z.enum(["document", "contract"]);

export const uploadResultSchema = z.object({
  fileBlobId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  sha256: z.string(),
});
export type UploadResult = z.infer<typeof uploadResultSchema>;
