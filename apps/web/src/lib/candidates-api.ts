import {
  requirementDetailResponseSchema,
  directoryListResponseSchema,
  inviteResponseSchema,
  type RequirementDetail,
  type DirectoryVendor,
  type AddCandidateInput,
  type UpdateCandidateInput,
  type InviteResponse,
} from '@vendor-management/shared';
import { http } from './http.js';

export async function getRequirement(id: string): Promise<RequirementDetail> {
  const response = await http.get(`/api/requirements/${id}`);
  return requirementDetailResponseSchema.parse(response.data).requirement;
}

export interface DirectoryFilters {
  readonly search?: string;
  readonly process?: string;
  readonly state?: string;
  readonly requirementId?: string;
}

export async function getDirectory(filters: DirectoryFilters): Promise<DirectoryVendor[]> {
  const response = await http.get('/api/directory', { params: filters });
  return directoryListResponseSchema.parse(response.data).vendors;
}

export async function addCandidates(
  requirementId: string,
  candidates: AddCandidateInput[],
): Promise<RequirementDetail> {
  const response = await http.post(`/api/requirements/${requirementId}/candidates`, { candidates });
  return requirementDetailResponseSchema.parse(response.data).requirement;
}

export async function removeCandidate(requirementId: string, candidateId: string): Promise<void> {
  await http.delete(`/api/requirements/${requirementId}/candidates/${candidateId}`);
}

export async function updateCandidate(
  requirementId: string,
  candidateId: string,
  data: UpdateCandidateInput,
): Promise<RequirementDetail> {
  const response = await http.patch(`/api/requirements/${requirementId}/candidates/${candidateId}`, data);
  return requirementDetailResponseSchema.parse(response.data).requirement;
}

export async function dispatchInvites(requirementId: string, candidateIds?: string[]): Promise<InviteResponse> {
  const response = await http.post(`/api/requirements/${requirementId}/invites`, { candidateIds });
  return inviteResponseSchema.parse(response.data);
}
