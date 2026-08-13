import { Router } from "express";
import { prisma } from "@vendor-management/db";
import { requireAuth, requireRole } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate.js";
import { createTeamMemberSchema, updateTeamMemberSchema } from "@vendor-management/shared";
import { auth } from "./auth.js";

export const teamRouter = Router();
teamRouter.use(requireAuth);
teamRouter.use(requireRole("BUYER"));

teamRouter.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { buyerOrgId: req.user!.buyerOrgId! },
    select: { id: true, email: true, name: true, buyerRole: true },
  });
  res.json(users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.name,
    role: u.buyerRole,
    isSelf: u.id === req.user!.userId,
  })));
});

teamRouter.post("/", validateBody(createTeamMemberSchema), async (req, res) => {
  if (req.user!.buyerRole !== "OWNER") { res.status(403).json({ error: "Only OWNER can add team members" }); return; }

  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) { res.status(409).json({ error: "Email already taken" }); return; }

  try {
    const result = await auth.api.signUpEmail({
      body: { email: req.body.email, password: req.body.password, name: req.body.fullName },
    });
    const userId = (result as any).user?.id;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "BUYER", buyerOrgId: req.user!.buyerOrgId, buyerRole: req.body.role as any },
      });
    }
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Failed to create team member" });
  }
});

teamRouter.patch("/:id", validateBody(updateTeamMemberSchema), async (req, res) => {
  if (req.user!.buyerRole !== "OWNER") { res.status(403).json({ error: "Only OWNER can edit team members" }); return; }

  const targetId = String(req.params.id);
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(404).json({ error: "User not found" }); return;
  }

  const updateData: Record<string, unknown> = {};
  if (req.body.fullName) updateData.name = req.body.fullName;
  if (req.body.role) updateData.buyerRole = req.body.role;

  await prisma.user.update({
    where: { id: targetId },
    data: updateData,
  });

  res.json({ ok: true });
});

teamRouter.delete("/:id", async (req, res) => {
  if (req.user!.buyerRole !== "OWNER") { res.status(403).json({ error: "Only OWNER can remove team members" }); return; }
  if (req.params.id === req.user!.userId) { res.status(409).json({ error: "Cannot remove yourself" }); return; }

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.buyerOrgId !== req.user!.buyerOrgId) {
    res.status(404).json({ error: "User not found" }); return;
  }
  await prisma.user.update({
    where: { id: req.params.id },
    data: { buyerOrgId: null, buyerRole: null },
  });
  res.json({ ok: true });
});
