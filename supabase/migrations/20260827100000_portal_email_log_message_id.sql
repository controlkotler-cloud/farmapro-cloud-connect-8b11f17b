-- =====================================================================
-- portal_email_log: mailrelay_id -> message_id
--
-- El transaccional del portal deja de usar un proveedor externo y pasa a
-- encolarse en `transactional_emails` (pgmq), que despacha
-- `process-email-queue` contra la API de Lovable. La columna guardaba el id
-- que devolvía el proveedor; ahora guarda el UUID del mensaje encolado.
--
-- Idempotente: si ya se aplicó (o la tabla ya nace con message_id), no falla.
-- Ejecutada en producción el 27-08-2026 y verificada; esta migración deja
-- constancia versionada de un cambio hecho por SQL directo.
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'portal_email_log'
      AND column_name = 'mailrelay_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'portal_email_log'
      AND column_name = 'message_id'
  ) THEN
    ALTER TABLE public.portal_email_log RENAME COLUMN mailrelay_id TO message_id;
  END IF;
END $$;

COMMENT ON COLUMN public.portal_email_log.message_id IS
  'UUID del mensaje encolado en transactional_emails (pgmq). Antes: id del proveedor externo, retirado el 27-08-2026.';
