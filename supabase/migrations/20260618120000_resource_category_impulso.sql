-- Añade la categoría 'impulso' al enum resource_category (para los descargables
-- del proyecto farmapro Impulso). Idempotente.
-- NOTA: ALTER TYPE ... ADD VALUE debe ejecutarse fuera de una transacción;
-- en el SQL Editor de Supabase se ejecuta suelto sin problema.
ALTER TYPE public.resource_category ADD VALUE IF NOT EXISTS 'impulso';
