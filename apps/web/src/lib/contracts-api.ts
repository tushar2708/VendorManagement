import { http } from './http.js';
import { uploadFile } from './files-api.js';

export async function uploadDraft(contractId: string, file: File): Promise<void> {
  const upload = await uploadFile(file, 'contract');
  await http.post(`/api/contracts/${contractId}/draft`, { fileBlobId: upload.fileBlobId, fileName: upload.fileName });
}

export async function uploadRevision(contractId: string, file: File): Promise<void> {
  const upload = await uploadFile(file, 'contract');
  await http.post(`/api/contracts/${contractId}/revise`, { fileBlobId: upload.fileBlobId, fileName: upload.fileName });
}

export async function buyerSign(contractId: string, file: File): Promise<void> {
  const upload = await uploadFile(file, 'contract');
  await http.post(`/api/contracts/${contractId}/buyer-sign`, { fileBlobId: upload.fileBlobId, fileName: upload.fileName });
}

export async function vendorRequestChanges(contractId: string, body: string, file?: File): Promise<void> {
  let fileBlobId: string | null = null;
  let fileName: string | null = null;
  if (file) {
    const upload = await uploadFile(file, 'contract');
    fileBlobId = upload.fileBlobId;
    fileName = upload.fileName;
  }
  await http.post(`/api/contracts/${contractId}/request-changes`, { body, fileBlobId, fileName });
}

export async function vendorAgree(contractId: string): Promise<void> {
  await http.post(`/api/contracts/${contractId}/agree`);
}

export async function vendorSign(contractId: string, file: File): Promise<void> {
  const upload = await uploadFile(file, 'contract');
  await http.post(`/api/contracts/${contractId}/vendor-sign`, { fileBlobId: upload.fileBlobId, fileName: upload.fileName });
}
