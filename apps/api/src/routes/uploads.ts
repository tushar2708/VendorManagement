import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/require-auth.js";
import { storeUpload, FileValidationError } from "../lib/files.js";
import { uploadKindSchema } from "@vendor-management/shared";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post("/", upload.single("file"), async (req, res) => {
  const kindParse = uploadKindSchema.safeParse(req.body.kind);
  if (!kindParse.success) { res.status(400).json({ error: "Invalid upload kind" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

  try {
    const result = await storeUpload(kindParse.data, req.file);
    res.json(result);
  } catch (e) {
    if (e instanceof FileValidationError) { res.status(400).json({ error: e.message }); return; }
    throw e;
  }
});
