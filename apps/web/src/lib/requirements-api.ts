import {
  requirementListResponseSchema,
  requirementResponseSchema,
  requirementStatsSchema,
  type CreateRequirementInput,
  type RequirementSummary,
  type RequirementStats,
} from '@vendor-management/shared';
import { http } from './http.js';

export async function getRequirements(): Promise<RequirementSummary[]> {
  const response = await http.get('/api/requirements');
  return requirementListResponseSchema.parse(response.data).requirements;
}

export async function createRequirement(input: CreateRequirementInput): Promise<RequirementSummary> {
  const response = await http.post('/api/requirements', input);
  return requirementResponseSchema.parse(response.data).requirement;
}

export async function getRequirementStats(): Promise<RequirementStats> {
  const response = await http.get('/api/requirements/stats');
  return requirementStatsSchema.parse(response.data);
}

export interface SlaRule { id: string; stage: string; slaDays: number; escalateAfterBreach: boolean; }

export async function getSlaRules(): Promise<SlaRule[]> {
  const response = await http.get('/api/sla-rules');
  return response.data.rules;
}

export async function updateSlaRule(id: string, data: { slaDays?: number; escalateAfterBreach?: boolean }): Promise<void> {
  await http.patch(`/api/sla-rules/${id}`, data);
}

export interface ApprovalItem {
  id: string; stage: string; status: string; slaRisk: string;
  ageDays: number; slaDays: number; vendorName: string; vendorEmail: string;
  assignedToName: string | null; requestId: string | null;
}

export async function getApprovals(status?: string): Promise<ApprovalItem[]> {
  const response = await http.get('/api/approvals', { params: status ? { status } : {} });
  return response.data.approvals;
}

export async function decideApproval(id: string, decision: { status: string; notes?: string }): Promise<void> {
  await http.post(`/api/approvals/${id}/decide`, decision);
}

export interface ScoringCriterion { id: string; name: string; weight: number; }

export interface ScoringCandidate {
  id: string;
  legalName: string | null;
  contactEmail: string | null;
  score: number | null;
  scoreBreakdown: Record<string, number> | null;
  commercials: { basePrice?: number; toolingPerUnit?: number; logisticsPerUnit?: number; capacity?: number; leadTimeDays?: number } | null;
  isAwarded: boolean;
  pan: string | null;
  city: string | null;
  state: string | null;
}

export interface ScoringData { criteria: ScoringCriterion[]; candidates: ScoringCandidate[]; }

export async function getScoring(requirementId: string): Promise<ScoringData> {
  const response = await http.get(`/api/requirements/${requirementId}/scoring`);
  return response.data;
}

export async function updateScoring(requirementId: string, criteria: { name: string; weight: number }[]): Promise<void> {
  await http.patch(`/api/requirements/${requirementId}/scoring`, { criteria });
}

export async function awardCandidate(requirementId: string, candidateId: string): Promise<void> {
  await http.post(`/api/requirements/${requirementId}/award`, { candidateId });
}
