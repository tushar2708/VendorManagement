declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role?: string; tier?: string };
    }
  }
}
export {};
