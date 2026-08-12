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

  return new Response('OK', { status: 200 });
});
