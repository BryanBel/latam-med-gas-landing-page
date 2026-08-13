// Supabase Edge Function — sends an email via Resend whenever a row is inserted
// into public.leads. Triggered by a Supabase Database Webhook (Dashboard → Database
// → Webhooks), not called directly by the site. See README in this folder for setup.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = Deno.env.get('LEAD_NOTIFY_EMAIL');
const WEBHOOK_SECRET = Deno.env.get('LEAD_WEBHOOK_SECRET');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface LeadRow {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
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

  // Plain-text alternative alongside the HTML. An HTML-only message is itself a spam
  // signal, and this one already sends from Resend's shared onboarding@resend.dev with no
  // SPF/DKIM alignment — which lands it in Gmail's spam folder. The real fix is verifying
  // send.latammedgas.com in Resend and swapping the `from` below; that is deliberately
  // deferred until the Cloudflare DNS cutover, because the root domain already carries an
  // SPF record and a second one would invalidate both. See ROADMAP.md.
  const text = [
    'Nuevo mensaje desde el sitio web',
    '',
    `Nombre: ${lead.name}`,
    `Correo: ${lead.email}`,
    `Teléfono: ${lead.phone || '—'}`,
    `Empresa: ${lead.company || '—'}`,
    '',
    'Mensaje:',
    lead.message,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Latam Med Gas — Sitio Web <onboarding@resend.dev>',
      to: [NOTIFY_EMAIL],
      reply_to: lead.email,
      subject: `Nuevo contacto: ${lead.name}`,
      text,
      html: `
        <h2>Nuevo mensaje desde el sitio web</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(lead.name)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(lead.email)}</p>
        <p><strong>Teléfono:</strong> ${lead.phone ? escapeHtml(lead.phone) : '—'}</p>
        <p><strong>Empresa:</strong> ${lead.company ? escapeHtml(lead.company) : '—'}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(lead.message).replace(/\n/g, '<br>')}</p>
      `,
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
