-- handle_new_user inserta source='alta_sin_formulario' cuando el alta llega sin el formulario de
-- consentimiento (OAuth, p. ej. Google), pero el check solo admitía registro/canje/reto/descargable:
-- esa alta fallaría entera. Se amplía el check (aplicado en producción con query_database el 08-10-2026).
alter table public.consent_ledger drop constraint if exists consent_ledger_source_check;
alter table public.consent_ledger add constraint consent_ledger_source_check
  check (source = any (array['registro','canje','reto','descargable','alta_sin_formulario']));
