import { Resend } from 'resend';
import { createEvent } from 'ics';
import * as fs from 'fs';
import * as path from 'path';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const logOnly = process.env.RESEND_LOG_ONLY === '1' || !process.env.RESEND_API_KEY;

const LOG_DIR = '/tmp/swadhyaya-emails';
if (logOnly && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export async function sendVivaApprovedEmail(
  to: string,
  data: { meetingUrl: string; startUtc: Date; instructorName: string; moduleNumber: number }
) {
  const subject = `Viva Approved — Module ${data.moduleNumber}`;
  const body = `
Your viva has been approved.

When: ${data.startUtc.toLocaleString()}
Instructor: ${data.instructorName}
Meeting: ${data.meetingUrl}

See you there!
`;

  if (logOnly) {
    const filename = path.join(LOG_DIR, `${Date.now()}-${to.replace(/[^a-z0-9]/gi, '_')}.txt`);
    fs.writeFileSync(filename, `TO: ${to}\nSUBJECT: ${subject}\n\n${body}`);
    console.log(`[EMAIL] ${subject} → ${to} (logged to ${filename})`);
    return;
  }

  await resend!.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@swadhyaya.app',
    to,
    subject,
    html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
  });
}
