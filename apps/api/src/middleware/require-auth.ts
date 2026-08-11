import type { RequestHandler } from 'express';
import { auth } from '../routes/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.user = { userId: session.user.id, role: session.user.role as string };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export function requireRole(...roles: string[]): RequestHandler {
  return (_req, res, next) => {
    const user = _req.user;
    if (!user?.role || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
