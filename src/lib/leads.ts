// Envío del formulario de contacto.
//
// Va contra la edge function `submit-lead`, no contra PostgREST. Antes el navegador insertaba
// directo con la anon key, que es pública: cualquiera podía copiarla del bundle y escribir en
// `leads`, y como cada fila dispara un correo, eso equivalía a mandar correos. Ahora el INSERT
// de `anon` está revocado y la única vía es la función, que exige un token de Turnstile válido
// —de un solo uso— antes de escribir con el service role.
//
// La validación de aquí abajo es por comodidad del visitante, no una defensa: la función
// revalida todo por su cuenta, porque quien la llame no tiene por qué haber pasado por aquí.

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;

export const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;

// Los mismos topes que los CHECK de la migración 20260923174300 y que la edge function. Están
// aquí para que el formulario los aplique con `maxLength` y el visitante vea el límite antes de
// enviar, en vez de recibir un error por algo que se podía avisar en el campo.
export const LEAD_LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  company: 160,
  message: 4000,
} as const;

export interface Lead {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
}

/** Lanza con un mensaje ya apto para mostrar al visitante. */
export async function submitLead(lead: Lead, turnstileToken: string): Promise<void> {
  if (!SUPABASE_URL) throw new Error('No se pudo enviar el mensaje. Intente de nuevo más tarde.');

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/submit-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, turnstileToken }),
    });
  } catch {
    // Sin red, o bloqueado por una extensión. No es lo mismo que un rechazo del servidor.
    throw new Error('No hay conexión con el servidor. Revise su red e intente de nuevo.');
  }

  if (res.ok) return;

  // La función devuelve un mensaje pensado para el visitante; si no llega uno, se usa el
  // genérico en vez de enseñar un código de estado.
  const detalle = await res
    .json()
    .then((d) => (typeof d?.error === 'string' ? d.error : ''))
    .catch(() => '');
  throw new Error(detalle || 'No se pudo enviar el mensaje. Intente de nuevo o escríbanos por correo.');
}
