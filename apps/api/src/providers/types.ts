import type {
  VerificationCheckType,
  VerificationStatus,
} from '@vendor-management/shared';

/** Notification delivery channels. */
export type InviteChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface VerificationInput {
  /** The identifier being checked: PAN, GST, Udyam number, account number. */
  value?: string;
  /** The vendor's registered legal name. */
  legalName?: string;
  /** The name as it appears on the uploaded document or issuer record. */
  documentName?: string;
  /** Which attempt this is; some checks resolve asynchronously in reality. */
  attempt?: number;
}

export interface VerificationOutcome {
  status: VerificationStatus;
  /** 0-100 name-match confidence, present when the result is a partial match. */
  matchScore?: number;
  notes: string;
  rawResponse: string;
}

export interface VerificationProvider {
  check(type: VerificationCheckType, input: VerificationInput): Promise<VerificationOutcome>;
}

export interface ErpPushResult {
  vendorCode: string;
  apiMethod: string;
  responsePayload: string;
}

export interface ErpProvider {
  pushVendor(input: { vendorId: string; name: string }): Promise<ErpPushResult>;
}

export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
}

export interface NotificationReceipt {
  channel: InviteChannel;
  to: string;
  sentAt: Date;
}

export interface NotificationProvider {
  send(channel: InviteChannel, message: NotificationMessage): Promise<NotificationReceipt>;
}
