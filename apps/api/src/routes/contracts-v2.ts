import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate.js";
import { contractUploadSchema, contractCommentInputSchema, VENDOR_TURN_CONTRACT_STATES } from "@vendor-management/shared";
import { assertContractTransition, nextVersionNo, recomputeExecution, advanceLinkIfGateOpen } from "../lib/contract-state.js";

export const contractsRouter = Router();
contractsRouter.use(requireAuth);

contractsRouter.post('/:id/draft', validateBody(contractUploadSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) }, include: { link: true } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
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
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
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
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
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
  res.json({ ok: true });
});

contractsRouter.post('/:id/request-changes', validateBody(contractCommentInputSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
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
  res.json({ ok: true });
});

contractsRouter.post('/:id/agree', async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
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
  res.json({ ok: true });
});

contractsRouter.post('/:id/vendor-sign', validateBody(contractUploadSchema), async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: String(req.params.id) } });
  if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
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
  res.json({ ok: true });
});
