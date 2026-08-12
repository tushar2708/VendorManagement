import type { RequestHandler } from "express";
import { auth } from "../routes/auth.js";
import { prisma } from "@vendor-management/db";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const session = await auth.api.getSession({ headers: request.headers as unknown as Headers });
  if (!session) {
    response.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, vendorOrgId: true },
  });

  if (!user) {
    response.status(401).json({ success: false, error: 'User not found' });
    return;
  }

  response.locals.user = user;
  next();
};

export function requireRole(...roles: string[]): RequestHandler {
  return (request, response, next) => {
    const user = response.locals.user;
    if (!user || !roles.includes(user.role)) {
      response.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const requireVendorOwnership: RequestHandler = async (request, response, next) => {
  const user = response.locals.user;
  if (!user) {
    response.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (user.role === 'BUYER' || user.role === 'ADMIN') {
    next();
    return;
  }

  if (!user.vendorOrgId || user.vendorOrgId !== String(request.params.id)) {
    response.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  next();
};
