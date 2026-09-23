-- Topes de longitud en `leads`.
--
-- La anon key es pública por diseño y la política de RLS permite INSERT a cualquiera, así que
-- hasta ahora nada impedía escribir campos de megabytes. El formulario aplica los mismos topes
-- con `maxLength` (ver LEAD_LIMITS en src/lib/leads.ts), pero eso solo cubre a quien usa el
-- formulario: quien pega directo contra PostgREST se lo salta. El límite tiene que vivir aquí.
--
-- Esto acota el tamaño de cada fila. Lo que acota la cantidad de correos es el filtro de
-- notify-lead; y revocar el INSERT de `anon` para pasar por Turnstile queda como cambio aparte.
--
-- Aplicar:  npx supabase db push --project-ref xsdmvvsksddnvvclndvu
--
-- Si alguna de estas restricciones falla al crearse es porque ya existe una fila que la
-- incumple. Eso es información, no un problema: revisa esa fila antes de relajar el tope.

alter table public.leads
  add constraint leads_name_len check (char_length(name) between 1 and 120),
  add constraint leads_email_len check (char_length(email) between 3 and 200),
  add constraint leads_phone_len check (phone is null or char_length(phone) <= 40),
  add constraint leads_company_len check (company is null or char_length(company) <= 160),
  add constraint leads_message_len check (char_length(message) between 1 and 4000);
