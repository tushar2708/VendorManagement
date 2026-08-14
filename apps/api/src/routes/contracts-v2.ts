import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate.js";
import { contractUploadSchema, contractCommentInputSchema, VENDOR_TURN_CONTRACT_STATES, contractSetFor } from "@vendor-management/shared";
import { assertContractTransition, nextVersionNo, recomputeExecution, advanceLinkIfGateOpen } from "../lib/contract-state.js";
import { trackServer } from "../lib/analytics.js";

export const contractsRouter = Router();
contractsRouter.use(requireAuth);

contractsRouter.get('/:vendorId', async (req, res) => {
  const linkId = String(req.params.vendorId);
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: { requirement: true, candidate: true },
  });
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }

  const vendorType = link.requirement.vendorType;
  const templateSet = contractSetFor(vendorType);
  const existingContracts = await prisma.contract.findMany({
    where: { linkId },
    include: { currentVersion: true, comments: true, versions: true },
  });

  const contractMap = new Map(existingContracts.map((c) => [c.contractType, c]));
  const contracts = templateSet.map((template) => {
    const existing = contractMap.get(template.code as any);
    const draftVersions = existing?.currentVersion ? 1 : 0;
    const buyerSignedVersion = existing?.versions?.find((v) => v.kind === 'BUYER_SIGNED');
    const vendorSignedVersion = existing?.versions?.find((v) => v.kind === 'VENDOR_SIGNED');
    const buyerCopy = buyerSignedVersion?.fileBlobId ?? null;
    const vendorCopy = vendorSignedVersion?.fileBlobId ?? null;
    const isExecuted = existing?.state === 'EXECUTED';

    return {
      code: template.code,
      title: template.title,
      contractId: existing?.id ?? null,
      status: existing?.state ?? 'DRAFT_PENDING',
      draftName: existing?.currentVersion?.fileName ?? null,
      rounds: draftVersions,
      buyerCopy,
      vendorCopy,
      isExecuted,
      comments: existing?.comments ?? [],
    };
  });

  const executedCount = contracts.filter((c) => c.isExecuted).length;
  const totalCount = contracts.length;
  const canPushToErp = totalCount > 0 && executedCount === totalCount;

  res.json({
    vendorId: linkId,
    vendorName: link.candidate.legalName ?? '',
    requestId: link.requestId,
    contracts,
    executedCount,
    totalCount,
    canPushToErp,
  });
});

contractsRouter.post('/:vendorId/finalise', async (req, res) => {
  const linkId = String(req.params.vendorId);
  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    include: { requirement: true },
  });
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }

  const vendorType = link.requirement.vendorType;
  const templateSet = contractSetFor(vendorType);
  const contracts = await prisma.contract.findMany({
    where: { linkId },
  });

  const contractMap = new Map(contracts.map((c) => [c.contractType, c]));
  const outstanding = templateSet.filter((template) => {
    const contract = contractMap.get(template.code as any);
    return !contract || contract.state !== 'EXECUTED';
  });

  if (outstanding.length > 0) {
    res.status(409).json({
      error: 'Not all contracts executed',
      outstanding: outstanding.map((t) => ({ code: t.code, title: t.title })),
    });
    return;
  }

  await advanceLinkIfGateOpen(linkId);

  trackServer('contracts_finalised', {
    distinct_id: req.user!.userId,
    link_id: linkId,
    executed_count: templateSet.length,
    total_count: templateSet.length,
    ...(link.buyerOrgId ? { buyer_org: link.buyerOrgId } : {}),
  });

  res.json({ ok: true });
});

contractsRouter.post('/:id/draft', validateBody(contractUploadSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

  const link = contract.link;
  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";
  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  if (contract.state !== "DRAFT_PENDING") { res.status(409).json({ error: "Not in DRAFT_PENDING state" }); return; }

  const versionNo = await nextVersionNo(prisma, contract.id);
  await prisma.$transaction(async (tx) => {
    const version = await tx.contractVersion.create({
      data: {
        contractId: contract.id, linkId: contract.linkId, versionNo,
        fileBlobId: req.body.fileBlobId, fileName: req.body.fileName,
        uploadedBySide: "BUYER", kind: "DRAFT",
      },
    });
    await tx.contract.update({
      where: { id: contract.id },
      data: { state: "DRAFT_UPLOADED", currentVersionId: version.id, dispatchedAt: new Date() },
    });
  });
  res.json({ ok: true });
});

contractsRouter.post('/:id/revise', validateBody(contractUploadSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

  const link = contract.link;
  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";
  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  if (contract.state !== "CHANGES_REQUESTED") { res.status(409).json({ error: "Not in CHANGES_REQUESTED state" }); return; }

  const versionNo = await nextVersionNo(prisma, contract.id);
  await prisma.$transaction(async (tx) => {
    const version = await tx.contractVersion.create({
      data: {
        contractId: contract.id, linkId: contract.linkId, versionNo,
        fileBlobId: req.body.fileBlobId, fileName: req.body.fileName,
        uploadedBySide: "BUYER", kind: "REVISED",
        supersedesVersionId: contract.currentVersionId,
      },
    });
    await tx.contract.update({
      where: { id: contract.id },
      data: { state: "REVISED", currentVersionId: version.id },
    });
  });
  res.json({ ok: true });
});

contractsRouter.post('/:id/buyer-sign', validateBody(contractUploadSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

  const link = contract.link;
  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";
  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  if (contract.state !== "AWAITING_SIGNATURES" && contract.state !== "PARTIALLY_EXECUTED") {
    res.status(409).json({ error: "Not in signing state" }); return;
  }

  const versionNo = await nextVersionNo(prisma, contract.id);
  await prisma.$transaction(async (tx) => {
    const version = await tx.contractVersion.create({
      data: {
        contractId: contract.id, linkId: contract.linkId, versionNo,
        fileBlobId: req.body.fileBlobId, fileName: req.body.fileName,
        uploadedBySide: "BUYER", kind: "BUYER_SIGNED",
      },
    });
    await tx.contract.update({
      where: { id: contract.id },
      data: { currentVersionId: version.id },
    });
    await recomputeExecution(tx, contract.id);
  });
  await advanceLinkIfGateOpen(contract.linkId);

  trackServer('contract_signed', {
    distinct_id: req.user!.userId,
    contract_id: contract.id,
    contract_type: contract.contractType,
    side: 'BUYER',
    link_id: contract.linkId,
    ...(link.buyerOrgId ? { buyer_org: link.buyerOrgId } : {}),
  });

  res.json({ ok: true });
});

contractsRouter.post('/:id/request-changes', validateBody(contractCommentInputSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

  const link = contract.link;
  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";
  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const vendorTurnStates: readonly string[] = VENDOR_TURN_CONTRACT_STATES;
  if (!vendorTurnStates.includes(contract.state)) {
    res.status(409).json({ error: "Not vendor's turn" }); return;
  }

  await prisma.$transaction(async (tx) => {
    if (contract.currentVersionId) {
      await tx.contractComment.create({
        data: {
          contractVersionId: contract.currentVersionId,
          contractId: contract.id,
          linkId: contract.linkId,
          authorSide: "VENDOR",
          body: req.body.body,
          fileBlobId: req.body.fileBlobId ?? null,
          fileName: req.body.fileName ?? null,
        },
      });
    }
    await tx.contract.update({ where: { id: contract.id }, data: { state: "CHANGES_REQUESTED" } });
  });

  trackServer('contract_change_requested', {
    distinct_id: req.user!.userId,
    contract_id: contract.id,
    contract_type: contract.contractType,
    link_id: contract.linkId,
    ...(link.vendorOrgId ? { vendor_org: link.vendorOrgId } : {}),
  });

  res.json({ ok: true });
});

contractsRouter.post('/:id/agree', async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

  const link = contract.link;
  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";
  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const vendorTurnStates: readonly string[] = VENDOR_TURN_CONTRACT_STATES;
  if (!vendorTurnStates.includes(contract.state)) {
    res.status(409).json({ error: "Not vendor's turn" }); return;
  }

  await prisma.$transaction(async (tx) => {
    assertContractTransition(contract.state, "AGREED");
    await tx.contract.update({ where: { id: contract.id }, data: { state: "AGREED" } });
    assertContractTransition("AGREED", "AWAITING_SIGNATURES");
    await tx.contract.update({ where: { id: contract.id }, data: { state: "AWAITING_SIGNATURES" } });
  });

  trackServer('contract_agreed', {
    distinct_id: req.user!.userId,
    contract_id: contract.id,
    contract_type: contract.contractType,
    link_id: contract.linkId,
    ...(link.vendorOrgId ? { vendor_org: link.vendorOrgId } : {}),
  });

  res.json({ ok: true });
});

contractsRouter.post('/:id/vendor-sign', validateBody(contractUploadSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

  const link = contract.link;
  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";
  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  if (contract.state !== "AWAITING_SIGNATURES" && contract.state !== "PARTIALLY_EXECUTED") {
    res.status(409).json({ error: "Not in signing state" }); return;
  }

  const versionNo = await nextVersionNo(prisma, contract.id);
  await prisma.$transaction(async (tx) => {
    const version = await tx.contractVersion.create({
      data: {
        contractId: contract.id, linkId: contract.linkId, versionNo,
        fileBlobId: req.body.fileBlobId, fileName: req.body.fileName,
        uploadedBySide: "VENDOR", kind: "VENDOR_SIGNED",
      },
    });
    await tx.contract.update({
      where: { id: contract.id },
      data: { currentVersionId: version.id },
    });
    await recomputeExecution(tx, contract.id);
  });
  await advanceLinkIfGateOpen(contract.linkId);

  trackServer('contract_signed', {
    distinct_id: req.user!.userId,
    contract_id: contract.id,
    contract_type: contract.contractType,
    side: 'VENDOR',
    link_id: contract.linkId,
    ...(link.vendorOrgId ? { vendor_org: link.vendorOrgId } : {}),
  });

  res.json({ ok: true });
});
