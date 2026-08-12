import crypto from "node:crypto";
import { prisma } from "@vendor-management/db";
import { CHECK_SUBJECT_FIELD } from "@vendor-management/shared";

export const CHECK_RESOLVE_MS = 1600;

interface Resolution {
  status: "PASSED" | "FAILED" | "NEEDS_REVIEW";
  matchScore: number;
  detail: Record<string, unknown>;
}

export function resolveCheck(checkType: string, subject: string): Resolution {
  const hash = crypto.createHash("sha256").update(checkType + subject).digest();
  const byte = hash[0] % 10;

  if (byte === 0) {
    return { status: "FAILED", matchScore: 40 + (hash[1] % 15), detail: { reason: "No match found" } };
  }
  if (byte <= 2) {
    return { status: "NEEDS_REVIEW", matchScore: 65 + (hash[1] % 12), detail: { reason: "Partial match" } };
  }
  return { status: "PASSED", matchScore: 88 + (hash[1] % 12), detail: { reason: "Verified" } };
}

export function subjectForCheck(checkType: string, fields: Record<string, string | null>): string {
  const fieldKey = CHECK_SUBJECT_FIELD[checkType];
  return fieldKey ? (fields[fieldKey] ?? "") : "";
}

export async function resolveDueChecks(linkId: string): Promise<void> {
  const cutoff = new Date(Date.now() - CHECK_RESOLVE_MS);
  const checks = await prisma.verificationCheck.findMany({
    where: { linkId, status: "RUNNING", ranAt: { lte: cutoff } },
  });

  for (const check of checks) {
    const result = resolveCheck(check.checkType, check.subjectValue ?? "");
    await prisma.verificationCheck.update({
      where: { id: check.id },
      data: {
        status: result.status,
        matchScore: result.matchScore,
        detail: result.detail,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
