import { http } from './http.js';

export interface UploadedFile {
  fileBlobId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export async function uploadFile(file: File, kind: 'document' | 'contract'): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  const { data } = await http.post('/api/uploads', formData);
  return data;
}

export function fileUrl(fileBlobId: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}/api/files/${fileBlobId}`;
}
