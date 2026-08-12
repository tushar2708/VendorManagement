import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth } from "../middleware/require-auth.js";

export const filesRouter = Router();
filesRouter.use(requireAuth);

filesRouter.get("/:id", async (req, res) => {
  const blob = await prisma.fileBlob.findUnique({ where: { id: req.params.id } });
  if (!blob) { res.status(404).json({ error: "File not found" }); return; }

  const buffer = Buffer.from(blob.data, "base64");
  res.setHeader("Content-Length", buffer.length.toString());
  if (req.query.download === "1") {
    res.setHeader("Content-Disposition", `attachment; filename="file"`);
  }
  res.send(buffer);
});
