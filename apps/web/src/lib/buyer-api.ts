import { http } from './http.js';
import type { BuyerLinkDetail } from '@vendor-management/shared';

export async function getBuyerLink(linkId: string): Promise<BuyerLinkDetail> {
  const { data } = await http.get(`/api/buyer/links/${linkId}`);
  return data;
}

export async function runCheck(linkId: string, checkType: string): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/verify`, { checkType });
}

export async function resolveCheck(linkId: string, checkId: string, action: 'accept' | 'reject'): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/checks/${checkId}/resolve`, { action });
}

export async function requestChanges(linkId: string, reason: string, rejectedDocumentIds?: string[]): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/request-changes`, { reason, rejectedDocumentIds });
}

export async function reviewClear(linkId: string, score: number): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/review`, { action: 'clear', score });
}

export async function reviewReject(linkId: string, reason: string): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/review`, { action: 'reject', reason });
}

export async function awardLink(linkId: string): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/award`);
}

export async function advanceToContracts(linkId: string): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/advance-to-contracts`);
}

export async function pushErp(linkId: string, simulateFailure = false): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/push-erp`, { simulateFailure });
}

export async function retryErp(linkId: string): Promise<void> {
  await http.post(`/api/buyer/links/${linkId}/retry-erp`);
}

export function erpPackUrl(linkId: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}/api/buyer/links/${linkId}/erp-pack`;
}
