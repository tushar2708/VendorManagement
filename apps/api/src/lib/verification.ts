import { prisma } from "@vendor-management/db";
import { verificationProvider } from "../providers/index.js";
import { CHECK_SUBJECT_FIELD } from "@vendor-management/shared";

export const CHECK_RESOLVE_MS = 1600;

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
    const result = await verificationProvider.check(check.checkType, {
      value: check.subjectValue ?? "",
    });

    await prisma.verificationCheck.update({
      where: { id: check.id },
      data: {
        status: result.status,
        matchScore: result.matchScore ?? null,
        detail: result.rawResponse,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

function isResolved(status: string): boolean {
  return status === "PASSED" || status === "ACCEPTED";
}

export async function advanceOnCleanPrequal(linkId: string): Promise<void> {
  const checks = await prisma.verificationCheck.findMany({
    where: { linkId },
  });

  if (checks.length === 0 || !checks.every((check) => isResolved(check.status))) {
    return;
  }

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { state: true },
  });

  if (!link || link.state !== "PREQUAL_IN_PROGRESS") {
    return;
  }

  // All checks are resolved and link is in PREQUAL_IN_PROGRESS
  // Link will be transitioned by the calling code if needed
}

export async function recordOverride(
  linkId: string,
  checkId: string,
  action: "accept" | "reject",
  userId: string,
): Promise<void> {
  const check = await prisma.verificationCheck.findFirst({
    where: { id: checkId, linkId },
  });

  if (!check) {
    throw new Error("Check not found");
  }

  const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";

  await prisma.verificationCheck.update({
    where: { id: checkId },
    data: { status: newStatus },
  });
}
