declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role?: string;
        tier?: string;
        buyerOrgId?: string | null;
        vendorOrgId?: string | null;
        buyerRole?: string | null;
      };
      link?: {
        id: string;
        buyerOrgId: string;
        vendorUserId: string | null;
        state: string;
      };
    }
  }
}
export {};
