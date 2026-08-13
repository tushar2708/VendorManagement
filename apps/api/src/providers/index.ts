import { fakeErpProvider } from './fake-erp.js';
import { fakeNotificationProvider } from './fake-notification.js';
import { fakeVerificationProvider } from './fake-verification.js';
import type { ErpProvider, NotificationProvider, VerificationProvider } from './types.js';

/**
 * External systems the platform talks to.
 *
 * All three are simulated: we have no credentials for the GST/PAN/Udyam
 * portals, penny-drop banking, company filings, UBO screening or SAP. Swapping
 * in a real implementation means changing the binding here and nothing else.
 */
export const verificationProvider: VerificationProvider = fakeVerificationProvider;
export const erpProvider: ErpProvider = fakeErpProvider;
export const notificationProvider: NotificationProvider = fakeNotificationProvider;

export type * from './types.js';
