// Supabase Edge Function — sends an email via Resend whenever a row is inserted
// into public.leads. Triggered by a Supabase Database Webhook (Dashboard → Database
// → Webhooks), not called directly by the site. See README in this folder for setup.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = Deno.env.get('LEAD_NOTIFY_EMAIL');
const WEBHOOK_SECRET = Deno.env.get('LEAD_WEBHOOK_SECRET');

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface LeadRow {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  created_at?: string;
}

// Human-readable timestamp for the email. The webhook payload carries created_at (UTC);
// we render it in Mexico City time since that is where the verification unit operates.
function formatFecha(value?: string): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    console.error('Missing RESEND_API_KEY or LEAD_NOTIFY_EMAIL secret');
    return new Response('Server misconfigured', { status: 500 });
  }

  let lead: LeadRow;
  try {
    const payload = await req.json();
    lead = payload.record;
    if (!lead?.email || !lead?.message) {
      return new Response('Payload missing lead record', { status: 400 });
    }
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  // Plain-text alternative alongside the HTML. An HTML-only message is itself a spam signal.
  // The bigger deliverability fix is the `from` address below: this used to send from
  // Resend's shared onboarding@resend.dev, with no SPF or DKIM alignment for a domain we
  // control, which landed every notification in Gmail's spam folder.
  const fecha = formatFecha(lead.created_at);

  const text = [
    'Nuevo contacto desde el sitio web — Latam Med Gas USA LLC',
    fecha ? `Recibido: ${fecha}` : '',
    '',
    `Nombre: ${lead.name}`,
    `Correo: ${lead.email}`,
    `Teléfono: ${lead.phone || '—'}`,
    `Empresa / Institución: ${lead.company || '—'}`,
    '',
    'Mensaje:',
    lead.message,
    '',
    '——',
    'Responde a este correo para contactar directamente al cliente.',
  ]
    .filter((line) => line !== '')
    .join('\n');

  // Email-client-safe HTML: table layout, inline styles only, no external CSS or web fonts.
  // Navy header matches the brand accent (#0a0a89, sampled from the client logo).
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f5;font:600 13px/1.4 Arial,Helvetica,sans-serif;color:#5b6172;width:150px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f5;font:400 15px/1.5 Arial,Helvetica,sans-serif;color:#1a1f36;vertical-align:top;">${value}</td>
    </tr>`;
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8ef;">
        <tr><td style="background:#0a0a89;padding:24px 28px;">
          <div style="font:800 18px/1.2 Arial,Helvetica,sans-serif;color:#ffffff;letter-spacing:.2px;">Latam Med Gas USA LLC</div>
          <div style="font:400 13px/1.4 Arial,Helvetica,sans-serif;color:#a8c2f0;margin-top:4px;">Nuevo contacto desde el sitio web</div>
        </td></tr>
        <tr><td style="padding:24px 28px 8px;">
          <p style="margin:0 0 16px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#1a1f36;">Se recibió una nueva solicitud a través del formulario de contacto${fecha ? ` el <strong>${escapeHtml(fecha)}</strong>` : ''}.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row('Nombre', escapeHtml(lead.name))}
            ${row('Correo', `<a href="mailto:${escapeHtml(lead.email)}" style="color:#0a0a89;text-decoration:none;">${escapeHtml(lead.email)}</a>`)}
            ${row('Teléfono', lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}" style="color:#0a0a89;text-decoration:none;">${escapeHtml(lead.phone)}</a>` : '—')}
            ${row('Empresa / Institución', lead.company ? escapeHtml(lead.company) : '—')}
          </table>
          <p style="margin:24px 0 8px;font:600 13px/1.4 Arial,Helvetica,sans-serif;color:#5b6172;">Mensaje</p>
          <div style="background:#f6f8fc;border:1px solid #e6e8ef;border-left:3px solid #0a0a89;border-radius:8px;padding:14px 16px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#1a1f36;">${escapeHtml(lead.message).replace(/\n/g, '<br>')}</div>
        </td></tr>
        <tr><td style="padding:8px 28px 24px;">
          <a href="mailto:${escapeHtml(lead.email)}" style="display:inline-block;background:#0a0a89;color:#ffffff;font:600 14px/1 Arial,Helvetica,sans-serif;text-decoration:none;padding:12px 20px;border-radius:999px;">Responder al cliente</a>
        </td></tr>
        <tr><td style="background:#f6f8fc;padding:16px 28px;border-top:1px solid #e6e8ef;">
          <p style="margin:0;font:400 12px/1.5 Arial,Helvetica,sans-serif;color:#8a90a2;">Este mensaje se generó automáticamente desde <a href="https://latammedgas.com" style="color:#5b6172;">latammedgas.com</a>. Responde a este correo para escribir directamente al cliente.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // send.latammedgas.com, deliberately a subdomain: the root domain already publishes an
      // SPF record for the company's own mailboxes, and a second SPF record on the root
      // would invalidate both and break mail that people actually depend on.
      from: 'Latam Med Gas <notificaciones@send.latammedgas.com>',
      to: [NOTIFY_EMAIL],
      reply_to: lead.email,
      subject: lead.company ? `Nuevo contacto — ${lead.name} · ${lead.company}` : `Nuevo contacto — ${lead.name}`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend error:', await res.text());
    return new Response('Failed to send notification', { status: 502 });
  }

  // Log the Resend id so a Supabase invocation can be traced to the actual message in
  // Resend's dashboard — the success path was previously silent, which made "it returned
  // 200 but nothing arrived" impossible to diagnose from this side.
  const sent = await res.json().catch(() => null);
  console.log(`Notification sent to ${NOTIFY_EMAIL} — Resend id: ${sent?.id ?? 'unknown'}`);

  return new Response('OK', { status: 200 });
});
