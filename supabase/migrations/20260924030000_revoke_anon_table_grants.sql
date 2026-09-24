-- Quita los permisos de tabla que la migración anterior dejó puestos.
--
-- `20260923190000_revoke_anon_insert.sql` hizo lo que su nombre dice a medias: borró la POLÍTICA
-- de RLS, que es lo que dejaba pasar el insert, pero no tocó los GRANTS de tabla. Supabase los
-- concede por defecto a `anon` y `authenticated` sobre todo lo que se crea en el esquema
-- público, así que hasta aquí la clave publicable —que viaja en el bundle— seguía teniendo
-- sobre `leads` estos permisos:
--
--   DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
--
-- Hoy no sirven de nada: con RLS activo y cero políticas, Postgres deniega igual. El problema es
-- que TODA la defensa está en un solo interruptor. Si alguien desactiva RLS para depurar algo, o
-- añade más adelante una política permisiva para otro propósito, esos grants despiertan y con
-- ellos el DELETE y el TRUNCATE sobre la tabla de clientes. Dos capas cuestan una línea.
--
-- `service_role` y `postgres` NO se tocan: la edge function `submit-lead` inserta con el service
-- role, que además salta RLS. Revocarle a él rompería el formulario.
--
-- Comprobado antes de aplicar: los cuatro roles (anon, authenticated, postgres, service_role)
-- tenían los siete privilegios; después de esto solo los conservan los dos últimos.

-- Para deshacerlo, si alguna vez hay que devolver el camino directo desde el navegador, hacen
-- falta las DOS mitades: sin el grant, una política sola sigue fallando con 42501.
--
--   grant insert on public.leads to anon;
--   create policy "anon can submit leads" on public.leads
--     for insert to anon with check (true);

revoke all privileges on table public.leads from anon, authenticated;
