# Relanzamiento del portal 07-14/01/2027: checklist

Estado a 07-11-2026. Nada de esto se ejecuta solo: la migración y las edge functions las aplica Francesc (o una sesión con su sí).

## 0. Orden de despliegue

1. Aplicar `supabase/migrations/20261108090000_relanzamiento_medicion.sql` con `query_database` (idempotente).
2. Push, y pedir a Lovable el despliegue de `send-portal-email` (reintento ante timeout y plantilla nueva).
3. `deploy_project` del frontend y comprobar en vivo que `track_resource_download` y `track_resource_view` responden (ver 1).
4. Antes del 01-12, revisar los premios de la Rebotica (ver 2).
5. Antes del 07-01, cargar la herramienta N35 (ver 3) y decidir el envío de "vuelve" (ver 4).

## 1. Contadores de recursos

- Columna canónica de descargas: `resources.download_count`. `downloads_count` queda obsoleta (comentada en la migración, no se borra).
- `view_count` nueva. RPC `track_resource_download(uuid)` y `track_resource_view(uuid)`, SECURITY DEFINER, ejecutables por `anon` y `authenticated`.
- Cliente: `contarDescarga` y `contarVista` en `src/lib/descargas.ts`, fire-and-forget. Descarga contada en `Recursos.tsx`, `Descarga.tsx` y `ModuleResourcesSection.tsx`; vista al abrir la ficha (`/recursos?r=<slug>` y `/descarga/:slug`), una por recurso y sesión.
- Prueba tras aplicar: `select track_resource_view('<id>')` y comprobar `view_count`; después revertir a mano el +1 de prueba.

## 2. Rebotica diciembre y enero

- Campañas en `draft`: `...-202612010000` (01-12 a 31-12) y `...-202701010000` (01-01 a 31-01). El cron las activa el día de inicio y las cierra al acabar.
- 9 premios por campaña copiados de noviembre (mismo tipo, tier, peso, stock y caducidad), ids deterministas.
- Para revisar a mano antes del 01-12:
  - "Masterclass del vault": la descripción enlaza a la masterclass concreta de noviembre.
  - "Recurso premium desbloqueado" y "Plantilla exclusiva de la Rebotica": el contenido al que apuntan es el de noviembre (la plantilla "Termómetro del cliente" ya se usó en octubre). Cambiar si hay contenido nuevo.
  - Stock del Baúl: quedan 1 de 3 y el sorteo del 01-12 se lo lleva. Los del 01-01 y 01-02 se sortean igual (usuario ganador) pero sin premio asignado hasta que se reponga el stock del premio con `peso = 0`.
- `rebotica_cron_daily`: la temporada pasa a `2027-invierno` desde el 02-12; la ventana de sorteos llega al 01-02-2027.
  - Gordo: se mantiene el cierre de temporada el 01-12-2026 (aperturas sep-nov).
  - Baúl: se sortea el 01-12 (noviembre, temporada otoño), el 01-01 (diciembre) y el 01-02 (enero), estos dos en temporada `2027-invierno`, con la regla de un Baúl por usuario y por temporada.
  - Qué pasa en enero: sigue habiendo cajón mensual y Baúl, pero sin Gordo. Si se quiere un Gordo de invierno hay que decidir fecha y añadirlo.

## 3. Herramienta N35 como herramienta de la quincena

Comprobado en BD el 07-11-2026: NO existe ningún recurso con `newsletter_ref = 'N35'` (el último es N33, sin publicar). No se ha inventado nada.

La cuenta gratis da la herramienta mientras `now() < max(open_until)` de su `newsletter_ref`. En N31 y N33 la fecha la lleva la guía PDF y la herramienta xlsx tiene `open_until` nulo; para N35 vale cualquiera de las dos filas, siempre que una lleve la fecha.

Antes del INSERT: subir el fichero al bucket `recursos-portal` y comprobar que está en `storage.objects` (no con curl al dominio).

```sql
-- Plantilla. Rellenar slug, título, descripción y nombre de fichero reales.
INSERT INTO public.resources
  (title, slug, description, category, type, format, file_url,
   is_premium, is_published, is_newsletter, newsletter_ref, open_until)
VALUES (
  '<TÍTULO DE LA HERRAMIENTA N35>',
  'fp-imp-n35-<slug>',
  '<DESCRIPCIÓN>',
  'impulso', 'herramienta', 'xls',
  'https://jeysistgdajopfruqpbc.supabase.co/storage/v1/object/recursos-portal/impulso-n35-<fichero>.xlsx',
  false,
  false,                                   -- publicar después de comprobar el fichero
  true, 'N35',
  TIMESTAMPTZ '2027-01-28 23:59:00 Europe/Madrid'  -- EJEMPLO: confirmar con Francesc
)
ON CONFLICT (slug) DO NOTHING;
```

Notas: `category` es el enum `resource_category` (valor `impulso`), `format` el enum `resource_format` (`xls`, `pdf`...) y `type` es `herramienta` o `guia`. Si `slug` no tiene restricción única en producción, sustituir `ON CONFLICT` por un `WHERE NOT EXISTS`. Para publicarla: `update resources set is_published = true where slug = 'fp-imp-n35-<slug>'`.

## 4. Aviso "vuelve" (NO enviado)

Plantilla `cuenta-gratis-vuelve` añadida a `supabase/functions/_shared/portalEmailTemplates.ts` y registrada en `send-portal-email`. No está conectada a ningún envío ni cron. Es comercial: firma Alejandro y lleva la nota de consentimiento.

Segmento (cuentas bloqueadas por la pared, sin pago, sin equipo, sin supresión). Recuento a 07-11-2026: **56** (las 56 con consentimiento comercial).

```sql
with base as (
  select u.id, u.email,
         (case when p.trial_ends_at > u.created_at + interval '30 days'
               then p.trial_ends_at else u.created_at + interval '30 days' end) as fin
    from auth.users u join public.profiles p on p.id = u.id
   where u.email is not null
     and coalesce(p.subscription_role::text,'freemium')
         not in ('plus','equipo','premium','profesional','admin','estudiante')
     and split_part(lower(u.email),'@',2) not in ('mkpro.es','farmapro.es')
     and not exists (select 1 from public.subscriptions s where s.user_id = u.id)
     and not exists (select 1 from public.team_members tm
                      where tm.user_id = u.id and tm.status <> 'inactive')
     and not exists (select 1 from public.team_subscriptions ts where ts.owner_id = u.id)
     and not exists (select 1 from public.suppressed_emails se where lower(se.email) = lower(u.email))
)
select id, email from base
 where fin < now()
   and exists (select 1 from public.consent_ledger c
                where c.tipo = 'comercial'
                  and (c.user_id = base.id or lower(c.email) = lower(base.email)));
```

Antes de enviar: repetir el recuento ese día, cruzar con Clientify (las altas del portal no entran solas) y definir el mecanismo de envío (lote con límite, como `notify_oferta_mes_plus`). Quitar el filtro de consentimiento solo con el sí de Francesc: la plantilla es comercial.

## 5. Errores de email (31 en `portal_email_log`)

- 16 en `novedades-semanal` y 15 en `oferta-mes-plus`: todos `statement timeout` al encolar (`enqueue_email`) desde la edge function, rol con tope de 8 s.
- Arreglo: reintento (hasta 3 veces, con espera) solo ante timeout en `send-portal-email`. Mismos destinatarios y misma clave de idempotencia. Un `SET statement_timeout` en `send_weekly_digest` o `notify_oferta_mes_plus` no sirve: se probó que no rearma el temporizador ya activo.
- Tras desplegar, vigilar los dos próximos lunes: `select error, count(*) from portal_email_log where status='error' and created_at > now() - interval '8 days' group by 1`.
