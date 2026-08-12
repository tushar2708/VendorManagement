import { http } from './http.js';
import type { VendorLinkDTO } from '@vendor-management/shared';

export interface LinkSummary {
  id: string;
  state: string;
  stage: string | null;
  requirementTitle: string;
}

export async function listMyLinks(): Promise<LinkSummary[]> {
  const { data } = await http.get('/api/links');
  return data;
}

export async function getLink(linkId: string): Promise<VendorLinkDTO> {
  const { data } = await http.get(`/api/links/${linkId}`);
  return data;
}

export async function saveFields(linkId: string, fields: Record<string, string | null>): Promise<void> {
  await http.put(`/api/links/${linkId}/fields`, { fields });
}

export async function attachDocument(linkId: string, doc: {
  checklistItemKey: string;
  fileBlobId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<void> {
  await http.post(`/api/links/${linkId}/documents`, doc);
}

export async function deleteDocument(linkId: string, docId: string): Promise<void> {
  await http.delete(`/api/links/${linkId}/documents/${docId}`);
}

export async function submitLink(linkId: string): Promise<void> {
  await http.post(`/api/links/${linkId}/submit`);
}
