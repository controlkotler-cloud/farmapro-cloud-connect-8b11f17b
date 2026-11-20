-- IAFarma: alta guiada de la farmacia (20-11-2026).
-- Idempotente: se puede aplicar dos veces sin error.

-- 1. Ficha de la farmacia validada en el alta guiada.
alter table public.profiles
  add column if not exists iafarma_nombre_comercial text,
  add column if not exists iafarma_servicios text[],
  add column if not exists iafarma_marcas text[],
  add column if not exists iafarma_web text,
  add column if not exists iafarma_instagram text,
  add column if not exists iafarma_perfil_validado_at timestamptz,
  add column if not exists iafarma_perfil_fuentes jsonb;

-- 2. Registro de búsquedas (límite de 3 por farmacia y día). Solo lo escribe
--    la edge function con service role: RLS activo y sin políticas de usuario.
create table if not exists public.iafarma_perfil_busquedas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  fuentes text[] not null default '{}',
  coste_estimado numeric(8,4) not null default 0
);

create index if not exists iafarma_perfil_busquedas_user_created_idx
  on public.iafarma_perfil_busquedas (user_id, created_at);

alter table public.iafarma_perfil_busquedas enable row level security;

-- 3. Interruptor del alta guiada, apagado hasta el sí de Francesc.
--    system_settings.key es UNIQUE.
insert into public.system_settings (category, key, value, description)
values ('iafarma', 'alta_guiada_activa', 'false'::jsonb,
        'Alta guiada de IAFarma: obliga a validar la ficha de la farmacia antes de generar')
on conflict (key) do nothing;
