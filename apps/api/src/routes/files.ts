import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth } from "../middleware/require-auth.js";

export const filesRouter = Router();
filesRouter.use(requireAuth);

filesRouter.get("/:id", async (req, res) => {
  const blobId = req.params.id;

  const doc = await prisma.document.findFirst({
    where: { fileBlobId: blobId },
    select: { fileName: true, mimeType: true, linkId: true },
  });
  const cv = doc ? null : await prisma.contractVersion.findFirst({
    where: { fileBlobId: blobId },
    select: { fileName: true, linkId: true },
  });
  const cc = (!doc && !cv) ? await prisma.contractComment.findFirst({
    where: { fileBlobId: blobId },
    select: { fileName: true, linkId: true },
  }) : null;

  const linkId = doc?.linkId ?? cv?.linkId ?? cc?.linkId;
  if (!linkId) { res.status(404).json({ error: "File not found" }); return; }

  const link = await prisma.vendorBuyerLink.findUnique({
    where: { id: linkId },
    select: { buyerOrgId: true, vendorUserId: true },
  });
  if (!link) { res.status(404).json({ error: "File not found" }); return; }

  const isBuyer = req.user!.role === "BUYER" || req.user!.role === "ADMIN";
  const isVendor = req.user!.role === "VENDOR";

  if (isBuyer && req.user!.role !== "ADMIN" && link.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (isVendor && link.vendorUserId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const blob = await prisma.fileBlob.findUnique({ where: { id: blobId } });
  if (!blob) { res.status(404).json({ error: "File not found" }); return; }

  const fileName = doc?.fileName ?? cv?.fileName ?? cc?.fileName ?? "file";
  const mimeType = doc?.mimeType ?? "application/octet-stream";

  const buffer = Buffer.from(blob.data, "base64");
  res.setHeader("Content-Length", buffer.length.toString());
  res.setHeader("Content-Type", mimeType);
  if (req.query.download === "1") {
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  }
  res.send(buffer);
});
