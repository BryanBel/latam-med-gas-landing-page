// Envío del formulario de contacto a Supabase.
//
// Antes esto era `@supabase/supabase-js` completo — auth, realtime, storage, postgrest — para
// hacer un solo INSERT. Son ~200 KB de JavaScript en la única página donde el visitante ya
// decidió escribirnos, que es justo donde menos conviene hacerle esperar. PostgREST es una API
// HTTP normal: un `fetch` hace exactamente lo mismo.
//
// La anon key es pública por diseño (viaja en el bundle, como antes) y RLS solo permite INSERT
// sobre `leads`, nunca SELECT. Quien la copie puede escribir filas, no leerlas.

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Los mismos topes que el CHECK de la migración 0002. Están aquí para que el formulario los
// aplique con `maxLength` y el visitante vea el límite antes de enviar, en vez de recibir un
// error del servidor por algo que se podía avisar en el campo.
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

export async function submitLead(lead: Lead): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      // Sin esto PostgREST devuelve la fila insertada, que la política RLS no deja leer: la
      // inserción funciona y la respuesta falla igual.
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(lead),
  });

  if (!res.ok) {
    // El cuerpo del error de PostgREST trae el motivo (violación de CHECK, de RLS…). Va al
    // console para poder diagnosticar; al visitante se le muestra el mensaje genérico.
    throw new Error(`Supabase respondió ${res.status}: ${await res.text().catch(() => '')}`);
  }
}
