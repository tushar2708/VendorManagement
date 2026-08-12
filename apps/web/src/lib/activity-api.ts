import { http } from './http.js';
import type { ActivityItem } from '@vendor-management/shared';

export async function getActivityFeed(): Promise<ActivityItem[]> {
  const { data } = await http.get('/api/buyer/activity');
  return data.activities;
}
