-- El interruptor del alta guiada lo lee el navegador de cada farmacia.
-- Hasta hoy system_settings solo dejaba leer a usuarios normales unas
-- categorías concretas, así que con el interruptor encendido el alta
-- solo salía a los administradores. Esta política deja leer esa fila y
-- nada más de la categoría iafarma.
drop policy if exists "Alta guiada legible por usuarios" on public.system_settings;
create policy "Alta guiada legible por usuarios"
  on public.system_settings
  for select
  to authenticated
  using (category = 'iafarma' and key = 'alta_guiada_activa');
