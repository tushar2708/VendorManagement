import { http } from './http.js';
import type { TeamMember, CreateTeamMemberInput } from '@vendor-management/shared';

export async function listTeam(): Promise<TeamMember[]> {
  const { data } = await http.get('/api/team');
  return data;
}

export async function createTeamMember(input: CreateTeamMemberInput): Promise<void> {
  await http.post('/api/team', input);
}

export async function removeTeamMember(id: string): Promise<void> {
  await http.delete(`/api/team/${id}`);
}
