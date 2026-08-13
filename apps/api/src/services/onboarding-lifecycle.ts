import type { LinkState, PrismaClient } from '@prisma/client';
import { prisma } from '@vendor-management/db';
import { transition } from '../lib/link-state.js';

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface LinkActivityContext {
  actorType: 'VENDOR' | 'BUYER' | 'SYSTEM';
  actorId?: string | null;
  side?: 'VENDOR' | 'BUYER' | 'SYSTEM';
  note?: string | null;
}

/**
 * Move a link to a new state.
 *
 * Wraps the transition function with logging and context handling.
 * Pass `tx` when the caller already holds a transaction and wants this
 * transition to commit or roll back with the rest of its work.
 */
export async function transitionLink(
  linkId: string,
  targetState: LinkState,
  context: LinkActivityContext,
  tx?: TxClient,
): Promise<void> {
  const db = tx ?? prisma;

  await transition(linkId, targetState, {
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    side: context.side ?? context.actorType,
    note: context.note ?? null,
  }, db as any);
}

/**
 * Record a link event without changing the link's state.
 *
 * Use when you need to log an activity or change to the link that does
 * not involve a state transition.
 *
 * Pass `tx` when the caller already holds a transaction.
 */
export async function recordActivity(
  linkId: string,
  context: LinkActivityContext,
  tx?: TxClient,
): Promise<void> {
  const db = tx ?? prisma;

  await (db as any).linkEvent.create({
    data: {
      linkId,
      fromState: null,
      toState: (
        await (db as any).vendorBuyerLink.findUnique({
          where: { id: linkId },
          select: { state: true },
        })
      )?.state,
      actorType: context.actorType,
      actorId: context.actorId ?? null,
      side: context.side ?? context.actorType,
      note: context.note ?? null,
    },
  });
}
