import { Resend } from 'resend';
import { env } from '../config/env.js';

interface InviteEmailParams {
  to: string;
  orgName: string;
  requirementTitle: string;
  link: string;
}

function inviteHtml(params: InviteEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">VM</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:2px">Vendor Management</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">You've been invited to onboard</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
              <strong style="color:#0f172a">${params.orgName}</strong> has invited you to begin the vendor onboarding process for:
            </p>
            <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 32px">
              <div style="font-size:16px;font-weight:600;color:#1e293b">${params.requirementTitle}</div>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px">
                <a href="${params.link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(79,70,229,0.35)">Begin onboarding</a>
              </td></tr>
            </table>
            <div style="border-top:1px solid #e2e8f0;padding-top:20px">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b">If the button does not work, paste this link in your browser:</p>
              <p style="margin:0;font-size:13px;color:#4f46e5;word-break:break-all">${params.link}</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">This link expires in 14 days.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8">Sent by Vendor Management Platform on behalf of ${params.orgName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Sends the invite via Resend. Returns true if actually sent, false if it was
// only logged (no API key, or a send failure). NEVER throws — a broken email
// provider must not break invite dispatch.
export async function sendInviteEmail(params: InviteEmailParams): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log(`[invite] RESEND_API_KEY not set — magic link logged instead of emailed: ${params.link}`);
    return false;
  }
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: params.to,
      subject: `Invitation from ${params.orgName}: ${params.requirementTitle}`,
      html: inviteHtml(params),
    });
    if (error) {
      console.error(`[invite] Resend returned an error — magic link logged instead: ${params.link}`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[invite] Resend threw — magic link logged instead: ${params.link}`, error);
    return false;
  }
}

interface NotifyEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendNotifyEmail(params: NotifyEmailParams): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email-notify] To: ${params.to} | Subject: ${params.subject}`);
    return false;
  }
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (err) {
    console.error('Failed to send notification email:', err);
    return false;
  }
}
