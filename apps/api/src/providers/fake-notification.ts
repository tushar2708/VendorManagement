import { logger } from '../lib/logger.js';

import type { NotificationProvider, NotificationReceipt } from './types.js';

/**
 * Stand-in for email and WhatsApp delivery.
 *
 * Nothing leaves the machine. Sends are logged and the caller records the
 * matching activity entry, so the invite and reminder history is still visible
 * in-app exactly as the wireframes show it.
 */
export const fakeNotificationProvider: NotificationProvider = {
  async send(channel, message): Promise<NotificationReceipt> {
    logger.info(
      { channel, to: message.to, subject: message.subject },
      'simulated notification send',
    );

    return { channel, to: message.to, sentAt: new Date() };
  },
};
