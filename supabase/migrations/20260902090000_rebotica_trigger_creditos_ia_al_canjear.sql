-- ============================================================================
-- Rebotica · 02-09-2026 · Créditos IAFarma se acreditan SOLOS al canjear
-- ----------------------------------------------------------------------------
-- El canje (redeem-reward) solo marca redeemed_at y avisa por email; el
-- cumplimiento era manual para todos los tipos. Este trigger cubre el tipo
-- 'credito_ia': al pasar redeemed_at de NULL a fecha, suma al usuario los
-- créditos que diga el título del premio ("3 créditos de imagen IAFarma" → 3;
-- si no hay número, 3) vía add_image_credits (SECURITY DEFINER, ya existente).
-- Idempotente: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rebotica_on_redeem()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tipo   text;
  v_titulo text;
  v_n      integer;
BEGIN
  IF NEW.redeemed_at IS NOT NULL AND OLD.redeemed_at IS NULL THEN
    SELECT tipo, titulo INTO v_tipo, v_titulo
      FROM public.rebotica_prizes
     WHERE id = NEW.prize_id;

    IF v_tipo = 'credito_ia' THEN
      v_n := COALESCE(NULLIF(substring(v_titulo FROM '^\s*(\d+)'), '')::integer, 3);
      PERFORM public.add_image_credits(NEW.user_id, v_n);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_rebotica_on_redeem ON public.rebotica_openings;
CREATE TRIGGER trg_rebotica_on_redeem
  AFTER UPDATE OF redeemed_at ON public.rebotica_openings
  FOR EACH ROW
  EXECUTE FUNCTION public.rebotica_on_redeem();

UPDATE public.rebotica_prizes
   SET descripcion = 'Tres imágenes extra con IAFarma: carteles, posts y promos para tu farmacia. Se suman a tu saldo en cuanto canjeas el premio.',
       updated_at = now()
 WHERE tipo = 'credito_ia' AND titulo = '3 créditos de imagen IAFarma';

-- Comprobación:
-- SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'public.rebotica_openings'::regclass AND NOT tgisinternal;
