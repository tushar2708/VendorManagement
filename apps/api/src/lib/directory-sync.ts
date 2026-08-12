import { BadgeState } from "@prisma/client";

export async function promoteOnboardedToDirectory(tx: any, linkId: string): Promise<void> {
  const link = await tx.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: { candidate: true },
  });
  if (!link) return;

  await upsertDirectoryVendor(tx, {
    legalName: link.candidate.legalName ?? "",
    contactEmail: link.candidate.contactEmail ?? "",
    pan: link.candidate.pan,
    primaryGstin: link.candidate.gstin,
    city: link.candidate.city,
    state: link.candidate.state,
    processTags: [],
    certificationTags: [],
    badgeState: "VERIFIED",
  });
}

export async function listWarmCandidates(tx: any, requirementId: string): Promise<void> {
  const candidates = await tx.requestCandidate.findMany({
    where: { requestId: requirementId },
    include: { link: { select: { state: true } } },
  });

  for (const c of candidates) {
    if (c.link?.state === "PREQUAL_CLEARED") {
      await upsertDirectoryVendor(tx, {
        legalName: c.legalName ?? "",
        contactEmail: c.contactEmail ?? "",
        pan: c.pan,
        primaryGstin: c.gstin,
        city: c.city,
        state: c.state,
        processTags: [],
        certificationTags: [],
        badgeState: "LISTED",
      });
    }
  }
}

interface DirectoryEntry {
  legalName: string;
  contactEmail: string;
  pan: string | null;
  primaryGstin: string | null;
  city: string | null;
  state: string | null;
  processTags: string[];
  certificationTags: string[];
  badgeState: string;
}

async function upsertDirectoryVendor(tx: any, entry: DirectoryEntry): Promise<void> {
  if (!entry.contactEmail) return;

  const existing = await tx.directoryVendor.findFirst({
    where: { contactEmail: { equals: entry.contactEmail, mode: "insensitive" } },
  });

  if (existing) {
    if (existing.badgeState === "VERIFIED" && entry.badgeState === "LISTED") return;
    await tx.directoryVendor.update({
      where: { id: existing.id },
      data: {
        legalName: entry.legalName || existing.legalName,
        pan: entry.pan || existing.pan,
        primaryGstin: entry.primaryGstin || existing.primaryGstin,
        city: entry.city || existing.city,
        state: entry.state || existing.state,
        badgeState: entry.badgeState as BadgeState,
      },
    });
  } else {
    await tx.directoryVendor.create({
      data: {
        legalName: entry.legalName,
        contactEmail: entry.contactEmail,
        pan: entry.pan,
        primaryGstin: entry.primaryGstin,
        city: entry.city,
        state: entry.state,
        processTags: entry.processTags,
        certificationTags: entry.certificationTags,
        badgeState: entry.badgeState as BadgeState,
      },
    });
  }
}
