import type { ErpProvider, ErpPushResult } from './types.js';

/**
 * Stand-in for the SAP Business Partner push behind wireframe 2g.
 *
 * The vendor code is derived from the vendor id so a given vendor always gets
 * the same code, which keeps demos and tests stable. It is shaped like a real
 * SAP vendor account number — the 45 range, ten digits — because buyers read
 * this code back to their finance team, and one that looks invented gets
 * treated as invented.
 */
function codeFor(vendorId: string): string {
  let hash = 0;
  for (const character of vendorId) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100_000_000;
  }
  return `45${String(hash).padStart(8, '0')}`;
}

export const fakeErpProvider: ErpProvider = {
  async pushVendor({ vendorId, name }): Promise<ErpPushResult> {
    const vendorCode = codeFor(vendorId);

    return {
      vendorCode,
      apiMethod: 'Business Partner API',
      responsePayload: JSON.stringify({ simulated: true, vendorCode, name }),
    };
  },
};
