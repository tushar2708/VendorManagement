import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import { env } from '../config/env.js';

interface InviteEmailParams {
  to: string;
  orgName: string;
  requirementTitle: string;
  link: string;
}

function getTemplateContent(): string {
  const __filename = fileURLToPath(import.meta.url);
  const templatePath = resolve(__filename, '../../templates/invite-email.mdx');
  return readFileSync(templatePath, 'utf-8');
}

function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br/>');

  return `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#172033">${html}</div>`;
}

function inviteHtml(params: InviteEmailParams): string {
  let template = getTemplateContent();
  template = template.replace(/\{\{orgName\}\}/g, params.orgName);
  template = template.replace(/\{\{requirementTitle\}\}/g, params.requirementTitle);
  template = template.replace(/\{\{link\}\}/g, params.link);
  return markdownToHtml(template);
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
