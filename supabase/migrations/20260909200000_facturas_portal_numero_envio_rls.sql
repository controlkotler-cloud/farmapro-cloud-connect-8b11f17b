-- Facturas del portal: número de Holded, envío por email y lectura por el propio usuario.
-- Idempotente. Ejecutada a mano vía query_database el 09-09-2026.
alter table public.portal_holded_invoices
  add column if not exists holded_doc_number text,
  add column if not exists sent_at timestamptz,
  add column if not exists send_error text;

drop policy if exists "users read own holded invoices" on public.portal_holded_invoices;
create policy "users read own holded invoices"
  on public.portal_holded_invoices
  for select
  to authenticated
  using (auth.uid() = user_id);
