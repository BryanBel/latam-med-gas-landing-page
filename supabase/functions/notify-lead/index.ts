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

// Cada INSERT en `leads` dispara un correo. La anon key es pública y RLS deja insertar a
// cualquiera, así que un POST sin autenticar equivale a un correo: el daño real de un ataque no
// son filas basura en una tabla, es inundar el buzón de trabajo de la empresa y quemar la
// reputación de send.latammedgas.com en Resend.
//
// El filtro puntúa señales en vez de contar volumen. Un tope por hora también frenaría la
// inundación, pero silenciaría al cliente legítimo que escriba durante el ataque; puntuando, ese
// cliente pasa igual. La fila siempre se guarda — esto solo decide si además se avisa — así que
// un falso positivo cuesta un aviso, nunca un lead.
//
// Se suprime a partir de 2 puntos: un mensaje legítimo que incluya un enlace al sitio del
// hospital suma 1 y se notifica igual.
const SPAM_KEYWORDS =
  /\b(seo|backlink|link building|crypto|bitcoin|casino|viagra|forex|payday|loan|traffic|ranking)\b/i;
// Cirílico y CJK: el sitio es en español para Latinoamérica.
const NON_LATIN = /[Ѐ-ӿ一-鿿぀-ヿ]/;
// Dos copias a propósito: `.test()` sobre un regex con /g avanza `lastIndex` y se lo lleva a la
// siguiente llamada, y estas constantes viven en el módulo, que Deno reutiliza entre peticiones
// del mismo isolate. La versión con /g se usa solo con `match`, que sí deja lastIndex en 0.
const URL_RE = /(https?:\/\/|www\.)/i;
const URL_RE_G = /(https?:\/\/|www\.)/gi;

function spamScore(lead: LeadRow): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const blob = `${lead.name} ${lead.company ?? ''} ${lead.message}`;
  const urls = lead.message.match(URL_RE_G)?.length ?? 0;

  if (urls > 0) reasons.push('url');
  if (urls > 1) reasons.push('urls-multiples');
  if (NON_LATIN.test(blob)) reasons.push('alfabeto-no-latino');
  if (SPAM_KEYWORDS.test(blob)) reasons.push('palabra-clave');
  if (URL_RE.test(lead.name)) reasons.push('url-en-nombre');
  if (lead.name.trim() === lead.message.trim()) reasons.push('nombre-igual-a-mensaje');

  return { score: reasons.length, reasons };
}

// Human-readable timestamp for the email. The webhook payload carries created_at (UTC);
// we render it in Mexico City time since that is where the verification unit operates.
function formatFecha(value?: string): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  try {
    // America/New_York, que es la hora de Miami, donde está la empresa y el buzón que recibe
    // esto. Estuvo en America/Mexico_City hasta el 24/09/2026 y eso ponía el aviso dos horas
    // por detrás del reloj de quien lo lee: un mensaje recibido a las 2:16 p.m. llegaba
    // fechado a las 12:16 p.m., sin nada que dijera de qué huso se trataba.
    //
    // La zona va escrita en el texto —«GMT-4»— porque sin ella la hora es una afirmación sin
    // referencia, y el horario de verano la mueve sola dos veces al año: Intl devuelve GMT-4
    // en septiembre y GMT-5 en enero sin que haya que tocar nada.
    //
    // No se usan dateStyle/timeStyle porque combinarlos con timeZoneName lanza excepción.
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

// Prefijos que ofrece el desplegable del formulario. Se comparan de más largo a más corto para
// que un número boliviano no se quede con «+59» habiendo «+591».
const PREFIJOS = [
  '+501',
  '+502',
  '+503',
  '+504',
  '+505',
  '+506',
  '+507',
  '+509',
  '+591',
  '+592',
  '+593',
  '+595',
  '+597',
  '+598',
  '+34',
  '+51',
  '+52',
  '+53',
  '+54',
  '+55',
  '+56',
  '+57',
  '+58',
  '+1',
];

/**
 * Agrupa el número nacional para que se pueda leer de un vistazo. Los últimos cuatro dígitos
 * van juntos y el resto en grupos de tres desde la derecha, que da 3-3-4 para los diez dígitos
 * de México, Colombia, Venezuela y Estados Unidos, y 4-4 para los ocho de Centroamérica.
 */
function agrupar(n: string): string {
  if (n.length <= 8) {
    const mitad = Math.ceil(n.length / 2);
    return `${n.slice(0, mitad)} ${n.slice(mitad)}`;
  }
  const cola = n.slice(-4);
  const resto = n.slice(0, -4);
  const grupos: string[] = [];
  for (let i = resto.length; i > 0; i -= 3) grupos.unshift(resto.slice(Math.max(0, i - 3), i));
  return [...grupos, cola].join(' ');
}

/**
 * Solo para mostrar. En `leads` el teléfono se guarda en E.164 —«+584241619345»— porque así se
 * marca desde cualquier país sin interpretar nada, pero leído de corrido es un muro de dígitos.
 * El enlace `tel:` sigue usando el valor sin tocar; lo único que cambia es el texto visible.
 *
 * Si el número no empieza por un prefijo conocido se devuelve tal cual: más vale enseñarlo sin
 * formato que partirlo por donde no toca.
 */
function formatTelefono(valor: string): string {
  const limpio = valor.trim();
  if (!limpio.startsWith('+')) return limpio;

  let prefijo = '';
  for (const p of PREFIJOS) {
    if (limpio.startsWith(p) && p.length > prefijo.length) prefijo = p;
  }
  if (!prefijo) return limpio;

  const nacional = limpio.slice(prefijo.length);
  if (nacional.length < 4 || !/^[0-9]+$/.test(nacional)) return limpio;
  return `${prefijo} ${agrupar(nacional)}`;
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

  // La fila ya está guardada cuando llegamos aquí — esto decide únicamente si se manda el aviso.
  // Se devuelve 200 para que Supabase no reintente el webhook: no hubo ningún fallo.
  const { score, reasons } = spamScore(lead);
  if (score >= 2) {
    console.log(`Lead retenido sin notificar (puntuación ${score}: ${reasons.join(', ')}) — ${lead.email}`);
    return new Response('OK (notificación omitida)', { status: 200 });
  }
  if (score > 0) {
    console.log(`Lead con señal débil de spam (puntuación ${score}: ${reasons.join(', ')}) — se notifica igual`);
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
    `Teléfono: ${lead.phone ? formatTelefono(lead.phone) : '—'}`,
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
            ${row('Teléfono', lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}" style="color:#0a0a89;text-decoration:none;">${escapeHtml(formatTelefono(lead.phone))}</a>` : '—')}
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
      // «Solicitud web» delante y siempre igual: separa el aviso de un correo escrito
      // directamente a la empresa, y da un texto fijo por el que montar una regla de bandeja.
      // Detrás va quién y de dónde, que es por lo que se prioriza en venta B2B. La empresa es
      // un campo opcional, así que el asunto tiene que leerse bien también sin ella.
      subject: lead.company ? `Solicitud web — ${lead.name} · ${lead.company}` : `Solicitud web — ${lead.name}`,
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
