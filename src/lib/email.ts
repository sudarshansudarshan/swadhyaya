import { Resend } from 'resend';
import { createEvent } from 'ics';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVivaApprovedEmail(
  to: string,
  data: { meetingUrl: string; startUtc: Date; instructorName: string; moduleNumber: number }
) {
  if (!resend) {
    console.log('email stub: viva approved', to, data);
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@swadhyaya.app',
    to,
    subject: `Viva Approved — Module ${data.moduleNumber}`,
    html: `<p>Your viva has been approved.</p>
<p><strong>When:</strong> ${data.startUtc.toLocaleString()}</p>
<p><strong>Instructor:</strong> ${data.instructorName}</p>
<p><a href="${data.meetingUrl}">Join the meeting</a></p>`,
  });
}
