// Supabase Edge Function — recibe el formulario de contacto, comprueba el token de Turnstile y
// solo entonces escribe en `leads`, con el service role.
//
// Por qué existe: antes el navegador insertaba directo contra PostgREST con la anon key, que es
// pública por diseño. Cualquiera podía copiarla del bundle y escribir filas, y como cada fila
// dispara el webhook que manda correo por Resend, un POST sin autenticar equivalía a un correo.
// El filtro de `notify-lead` acota el daño, pero la puerta seguía abierta. Esta función la
// cierra: con el INSERT de `anon` revocado, escribir en `leads` exige pasar por aquí, y aquí
// exige un token de Turnstile válido, que es de un solo uso.
//
// Se despliega con --no-verify-jwt a propósito. La clave pública del proyecto es del formato
// nuevo (sb_publishable_…), que no es un JWT, así que la puerta del gateway la rechazaría antes
// de llegar a este código — el mismo 401 invisible que documenta CLAUDE.md para notify-lead. La
// autenticación real de esta función es el token de Turnstile, no la clave del proyecto.
//
//   npx supabase functions deploy submit-lead --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY');
// Supabase inyecta estas dos en toda edge function; no hay que darlas de alta como secreto.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Solo los orígenes propios. El navegador llama desde latammedgas.com a *.supabase.co, que es
// petición cruzada: sin esto el preflight falla y el formulario deja de enviar sin decir por qué.
const ORIGENES = [
  'https://latammedgas.com',
  'https://www.latammedgas.com',
  'https://latam-med-gas-preview.bryanbelandriav.workers.dev',
  'http://localhost:4321',
  'http://localhost:4322',
];

// Los mismos topes que los CHECK de la migración 20260923174300 y que LEAD_LIMITS en el
// frontend. Repetidos aquí a propósito: quien llame a esta función no tiene por qué haber
// pasado por nuestro formulario.
const LIMITES = { name: 120, email: 200, phone: 40, company: 160, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cors(origin: string | null): Record<string, string> {
  const permitido = origin && ORIGENES.includes(origin) ? origin : ORIGENES[0];
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  });

/** Recorta y valida. Devuelve el error para el visitante, o la fila lista para insertar. */
function normalizar(raw: Record<string, unknown>): { error: string } | { lead: Record<string, string | null> } {
  const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const name = txt(raw.name);
  const email = txt(raw.email);
  const message = txt(raw.message);
  const phone = txt(raw.phone);
  const company = txt(raw.company);

  if (!name) return { error: 'Indique su nombre.' };
  if (!email) return { error: 'Indique su correo.' };
  if (!EMAIL_RE.test(email)) return { error: 'Revise el formato del correo.' };
  if (!message) return { error: 'Escriba su mensaje.' };

  for (const [campo, valor] of Object.entries({ name, email, phone, company, message })) {
    if (valor.length > LIMITES[campo as keyof typeof LIMITES]) {
      return { error: `El campo ${campo} supera el máximo permitido.` };
    }
  }

  return { lead: { name, email, message, phone: phone || null, company: company || null } };
}

async function turnstileValido(token: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append('secret', TURNSTILE_SECRET!);
  form.append('response', token);
  // Opcional, pero mejora la señal de Cloudflare.
  if (ip) form.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    console.error('siteverify respondió', res.status);
    return false;
  }
  const data = await res.json();
  if (!data.success) {
    // Los códigos de error de Cloudflare son diagnóstico, no datos del visitante.
    console.log('Turnstile rechazó el token:', JSON.stringify(data['error-codes'] ?? []));
  }
  return data.success === true;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405, origin);

  if (!TURNSTILE_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Falta TURNSTILE_SECRET_KEY, SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return json({ error: 'Servicio no disponible.' }, 500, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Petición mal formada.' }, 400, origin);
  }

  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
  if (!token) return json({ error: 'Falta la verificación anti-spam.' }, 400, origin);

  const ok = await turnstileValido(token, req.headers.get('CF-Connecting-IP'));
  if (!ok)
    return json({ error: 'No pudimos verificar que sea una persona. Recargue e intente de nuevo.' }, 403, origin);

  const normalizado = normalizar(body);
  if ('error' in normalizado) return json({ error: normalizado.error }, 400, origin);

  // Service role: salta RLS, que es justo el punto — `anon` ya no puede insertar.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(normalizado.lead),
  });

  if (!res.ok) {
    console.error('PostgREST respondió', res.status, await res.text().catch(() => ''));
    return json({ error: 'No se pudo registrar el mensaje.' }, 502, origin);
  }

  return json({ ok: true }, 200, origin);
});
