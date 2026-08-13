import { RequestHandler } from "express";
import { auth } from "../routes/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "@vendor-management/db";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const role = (session.user as any).role ?? "BUYER";
  const tier = (session.user as any).tier ?? "EXECUTIVE";

  let dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { buyerOrgId: true, vendorOrgId: true, buyerRole: true, name: true },
  });

  if ((role === "BUYER" || role === "ADMIN") && dbUser && !dbUser.buyerOrgId) {
    const org = await prisma.buyerOrg.create({
      data: { legalName: dbUser.name ? `${dbUser.name}'s Organization` : "My Organization" },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { buyerOrgId: org.id, buyerRole: "OWNER" },
    });
    dbUser = { ...dbUser, buyerOrgId: org.id, buyerRole: "OWNER" };
  }

  if (role === "VENDOR" && dbUser && !dbUser.vendorOrgId) {
    const email = session.user.email ?? "";
    const emailDomain = email.split("@")[1] ?? "";
    let vendorOrg = emailDomain
      ? await prisma.vendorOrg.findFirst({
          where: { users: { some: { email: { endsWith: `@${emailDomain}` } } } },
        })
      : null;
    if (!vendorOrg) {
      vendorOrg = await prisma.vendorOrg.create({
        data: {
          legalName: dbUser.name ? `${dbUser.name}'s Organization` : "Vendor Organization",
          contactEmail: email,
        },
      });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { vendorOrgId: vendorOrg.id },
    });
    dbUser = { ...dbUser, vendorOrgId: vendorOrg.id };
  }

  req.user = {
    userId: session.user.id,
    role,
    tier,
    buyerOrgId: dbUser?.buyerOrgId ?? null,
    vendorOrgId: dbUser?.vendorOrgId ?? null,
    buyerRole: dbUser?.buyerRole ?? null,
  };
  next();
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
    if (!roles.includes(req.user.role ?? "")) { res.status(403).json({ error: "Forbidden" }); return; }
    next();
  };
}

export function requireOwnLink(paramName = 'id'): RequestHandler {
  return async (req, res, next) => {
    if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

    const linkId = String(req.params[paramName]);
    const link = await prisma.vendorBuyerLink.findUnique({
      where: { id: linkId },
      select: { id: true, buyerOrgId: true, vendorUserId: true, state: true },
    });

    if (!link) { res.status(404).json({ error: "Link not found" }); return; }

    const isBuyer = req.user.role === "BUYER" || req.user.role === "ADMIN";
    const isVendor = req.user.role === "VENDOR";
    const isAdmin = req.user.role === "ADMIN";

    if (isBuyer && !isAdmin && link.buyerOrgId !== req.user.buyerOrgId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    if (isVendor && link.vendorUserId !== req.user.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    (req as any).link = link;
    next();
  };
}
