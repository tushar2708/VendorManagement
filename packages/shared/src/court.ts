import { LINK_STATE_META } from './schemas/link.js';

export type CourtSide = 'BUYER' | 'VENDOR' | 'PLATFORM' | 'DONE';

export function courtForState(state: string): CourtSide {
  const meta = LINK_STATE_META[state];
  if (!meta) return 'BUYER';
  if (state === 'ERP_SYNCING' || state === 'ERP_FAILED') return 'PLATFORM';
  if (meta.court === 'done') return 'DONE';
  if (meta.court === 'vendor') return 'VENDOR';
  if (meta.court === 'system') return 'PLATFORM';
  return 'BUYER';
}
