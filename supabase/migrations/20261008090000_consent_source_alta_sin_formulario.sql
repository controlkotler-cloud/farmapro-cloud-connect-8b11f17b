-- handle_new_user, cuando el alta llega sin el formulario de consentimiento (OAuth, p. ej. Google),
-- inserta tipo='rgpd_pendiente' y source='alta_sin_formulario', pero los checks no admitían ninguno
-- de los dos valores: esa alta fallaría entera. Se amplían ambos checks (aplicado en producción con
-- query_database el 08-10-2026 y probado con un insert revertido).
alter table public.consent_ledger drop constraint if exists consent_ledger_source_check;
alter table public.consent_ledger add constraint consent_ledger_source_check
  check (source = any (array['registro','canje','reto','descargable','alta_sin_formulario']));
alter table public.consent_ledger drop constraint if exists consent_ledger_tipo_check;
alter table public.consent_ledger add constraint consent_ledger_tipo_check
  check (tipo = any (array['rgpd','comercial','partner_optin','rgpd_pendiente']));
