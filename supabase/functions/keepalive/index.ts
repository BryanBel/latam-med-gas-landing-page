// Mantiene el proyecto de Supabase despierto, y avisa si deja de estarlo.
//
// El plan gratuito pausa un proyecto tras 7 días sin actividad, y un proyecto pausado **no
// despierta solo con tráfico**: hay que restaurarlo a mano desde el panel. El modo de fallo es
// silencioso y caro — una semana sin envíos, se pausa, escribe un hospital, recibe un error, y
// nadie se entera de que se perdió el lead. No es hipotético: `shield-link-db`, en esta misma
// cuenta, ya está INACTIVE.
//
// Un workflow de GitHub Actions llama aquí cada 3 días. La llamada consulta la base de verdad,
// que es lo que cuenta como actividad: invocar una edge function sin tocar Postgres no garantiza
// nada, porque la pausa se decide por la actividad de la base.
//
// Cuenta filas en vez de leerlas. `limit=0` con `Prefer: count=exact` devuelve el total en la
// cabecera `Content-Range` y ni una fila de datos, así que la consulta toca la tabla sin que los
// datos de contacto de nadie salgan de Supabase.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const KEEPALIVE_SECRET = Deno.env.get('KEEPALIVE_SECRET');

serve(async (req) => {
  // Falla cerrado si falta el secreto, igual que `notify-lead`. Un despliegue al que se le
  // olvidó el secreto no puede quedar abierto a cualquiera que adivine la URL.
  if (!KEEPALIVE_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Falta KEEPALIVE_SECRET, SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return new Response(JSON.stringify({ error: 'Servicio no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.headers.get('x-keepalive-secret') !== KEEPALIVE_SECRET) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // La consulta que despierta: cuenta sin traer filas.
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=id&limit=0`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'count=exact',
      },
    });
  } catch (err) {
    console.error('No se pudo alcanzar PostgREST:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Base inalcanzable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!res.ok) {
    console.error('PostgREST respondió', res.status, await res.text().catch(() => ''));
    return new Response(JSON.stringify({ error: 'La consulta falló', status: res.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // `Content-Range` llega como `*/5`: lo de después de la barra es el total.
  const total = Number(res.headers.get('content-range')?.split('/')[1] ?? NaN);

  console.log(`Latido correcto — ${Number.isFinite(total) ? total : '?'} leads`);
  return new Response(JSON.stringify({ ok: true, leads: Number.isFinite(total) ? total : null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
