import { http } from './http.js';

export interface VendorOnboardingRequest {
  id: string;
  title: string;
  requestNumber: string;
  status: string;
  inviteStatus: string;
  candidateStatus: string;
  createdAt: string;
}

export interface VendorOnboarding {
  vendor: { id: string; name: string; contactEmail: string; isVerified: boolean } | null;
  requests: VendorOnboardingRequest[];
}

export async function getOnboarding(): Promise<VendorOnboarding> {
  const response = await http.get('/api/vendor/onboarding');
  if (response.data.onboarding === null) {
    return { vendor: null, requests: [] };
  }
  return response.data;
}

export interface PrequalSubmission {
  panNumber: string;
  gstin: string;
  udyamNumber?: string;
}

export async function submitPrequal(data: PrequalSubmission): Promise<void> {
  await http.post('/api/vendor/prequal', data);
}

export interface UploadDocumentInput {
  name: string;
  category: 'BANK_DETAILS' | 'STATUTORY' | 'LEGAL' | 'IDENTITY' | 'CAPABILITY';
  mimeType: string;
  sizeBytes: number;
  data: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  category: string;
  status: string;
}

export async function uploadDocument(data: UploadDocumentInput): Promise<UploadedDocument> {
  const response = await http.post('/api/vendor/documents', data);
  return response.data.document;
}

export interface VendorDocument {
  id: string;
  name: string;
  category: string;
  status: string;
  createdAt: string;
}

export async function getDocuments(): Promise<VendorDocument[]> {
  const response = await http.get('/api/vendor/documents');
  return response.data.documents;
}

export interface VendorProfile {
  id: string;
  name: string;
  contactEmail: string;
  vendorType: string | null;
  panNumber: string | null;
  gstin: string | null;
  udyamNumber: string | null;
  vendorCode: string | null;
  isVerified: boolean;
  category: string | null;
  certifications: string[];
  city: string | null;
  state: string | null;
}

export interface VendorProfileCheck {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  verifiedAt: string | null;
}

export async function getVendorProfile(): Promise<{ vendor: VendorProfile; checks: VendorProfileCheck[] }> {
  const response = await http.get('/api/vendor/profile');
  return { vendor: response.data.vendor, checks: response.data.checks };
}
