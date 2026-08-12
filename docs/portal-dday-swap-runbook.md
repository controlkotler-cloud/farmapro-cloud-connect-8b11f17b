# Runbook · swap D-day farmapro.es ↔ portal.farmapro.es

> D-day: **jueves 10-09** (slot C8, envío especial de lanzamiento de la Rebotica).
> Objetivo: que `/portal` en farmapro.es deje de ser la página "Próximamente" y pase a
> ser la landing de venta real del portal, y que `/rebotica` en farmapro.es redirija a
> `portal.farmapro.es/rebotica`, sin que nada de esto se note antes de tiempo.
> Todo lo nuevo está preparado y APAGADO (`PORTAL_LIVE = false` en
> `farmapro-direct/src/lib/portalLaunch.ts`). El swap es cambiar ese flag + pegar el
> Worker: en total, 1 minuto de trabajo real.

## Estado antes del D-day (ya hecho, verificado en esta sesión)

- `farmapro-direct/src/lib/portalLaunch.ts`: flag `PORTAL_LIVE = false` + constantes
  `PORTAL_URL`, `PORTAL_REGISTRO_URL`, `PORTAL_LOGIN_URL`, `REBOTICA_URL`.
- `farmapro-direct/src/pages/PortalLanzamiento.tsx`: landing real (hero, features,
  bloque Rebotica, 3 planes con precios de lanzamiento). Lista pero sin usar.
- `farmapro-direct/src/App.tsx`: la ruta `/portal` ya decide entre `Portal` (próximamente)
  y `PortalLanzamiento` según `PORTAL_LIVE`. Con el flag en `false`, sirve exactamente
  lo mismo que hoy en producción.
- `impulso/06-tecnico/cloudflare-worker/edge-renderer.js`:
  - 301 `/rebotica` → `https://portal.farmapro.es/rebotica` ya añadido a
    `REDIRECTS_301` y **ya activo en cuanto se despliegue el Worker** (no depende del
    flag; hoy en farmapro.es esa ruta no existe, así que no rompe nada).
  - Meta nuevo de `/portal` para el D-day preparado y **comentado** con el marcador
    `// D-DAY:` justo debajo del bloque `/portal` actual en `STATIC_ROUTES`.
- `farmapro-portal` (portal): `AuthHeader.tsx` ya muestra "← volver a farmapro.es" y el
  `Footer.tsx` del dashboard ya enlaza a farmapro.es. No requieren tocar nada el D-day.

## Pasos del swap (orden y quién)

1. **Activar el flag (Francesc o Claude Code, ~1 min)**
   - En `farmapro-direct/src/lib/portalLaunch.ts`, cambiar `PORTAL_LIVE = false` a
     `PORTAL_LIVE = true`.
   - `git add -A && git commit -m "D-day: activa PortalLanzamiento en /portal" && git push`.
   - Lovable/Cloudflare Pages (o el pipeline que sirva farmapro-direct) despliega solo.
   - **Quién**: puede hacerlo Claude Code (push) en el momento que Francesc lo confirme.

2. **Pegar el Worker actualizado (Francesc, ~1 min)**
   - Abrir `impulso/06-tecnico/cloudflare-worker/edge-renderer.js`.
   - Descomentar el bloque `// D-DAY:` de `/portal` en `STATIC_ROUTES` y borrar (o dejar
     comentado, da igual) el bloque de "Portal del titular" antiguo, para que solo quede
     un objeto `/portal` activo con el meta nuevo.
   - El 301 de `/rebotica` ya está activo desde que se pegue esta versión del Worker
     (no requiere ningún cambio adicional ese día).
   - Pegar el contenido completo en el editor del Worker en Cloudflare y publicar.
   - **Quién**: Francesc (acceso al dashboard de Cloudflare Workers).

3. **Purge Everything en Cloudflare (Francesc, ~1 min)**
   - Cache → Purge Everything en el dominio farmapro.es, para que el meta/HTML nuevo
     de `/portal` y el 301 de `/rebotica` se sirvan sin caché vieja de por medio.

4. **Verificación en vivo (Francesc + Claude Code, ~5 min)**
   - `https://farmapro.es/portal` carga `PortalLanzamiento`: hero "El portal de la
     farmacia", planes con precios de lanzamiento, CTA "Crear cuenta gratis" apunta a
     `https://portal.farmapro.es/login?modo=registro`.
   - `curl -I https://farmapro.es/rebotica` devuelve `301` con
     `Location: https://portal.farmapro.es/rebotica`.
   - Ver fuente de `/portal` (view-source o `curl`): `<title>` y meta description son
     los nuevos, `robots: index, follow`.
   - Entrar en `portal.farmapro.es/login`: se ve el enlace "← volver a farmapro.es".

5. **Email del D-day (Alejandro/Francesc, vía Clientify)**
   - El envío especial C8 incluye a la lista habitual **Y TAMBIÉN a la waitlist**
     capturada por `subscribe-portal-waitlist` (tabla en Supabase del proyecto de
     farmapro-direct): son quienes ya pidieron que se les avisara cuando el portal
     estuviera listo, no hay que olvidarlos en la segmentación del envío.

6. **Rollback (si algo falla)**
   - `farmapro-direct/src/lib/portalLaunch.ts`: volver `PORTAL_LIVE` a `false` +
     `git commit && git push`. `/portal` vuelve a mostrar "Próximamente" al instante
     (siguiente deploy).
   - Si el problema es del Worker, volver a pegar la versión anterior (guardada antes
     de publicar) y Purge Everything otra vez.
   - El 301 de `/rebotica` puede dejarse activo aunque se haga rollback del resto: si
     el portal sigue en pie, la redirección sigue siendo correcta.

## Notas

- Nada de esto requiere tocar Nav.tsx ni Portal.tsx: siguen existiendo tal cual, solo
  dejan de usarse en `/portal` cuando `PORTAL_LIVE = true`.
- El Worker NO debe tocarse en las líneas del passthrough de assets ni en los 301 a
  mkpro.es (bloque `REDIRECTS_301` con las URLs `mkpro.es/...`): esta tanda no las ha
  movido de sitio, pero conviene revisarlo antes de pegar por si el fichero se ha vuelto
  a tocar entre medias.
- Verificar siempre `file edge-renderer.js` = "text" (o "Unicode text, UTF-8") antes y
  después de editar: si aparecen null bytes, el fichero se ha corrompido y no se debe
  pegar en Cloudflare.
