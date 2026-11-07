# Cuenta gratis permanente: spec (07-11-2026)

Decisión de Francesc del 07-11: el muro del día 31 se sustituye por una cuenta gratis que no caduca. Incluye solo dos cosas: la herramienta de Impulso de la quincena en curso y el cajón de la Rebotica del mes. Todo lo demás lleva candado y una invitación a Plus. La prueba completa de 30 días y el precio de fundador (19,90 €, 100 plazas, sin cifra pública) no cambian.

BD leída el 07-11. Hay 81 cuentas sin pago: 63 bloqueadas y 18 en prueba. Cuando se despliegue, las 63 pasan a «gratis» de golpe.

## Qué cambia (una PR, solo portal)

1. **Estado nuevo `gratis`** en lugar de `free_locked`, en `getAccessState` (`src/lib/plans.ts`) y en `useEntitlements`. El cálculo del fin de prueba se queda como está: `max(alta + 30 d, trial_ends_at)`. El cálculo está duplicado y se cambia en cada sitio:
   - cliente: `AppRoutes`, `useCourses`, `CourseCard`, `CourseView`, `AsistenteCreativo`, `Rebotica`, `Precios`, `PlanTab`, `useCreativeChat` y `useImageGeneration`;
   - BD: `get_course_modules` y la RLS de la tanda 2, que siguen dando el temario de cursos solo en prueba (correcto para la cuenta gratis), además de `rebotica_open_cajon`;
   - edge functions: las tres `ai-*`.
2. **Interruptor nuevo** `system_settings` `subscription.modo_gratis` = `permanente` | `muro`. No se reutiliza `validation_mode`, porque `check-subscription` también lo usa para saltarse la sincronización con Stripe en `beta`. Con `muro`, todo vuelve a funcionar como hoy, incluida la redirección a /precios de `AppRoutes`. Con `permanente`, esa redirección desaparece.
3. **Herramienta de la quincena, sin columna nueva.** Regla: los recursos `is_newsletter` de un mismo `newsletter_ref` son gratis mientras su ventana siga abierta. La ventana se cierra en el `open_until` más tardío de ese ref, que es el de la guía PDF (el Excel lo tiene a NULL). Cuando se cierra, el recurso pasa a Plus. `useResources` tendrá que leer además `open_until` y `newsletter_ref`. Las columnas ya existen en la BD (se crearon fuera de las migraciones del repo). Es la misma fecha que ya usa `descarga-abierta` para la descarga sin cuenta, así que las dos ventanas coinciden.
4. **Cajón:** `rebotica_open_cajon` deja de devolver `prueba_terminada` en modo `permanente`, con tier `gratis`. `Rebotica.tsx` quita la tarjeta «Los cajones son para suscriptores». El cajón del mes sale por `_source='welcome'`, que no depende de Retos (`_source='reto'` exige un reto completado). La prueba real lo confirma.
5. **Candados con tarjeta y botón a Plus** en Recursos (fuera de la quincena), Formación, IAFarma/Asistente y cursos. Reutiliza `AccessLockedCard` con textos nuevos. En `LOCKED_PATHS` de la barra lateral, Recursos deja de estar bloqueado entero, porque dentro está la herramienta de la quincena. El candado de Recursos va en cada recurso.
6. **`TrialLockedBanner` y `TrialLockedDialog`** pasan a ser «Tu cuenta gratis». La franja dice lo que tienes (herramienta de la quincena + cajón) y lo que está en Plus. El aviso sale una vez por sesión.
7. **Errores reales que se arreglan de paso:**
   - en `Recursos.tsx`, `isLocked` se comprueba antes que `unlockedByReward`, así que quien gana un recurso premium en el cajón no puede descargarlo;
   - en `PlanTab`, la etiqueta «Prueba finalizada» pasa a «Gratis».
8. **IA en las edge functions** (`ai-portal-chat`, `ai-creative-assistant`, `ai-generate-image`): siguen devolviendo 403 a la cuenta gratis, pero con texto nuevo. Mismo cambio de texto en `open-reward`.
9. **Correos** (`_shared/portalEmailTemplates.ts`):
   - `prueba-dia20`, `fin-prueba` (días 23 y 28) y `prueba-bloqueada` (día 31): de «se cierra / pierdes / queda bloqueado» a «pasas a la cuenta gratis: la herramienta de cada quincena y el cajón del mes; el resto, con Plus»;
   - `oferta-mes-plus` (F11) no cambia.
10. **/precios:**
    - tarjeta Gratis con estas líneas: «Gratis para siempre», «La herramienta de Impulso de cada quincena», «El cajón de la Rebotica del mes», «30 días de prueba completa al empezar»;
    - fuera el párrafo «modo solo-ver» y el aviso «Tu prueba de 30 días ha terminado»;
    - `showBackToPortal` también para la cuenta gratis.

**Despliegue:** push y luego `deploy_project`. Además, una sola petición cerrada a Lovable para redesplegar `send-portal-email`, `ai-portal-chat`, `ai-creative-assistant`, `ai-generate-image` y `open-reward`. Migración: la clave `modo_gratis` y el cambio en `rebotica_open_cajon`, aplicados por `query_database`.

**Pruebas:** unitarias de `getAccessState` y de la regla de la ventana. Después, prueba real con una cuenta gratis de pruebas: descarga la herramienta de la quincena, no puede con la de la quincena anterior, abre el cajón, ve los candados y IAFarma le da 403 con el texto nuevo. Por último, se cambia a `muro` para comprobar que vuelve a /precios.

## Riesgos

- **El candado de los recursos normales solo está en el navegador.** La política de `recursos-portal` deja firmar cualquier fichero a cualquier usuario con sesión. Ya pasa hoy con las cuentas bloqueadas. Arreglarlo en el servidor es otra PR (D5).
- **Fecha de corte:** la herramienta pasa a Plus a la hora exacta de `open_until`. Si un `open_until` está mal cargado, la herramienta se abre o se cierra antes de tiempo. Los de N28-N33 tienen fechas que encajan con su quincena (leído en BD el 07-11).
- **Deshacer:** poner `modo_gratis = muro` deja el portal como hoy, pero los textos nuevos de los correos siguen. Para volver del todo hay que redesplegar la plantilla anterior.

## Lo que necesita tu sí (recomendación primero)

- **D1. «Nada más», al pie de la letra:** candado también en Retos, Comunidad y Eventos, que hoy siguen abiertos. Al cerrar Retos desaparece la apertura extra del cajón por reto. *Recomiendo: sí, literal.* La alternativa es dejar Comunidad y Eventos en solo lectura.
- **D2. Prueba de 30 días igual que hoy**, con los mismos topes: 2 cursos, 3 recursos, 2 textos y 1 imagen de IA. *Recomiendo: sí.* La otra opción es quitar los topes y que la prueba sea completa de verdad.
- **D3. Premio «3 créditos de imagen IAFarma»** (199 de 200 en noviembre): a una cuenta gratis no le sirve, porque la IA está cerrada. *Recomiendo: dejar que esos créditos ganados funcionen aunque la IA esté cerrada.* Así el premio da a probar Plus. La alternativa es sacar el premio del tier gratis.
- **D4. Fin de la promesa del 15-09**, que decía que las herramientas de Impulso son gratis para siempre en el portal. Con la regla nueva, solo lo son durante su quincena, también para quien ya las bajó. *Recomiendo: sí, como dijiste («Sí, a Plus»).*
- **D5. Aceptar por ahora el candado solo en el navegador** y blindar el almacenamiento en otra PR. *Recomiendo: sí.*
- **Para construir:** sí a esta spec. Fusionar, desplegar y encender (`modo_gratis = permanente`) llevan cada uno su sí.

## Fuera de esta PR, pero bloquea el relanzamiento

- **No hay campaña de la Rebotica para diciembre ni para enero.** En `rebotica_campaigns` hay 0 campañas desde el 01-12. `rebotica_cron_daily` solo activa campañas en borrador que ya existen; no crea ninguna. La temporada «2026-otonio» se cierra con el Gordo el 01-12. Sin una temporada 2 cargada, no hay «cajón del mes» que ofrecer el 07-01.
- La medición pendiente (UTM, `download_count` a 0 y los 31 errores de correo) y el correo «vuelve» para las ~55 cuentas ya bloqueadas van aparte.
