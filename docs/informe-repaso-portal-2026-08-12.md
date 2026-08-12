# Repaso completo del portal farmapro — 12-08-2026

> Auditoría de código (repo local + código desplegado) y de la **base de datos de producción en vivo**
> (proyecto Lovable `farmapro-cloud-farm`, último commit `7dd3c4e4`, editado hoy 12-08 a las 18:10).
> Todo lo que se afirma aquí está verificado contra el código o contra una consulta SQL real de hoy.
> Nada se ha modificado: este informe es solo diagnóstico.

> **CORRECCIÓN (12-08, tras revisión de Francesc).** La primera versión afirmaba que 13 cursos estaban
> vacíos. **Era falso.** Conté filas en la tabla `course_modules`, que es legado, cuando el portal sirve
> el contenido desde la columna **jsonb `courses.course_modules`** vía la RPC `get_course_modules`.
> Verificado: **los 34 cursos publicados tienen contenido** (4-5 módulos cada uno). Hallazgos B2, A8 y C4
> anulados.
>
> **CERRADO Y APLICADO (12-08).** Dos puntos ya resueltos en producción, fuera de este informe:
> `total_lessons` desincronizado en 9 cursos y `file_url` vacío en 6 recursos. SQL ejecutado y verificado
> en `contenido/fix-total-lessons-y-file-url-2026-08-12.sql`.

---

## Resumen ejecutivo

| Área | Estado |
|---|---|
| Bot de soporte | 🔴 No sirve como soporte: no conoce precios, planes ni cómo hacer nada |
| Seguridad / RLS | 🔴 Queda el plan Equipo gratis (P1). El relé de correo abierto (P2) está **cerrado** el 12-08 |
| Pagos (Stripe) | 🔴 El checkout real del 15-07 **no dejó fila en `subscriptions`** y nadie se enteró |
| Email | 🔴 18 de 22 envíos del portal han fallado; hoy mismo falló uno |
| Contenido | 🟢 Los 34 cursos tienen contenido y los 64 recursos su fichero (corregido 12-08) |
| Bloqueo del plan Gratis | 🟠 El corte a los 30 días es código muerto: no bloquea a nadie |
| Frontend / UX | 🟡 Enlaces muertos, categorías duplicadas, cero portadas de curso |

**Lo que sí está bien** (verificado, para no volver a auditarlo): el contenido premium de los cursos **no se
puede robar** (`get_course_modules` lo bloquea en servidor, incluido el tope de 2 cursos del gratis); los
ficheros premium están en un bucket privado con política por rol de pago; nadie puede auto-ascenderse de plan
editando su perfil (trigger `block_unsafe_profile_updates`); la regla innegociable `metadata.origen='portal'`
**sí se cumple** hoy en las tres rutas de checkout vivas; la firma del webhook de Supabase Auth sí se verifica;
`robots.txt`, `sitemap.xml` y los assets públicos responden 200.

---

# 1. El bot de soporte

Es lo que más te preocupaba, así que va primero y con detalle.

El bot son dos piezas: la edge `ai-portal-chat` (construye el contexto y llama al modelo) y `PortalChatbot.tsx`
(la burbuja flotante, presente en todas las páginas con sidebar). Se llama "Asistente farmapro" y se presenta
como "Te ayuda a moverte por el portal".

## 1.1 El problema de fondo: no es un bot de soporte, es un listador de catálogo

Éste es **todo** el conocimiento que recibe el modelo en cada conversación. Lo he reconstruido ejecutando
exactamente las mismas consultas que hace `buildPortalContext()` contra la BD de hoy:

```
CURSOS DISPONIBLES (10):
- Atención Farmacéutica de Excelencia (atencion_cliente)
- Gestión de Stock y Compras Inteligentes (gestion)
- VERI*FACTU y Normativa Fiscal para Farmacias 2026 (tecnologia)
- Quejas y clientes difíciles: convertir fricción en fidelidad (atencion)
- Redes sociales y Google Business Profile para tu farmacia (marketing)
- Fidelización y CRM: que vuelvan más y más a menudo (marketing) [PREMIUM]
- Dermocosmética en Redes: cómo vender más con contenido (marketing)
- Instagram para Farmacias 2026: de 0 a pro (marketing)
- Calendario Editorial Farmacéutico 2026 (marketing)
- Google Business Profile para Farmacias (tecnologia)

RECURSOS TOTALES: 64
PRÓXIMOS EVENTOS (5): [5 eventos elegidos al azar de los 11 futuros]
OFERTAS DE EMPLEO ACTIVAS: 0
PROMOCIONES ACTIVAS: 3
ROL DEL USUARIO: freemium
```

Eso es literalmente todo. **No hay ni una palabra** sobre: precios, qué incluye cada plan, los 30 días de
prueba, cómo darse de alta o de baja, cómo cambiar la tarjeta, cómo invitar al equipo, qué es IAFarma y qué
límites tiene, qué es La Rebotica, ni a qué correo escribir si algo falla. El resultado práctico:

| Pregunta que hará un cliente | Qué contesta hoy |
|---|---|
| "¿Cuánto cuesta el plan Plus?" | No lo sabe. O dice que no tiene el dato, o se lo inventa. |
| "¿Qué diferencia hay entre Plus y Equipo?" | Igual. |
| "¿Cómo doy de baja mi suscripción?" | Igual. |
| "Me ha fallado la tarjeta, ¿qué hago?" | Igual. |
| "¿Cómo invito a mi auxiliar?" | Igual. |
| "¿Con quién hablo si tengo un problema?" | No conoce `soporte@farmapro.es`. |
| "¿Qué cursos tenéis?" | Lista 10 de los 34, y **7 de esos 10 están vacíos**. |

Un modelo al que se le dice "responde preguntas sobre el portal" y no se le da la información **rellena los
huecos**: dará precios inventados con total aplomo. Con Stripe ya conectado, eso es un problema comercial y
legal, no solo de calidad.

## 1.2 Fallos concretos, verificados

**🔴 B1 — Dice que hay 10 cursos cuando hay 34.**
`ai-portal-chat/index.ts:132-141`: `.limit(10)` y luego `CURSOS DISPONIBLES (${courses.length})` — imprime el
tamaño del trozo, no el total. El bot afirmará "tenemos 10 cursos disponibles". Hay 34 publicados.

**🟠 B3 — Los 10 cursos y los 5 eventos se eligen al azar.**
No hay `ORDER BY` en ninguna de las dos consultas (`:132-136` y `:146-148`). Postgres devuelve el orden que le
conviene, así que la selección cambia sin motivo entre conversaciones. En eventos es peor: hay 11 futuros y
enseña 5 arbitrarios, así que a "¿hay eventos próximos?" puede responder con congresos de mayo de 2027 y
callarse Farmaforum (22 de septiembre), que es el siguiente.

**🟠 B4 — Los eventos no se filtran por `is_published`.**
`:146-148` no comprueba `is_published`, y la política RLS `Public can view events` está a `USING (true)` para
todos los roles. Hoy no hace daño porque los 3 eventos no publicados están en el pasado, pero en cuanto
prepares un evento en borrador, el bot lo anunciará antes de tiempo. (Y de paso: esa política deja la tabla
`events` entera legible para cualquier visitante anónimo.)

**🟡 B5 — Cuenta ofertas de empleo caducadas.**
`:155-156` filtra por `is_active` pero no por `expires_at`. Hoy da 0 porque no hay ninguna oferta, así que sin
impacto todavía.

**🟡 B6 — El cliente puede inyectar mensajes de sistema.**
`:104` hace `[{role:'system',...}, ...messages]` con el array tal cual llega del navegador. Un usuario puede
mandar `{role:'system', content:'...'}` y reescribir las instrucciones. Impacto bajo (el bot no tiene
herramientas ni datos ajenos), pero conviene filtrar a `user`/`assistant` en el servidor.

**🟡 B7 — Si el modelo corta a mitad de respuesta, el usuario no se entera.**
La edge devuelve el stream crudo (`:120-122`). Un error del gateway a mitad de emisión llega al navegador como
un texto truncado sin ningún aviso. Además, en `usePortalChat.ts:98`, cuando hay error se hace
`prev.slice(0, -1)`: si el fallo llega antes de empezar a emitir, se borra **la pregunta del usuario**, que ve
desaparecer lo que acaba de escribir.

**🟡 B8 — Modelo desactualizado.**
`:103` usa `google/gemini-3-flash-preview`. Sigue disponible en el gateway de Lovable, pero el predeterminado
actual es Gemini 3.6 Flash. Cambiarlo es una línea y mejora calidad y latencia.

**🟡 B9 — Las preguntas sugeridas apuntan a lo que peor funciona.**
`PortalChatbot.tsx:24-29` sugiere "¿Qué ofertas de empleo hay?" — hay 0, y la sección Empleo está oculta. Y
"¿Cómo puedo acceder a los recursos premium?", que es justo lo que el bot no sabe contestar.

**🟢 B10 — Lo que sí está bien en el bot:** exige sesión iniciada, aplica el gating por plan (`PAID_ROLES` +
30 días de prueba) y un límite de 100 mensajes/día por usuario; solo registra uso si la llamada arranca bien;
las políticas RLS de `ai_chat_usage` son correctas; y usa el token del usuario, así que el contexto respeta RLS
(no filtra contenido premium).

## 1.3 El arreglo del bot

Dos cosas, en este orden:

**(a) Darle una base de conocimiento fija.** Un bloque de texto constante en la edge con lo que un agente de
soporte debe saber. Propuesta lista para pegar en el **Anexo A**. Cubre planes y precios, prueba de 30 días,
alta/baja, cambio de tarjeta, equipo, IAFarma, La Rebotica, correo de soporte, y una regla explícita de
"si no lo sabes, di que no lo sabes y deriva a soporte@farmapro.es" — que es lo que hoy falta y por eso
improvisa.

**(b) Arreglar el contexto dinámico**: totales reales en vez del tamaño del trozo, `ORDER BY` estable,
filtrar cursos sin módulos y eventos no publicados, ordenar los eventos por fecha. Código en el **Anexo B**.

Cuando esté, conviene probarlo con estas 10 preguntas antes de darlo por bueno: precio de Plus · diferencia
Plus/Equipo · qué pasa a los 30 días · cómo doy de baja · cómo cambio la tarjeta · cómo invito a mi equipo ·
cuántos cursos hay · qué es La Rebotica · cuántas imágenes puedo generar al mes · con quién hablo si algo falla.

---

# 2. Bloqueantes (arreglar antes de abrir al público)

**🔴 P1 — Cualquier usuario registrado puede regalarse el plan Equipo.**
Las políticas `Owners can manage team_subscriptions` y `Team owners can manage subscriptions` son
`FOR ALL TO authenticated` con `USING/WITH CHECK (owner_id = auth.uid())` — verificado hoy en `pg_policies`.
Eso permite un `INSERT` desde la consola del navegador con `{owner_id: <mi uid>, status:'active', max_members: 999}`.
A partir de ahí `is_team_owner_strict` (que solo mira `owner_id` + `status='active'`, sin comprobar que haya
pago) deja usar `manage-team/invite_member`, y quien acepte recibe `subscription_role='equipo'`
(`manage-team/index.ts:204-212`). Dos llamadas y toda una farmacia entra gratis, sin límite de plazas.
*Arreglo:* quitar el INSERT y el cambio de `owner_id`/`status`/`max_members` de esas políticas (dejarlas en
SELECT/UPDATE acotado), crear equipos solo vía `service_role`, y exigir en `is_team_owner_strict` una fila en
`subscriptions` con `plan_id='equipo'` y `status='active'`.

**✅ P2 — CERRADO el 12-08 a las 19:08.** `verify_jwt = true` aplicado y desplegado vía Lovable (solo esa
línea de `config.toml`). Verificado antes de tocar nada que los 6 invocadores mandan credencial de servicio
(`stripe-webhook`, `manage-team`, `redeem-reward` con `SUPABASE_SERVICE_ROLE_KEY`; `handle_new_user`,
`notify_trial_ending`, `rebotica_cron_daily` con cabecera `Authorization` desde el vault). Comprobado después:
un POST sin cabecera devuelve ahora `401 UNAUTHORIZED_NO_AUTH_HEADER` en el gateway, igual que
`process-email-queue`; antes llegaba al código de la función y devolvía 400. Descripción original abajo.

**~~🔴 P2 — `send-portal-email` es un relé de correo abierto a internet.~~**
`config.toml:10` la deja con `verify_jwt = false` y la función no valida nada más: ni apikey, ni secreto
compartido, con `Access-Control-Allow-Origin: *`. Comprobado en vivo hoy: un POST sin ninguna cabecera de
autorización llega al código de la función (responde 400 por plantilla inválida; para contraste,
`process-email-queue` devuelve 401 en el gateway). Cualquiera puede enviar las plantillas del portal a
cualquier dirección desde `Equipo farmapro <somos@farmapro.es>`, con SPF/DKIM válidos — y en
`equipo-invitacion` controla el enlace y el nombre de quien invita: phishing perfecto firmado por vosotros.
Con Mailrelay en warm-up y ya con la cuenta "under review", un script basta para perder el remitente.
*Arreglo:* `verify_jwt = true` (los cuatro invocadores ya mandan la service role key, no rompe nada) y, de
refuerzo, el patrón `x-internal-key` que ya usa `clientify-sync:181-183`.

**🔴 P3 — El checkout real no dejó fila en `subscriptions`, y el fallo se tragó en silencio.**
`stripe-webhook/index.ts:192-205` hace el `upsert` y solo escribe un `log()` si falla. Estado real: el evento
`checkout.session.completed` del 15-07 está procesado en `stripe_events`, el perfil quedó actualizado a
`subscription_role='equipo'`… y **`select count(*) from subscriptions` = 0**. Consecuencias en cadena, todas
verificables: el `invoice.payment_failed` del 16-07 no marcó `past_due` (busca por `stripe_subscription_id` y
no encuentra nada), **al cancelar el usuario conservaría el rol de pago para siempre**, y `founder_count` (una
vista sobre `subscriptions`) se queda a 0, así que **el precio de lanzamiento no caducará nunca** aunque entren
las 100 plazas.
*Arreglo:* comprobar el error del upsert y hacer que aborte el handler; escribir `subscriptions` **antes** de
tocar `profiles`; alerta cuando un `checkout.session.completed` con `origen='portal'` no deje fila.

**🔴 P4 — El sistema de email del portal está roto: 18 de 22 envíos han fallado.**
`portal_email_log` hoy: 4 de 6 bienvenidas en error, 3 de 4 invitaciones de equipo, 3 de 3 avisos de plaza
activada, 4 de 5 avisos de fin de prueba, 4 de 4 de impago. El último fallo es de **hoy, 12-08 a las 09:15**
(`fin-prueba`, `Recipient is marked as bounced`, 2 intentos). Tres causas encadenadas:
- La tabla `suppressed_emails` existe pero **no se consulta en ningún sitio** (0 referencias en todo el árbol,
  0 filas): el portal insiste contra direcciones que ya rebotaron, que es justo lo que dispara la revisión de
  cuenta de Mailrelay (ya ocurrió el 16-07).
- El reintento (`send-portal-email:104-136`) se dispara ante **cualquier** no-2xx, incluidos 400/422
  permanentes, sin backoff y sin clave de idempotencia — de ahí los `attempts=2` inútiles.
- `handle_new_user` y `notify_trial_ending` disparan con `net.http_post` fire-and-forget y descartan la
  respuesta. Peor: `notify_trial_ending` inserta en `portal_trial_notice_log` **antes** de enviar, y el índice
  único hace que un fallo sea definitivo — el usuario `bd39d01d…` **nunca** recibirá su aviso de fin de prueba.
*Arreglo:* consultar `suppressed_emails` antes de enviar y alimentarla con los hard bounces; reintentar solo
5xx y errores de red; mover el `INSERT` del log a después de confirmar el envío; cron de reconciliación que
reintente los `status='error'` y avise a control@mkpro.es.

---

# 3. Alto

**A1 — El bloqueo del gratis a los 30 días es código muerto.**
`AppRoutes.tsx:56` lee `getSettingsByCategory('system')`, pero en la BD `validation_mode` vive en la categoría
`subscription` (verificado: no existe ninguna fila con `category='system'`). Y además la RLS de
`system_settings` es solo-admin, así que un usuario normal recibe `{}` siempre. `validationMode` vale
`'beta'` eternamente y `shouldRedirectToPrecios` es siempre `false`. Hay ya un perfil gratis de hace 55 días
navegando sin corte. El interruptor del panel de admin no hace nada, hoy ni nunca.
*Arreglo:* leer la categoría `subscription` **y** añadir una policy `SELECT` para `authenticated` acotada a las
categorías no sensibles, o mover la bandera a una RPC pública.

**A2 — Al agotarse el lanzamiento, la web anunciará un precio que Stripe no cobrará.**
`plans.ts:51` tiene `spotsTaken: 0` a mano; el servidor decide con `founder_count` real
(`create-checkout:100-109`). Cubiertas las 100 plazas, la web seguirá diciendo 19,90 €/49 € "para siempre" y
Stripe cobrará 39 €/79 €. Con P3 sin arreglar esto no llega a pasar (el contador nunca sube), pero al
arreglarlo aflora. Publicidad engañosa + cargos discutidos.

**A3 — El ciclo anual queda muerto al agotarse el lanzamiento.**
`_shared/stripePrices.ts:56-62` lanza error si `cycle='yearly'` sin plazas fundador, pero `Precios.tsx:267`
inventa un anual regular (390 €/año Plus, 790 € Equipo — precios que no existen en el modelo cerrado) y deja el
botón activo. El usuario pulsa y solo ve el toast genérico "No se ha podido iniciar el pago".

**A4 — Los packs de imágenes se cobran y caducan a fin de mes.**
`add_image_credits` suma sobre `ai_image_usage` filtrando por `period = to_char(now(),'YYYY-MM')`, y cada mes
se crea fila nueva con `used = 0`. Quien compra el pack de 100 (16,99 €) el día 28 pierde los créditos el día 1.
En Precios no se avisa de nada ("pago único sobre cualquier plan de pago").

**A5 — El webhook del portal no filtra por `origen='portal'` salvo en `invoice.paid`.**
`stripe-webhook:151-158` (checkout) y `:337-363` (subscription) no lo comprueban, mientras `:288-292` sí. Que
el endpoint recibe tráfico ajeno está confirmado: 21 filas en `stripe_events` (8 `invoice.paid`, 11
`customer.subscription.updated`) y 0 en `subscriptions` y `portal_holded_invoices`. Cualquier sesión de
farmapro-direct con `metadata.plan` + `metadata.user_id` escribiría rol en un perfil del portal.
*Arreglo:* primera línea de ambos handlers, `if (metadata.origen !== 'portal') return;`.

**A6 — `remove_member` degrada perfiles protegidos.**
`manage-team:302-315` pone `freemium` a cualquiera que se retire del equipo, sin aplicar `PROTECTED_ROLES` (que
sí se aplican en `accept_invitation`) ni excluir a quien tenga suscripción propia. El comentario confía en que
`check-subscription` lo resincronice, pero con `validation_mode='beta'` esa función ni consulta Stripe. Retirar
del equipo a un admin lo deja en Gratis de forma permanente.

**A7 — Inyección de HTML en las plantillas de email.**
`portalEmailTemplates.ts:115`: el `label` del CTA se escapa, el `href` **no**. Igual con `${dias}`, `${horas}`
y `${ocupadas}/${total}`: tipados como `number` pero llegan de un `req.json()` sin validar. Combinado con P2
permite construir cualquier pieza HTML firmada por farmapro. Y `manage-team:118` construye `inviteUrl` sin
`encodeURIComponent`.

**A8 — `Recursos.tsx` no comprueba que el recurso tenga fichero antes de "descargar".**
`Recursos.tsx:236-244` hace `a.href = resource.file_url` sin validar. Con la cadena vacía, el navegador se
baja el `index.html` de la SPA renombrado con el título del recurso, se registra la descarga y se resta 1 de
las 3 del plan Gratis. Los 6 recursos que lo provocaban ya están corregidos en datos (12-08), pero el guardián
en código sigue faltando y volverá a pasar con el próximo recurso que se cargue sin URL.
*Arreglo:* cortar con un toast de error si `!resource.file_url?.trim()`, y no registrar la descarga.

---

# 4. Medio

**C1 — La página de Precios promete "lo sigues viendo todo" y el código haría lo contrario.**
`Precios.tsx:196-202` vs `AppRoutes.tsx:104-114`: la redirección (hoy muerta por A1) manda a `/precios` también
`/perfil`, `/mi-farmacia` y `/dashboard`. Si se activa, un cliente cuya suscripción caduque no podrá entrar en
Perfil → Facturación a arreglar su tarjeta. Trampa cerrada.

**C2 — Dos CTAs de email apuntan a pestañas inexistentes.**
Las plantillas enlazan `?tab=facturacion` y `?tab=equipo`, pero `Perfil.tsx:22` no lee la query string en
absoluto (`useState('personal')`, sin `useSearchParams`), y las pestañas reales son
`personal|plan|badges|billing|security|notifications`. El cliente con la tarjeta fallida pulsa el botón del
correo de impago y aterriza en "Información personal". Es el correo con más impacto directo en ingresos.

**C3 — Nada impide contratar dos veces.**
`create-checkout:114-138` no comprueba si ya hay suscripción activa; la única protección es el `useState` del
botón. Dos pestañas abiertas = dos suscripciones y dos cobros.

**C4 — La tarjeta de curso confía en `courses.total_lessons` en vez de derivarlo del contenido.**
El desajuste concreto (9 cursos a 0) ya está corregido en datos el 12-08, pero la columna se sigue manteniendo
a mano y volverá a desincronizarse en cuanto se edite un curso desde Lovable.
*Arreglo:* que la tarjeta cuente los módulos del jsonb, o un trigger que recalcule `total_lessons` al escribir
`course_modules`.

**C4b — `quiz_attempts.total_questions` nunca se escribe: vale 0 en los 10 intentos existentes.**
`useQuiz.ts:120-125` inserta `max_score` y `attempt_number`; `:197-205` actualiza `score`, `percentage`,
`passed`, `completed_at` y `time_taken_seconds`. `total_questions` no se toca en ningún momento, así que
cualquier lugar que muestre "X de Y preguntas" enseñará Y = 0. La nota (`score` + `percentage`) sí se guarda
bien.

**C5 — Categorías de curso duplicadas.**
Conviven `atencion` (2 cursos) y `atencion_cliente` (4). El frontend lo replica a propósito, así que en
Formación salen dos pestañas, "Atención" y "Atención al cliente", con contadores 2 y 4, y dos bloques con
cursos hermanos. *Arreglo:* `UPDATE courses SET category='atencion_cliente' WHERE category='atencion'` y
limpiar las tres constantes.

**C6 — Ningún curso tiene portada.**
0 de 34 tienen `thumbnail_url` ni `featured_image_url`, así que las 34 tarjetas caen al color de categoría — y
ahí `marketing` y `tecnologia` comparten `bg-terracota`, y `atencion_cliente` y `otros` comparten
`bg-brand-dark`. Categorías distintas se ven idénticas.

**C7 — Tres modelos contradictorios de límites del gratis.**
`plans.ts`: 2 cursos y 3 recursos totales. `useSubscriptionLimits.ts:85-116`: 2 cursos/mes, 5 recursos/mes,
10 posts/mes, con roles heredados. `system_settings.subscription_limits` en BD: `{"freemium":{"courses":1,"resources":3}}`.
El que manda de verdad es `plans.ts` (lo aplica `get_course_modules`). Los mensajes de tope salen incoherentes.

**C8 — El onboarding dice que Premium es "para titulares".**
`OnboardingWizard.tsx:234`. Falso: depende del plan, no del cargo. Contradice Precios y desanima a comprar a
quien no es titular.

**C9 — La Rebotica anuncia premios que no existen.**
`Rebotica.tsx:61-104` tiene el array de premios escrito a mano y no cuadra con `rebotica_prizes` (11 premios
reales): "un curso premium desbloqueado para siempre" no existe (lo real es un recurso premium, y solo para
tier gratis), "multiplicadores, puntos dobles, insignias raras" no existe en absoluto, y los 3 créditos de
imagen IAFarma — el tercer premio más probable, 200 unidades — no aparece. Con bases legales publicadas, es
exposición innecesaria (Ley 3/1991).

**C10 — El anónimo se registra en la Rebotica para abrir un cajón que no puede abrir.**
`Rebotica.tsx:187-189` sale con `if (!user) return`, así que el CTA anónimo dice "Crear cuenta gratis y abrir
mi cajón". La única campaña está en `estado='draft'` con inicio 10-09. Se registra, vuelve y lee "vuelve el
jueves 10 de septiembre". *Ojo también:* llegado el D-day hay que pasar la campaña a `estado='activa'` a mano
o seguirá todo bloqueado.

**C11 — Enlace muerto: "Ver todas las notificaciones".**
`Header.tsx:138` navega a `/notificaciones`, que no existe en `AppRoutes` → 404. Es el único enlace muerto de
las 32 rutas internas revisadas.

**C12 — Invitaciones caducadas que siguen ocupando plaza.**
El cupo cuenta `status <> 'inactive'` sin mirar `expires_at` (`manage-team:83-93` y `useTeamManagement:198-209`).
En el único equipo real hay 4 invitaciones `pending` caducadas el 29-07 más 1 activa: **5 de 9 plazas
bloqueadas** por gente que nunca entrará.

**C13 — Facturas de Holded que fallan y nadie ve.**
`_shared/holded.ts:146-167` marca la fila como `error` y sigue; el webhook ni mira el resultado. No existe
reintento. El cliente paga, no recibe factura y nadie se entera. Además solo 1 de 7 perfiles tiene CIF: sin
él, Holded crea el contacto como particular sin NIF (factura no deducible para la farmacia). Y
`stripe-webhook:304-306` usa como fallback de email `invoice.customer_address?.line1`, es decir, una dirección
postal en el campo email.

**C14 — Estados de Stripe fuera del enum, perdidos en silencio.**
El enum es `active|canceled|expired|trialing|past_due`, pero `handleSubscriptionChange:350-358` escribe
`sub.status` tal cual, que puede ser `incomplete`, `unpaid` o `paused`, sin comprobar el error del UPDATE. Una
suscripción impagada seguiría figurando como activa.

**C15 — RGPD: prueba de consentimiento para 2 usuarios de 7.**
`consents` es opcional en `useAuth.tsx:14`, y `handle_new_user` solo escribe en `consent_ledger` si el flag
viene a `true`. Hoy: 7 perfiles, 4 filas en `consent_ledger` (2 rgpd + 2 comercial). Cualquier alta que no pase
por el formulario con checkbox (invitación de equipo, alta programática) queda sin rastro. Con el portal aún
sin lanzar es el momento barato de arreglarlo.

**C16 — `fin-prueba` es un correo comercial sin enlace de baja ni comprobación de consentimiento.**
La plantilla vende y lleva a `/precios`, pero `notify_trial_ending` no consulta nunca `consent_ledger`, y
ninguna de las cinco plantillas de Mailrelay tiene enlace de baja (`email_unsubscribe_tokens` está a 0 filas y
sin uso). Quien rechazó el consentimiento comercial lo recibe igual.

**C17 — Los interruptores de visibilidad de secciones no los lee nadie salvo admins.**
Mismo origen que A1: `empleo_visible` y `farmacias_visible` caen siempre a `false`. Hoy coincide con lo
configurado (por casualidad); el día que los actives, seguirán ocultos para todo el mundo menos para ti.

---

# 5. Bajo

- **D1** — Aceptar invitación falla si el email lleva mayúsculas: `manage-team:181-183` filtra con `.eq('email', user.email)` (sensible a mayúsculas) mientras la validación previa compara en minúsculas. La plaza queda ocupada y el invitado solo ve "No se pudo aceptar la invitación".
- **D2** — Los correos de auth (confirmación, recuperación, magic link) **no** salen por Mailrelay: van por la API de Lovable desde `noreply@notify.portal.farmapro.es`. Contradice el mapa de plataformas del CLAUDE.md y parte el estado en dos tablas sin vista unificada.
- **D3** — Errores de redacción en asuntos: *"A tu prueba del portal farmapro le quedan una semana"* (debe ser "le queda"); el asunto del último aviso tiene "2 días" en duro mientras el cuerpo usa la variable; y los seis asuntos de auth dicen "Portal farmapro" con P mayúscula.
- **D4** — `check-subscription` y `customer-portal` resuelven el cliente por email en una cuenta Stripe compartida con farmapro-direct, y solo aceptan suscripciones `active` (ignoran `trialing` y `past_due`). Mejor usar `profiles.stripe_customer_id`, que el webhook ya guarda.
- **D5** — Title Case a la inglesa en Empleo ("Sección en Desarrollo", "Publicar Nueva Oferta de Trabajo") y en las tarjetas de curso ("Comenzar Curso", "Continuar Curso"). El resto del portal usa mayúscula solo inicial.
- **D6** — "7.500+ profesionales de farmacia" aparece dos veces en `Rebotica.tsx` sin fuente ni etiqueta de estimación, mientras el dato contiguo sí la lleva.
- **D7** — Un curso publicado muestra "0h 0m" (`duration_minutes = 0`); mejor ocultar el chip cuando sea 0, como ya se hace con las lecciones.
- **D8** — Los metas SEO se inyectan solo en cliente: `/rebotica` (prioridad 1.0 del sitemap) se sirve inicialmente con el título genérico y sin canónica.
- **D9** — Quizzes duplicados en 6 cursos (uno activo y uno inactivo cada vez). Sin impacto para el usuario, pero conviene limpiar los 6 inactivos.

---

# 6. Orden sugerido

**Esta semana (bloquean el lanzamiento):**
1. ~~P2 — `verify_jwt = true` en `send-portal-email`.~~ **HECHO 12-08.**
2. P1 — Cerrar la RLS de `team_subscriptions`.
3. P3 — Comprobar el error del upsert en el webhook y reordenar la escritura.
4. P4 — Consultar `suppressed_emails`, reintentar solo 5xx, mover el log de `notify_trial_ending`.
5. **Bot**: base de conocimiento + arreglo del contexto (Anexos A y B).

**Siguiente tanda:** A1 (bloqueo del gratis), A5 (filtro `origen`), A8 (guardián de descarga sin fichero), C2 (pestañas de los CTAs de email), C4/C4b (contadores de curso y de quiz), C5 (categorías).

**Antes de abrir el checkout al público:** A2, A3, A4, C3, C13, C15.

---

# Anexo A — Base de conocimiento propuesta para el bot

Bloque constante a añadir en `ai-portal-chat/index.ts`, antes del contexto dinámico. Revísalo: he tomado los
datos de `plans.ts`, `portal-pricing-CERRADO.md` y las páginas legales, pero tú tienes la última palabra sobre
lo que quieres que el bot diga (sobre todo en bajas y reembolsos).

```
QUÉ ES farmapro
farmapro es el portal de formación, recursos y comunidad para profesionales de farmacia de
Mkpro Kotler SL (Zaragoza). Se escribe siempre en minúsculas. Va dirigido a profesionales de
farmacia, nunca al público final.

PLANES Y PRECIOS
- Gratis (0 €, 1 persona): hasta 2 cursos y 3 recursos, leer la comunidad, 2 textos y 1 imagen
  con IAFarma, ver los eventos del sector. A los 30 días se ve todo el catálogo pero queda
  bloqueado: solo lectura.
- Plus (1 persona): 19,90 €/mes de precio fundador (precio normal 39 €/mes) o 199 €/año.
  Todo el contenido sin límite, comunidad completa con retos y ranking, IAFarma texto
  ilimitado, 1 crédito de imagen al mes, eventos exclusivos de farmapro.
- Equipo (hasta 10 personas): 49 €/mes de precio fundador (precio normal 79 €/mes) o 490 €/año.
  Todo lo de Plus para toda la farmacia con una sola cuota y gestión de plazas.
- El precio fundador se mantiene de por vida para las 100 primeras plazas. El plan anual sale
  como dos meses gratis.
- Packs de créditos de imagen IAFarma (pago único sobre cualquier plan de pago): 20 por 4,99 €,
  50 por 9,99 €, 100 por 16,99 €.

CÓMO SE HACEN LAS COSAS
- Contratar o cambiar de plan: página Precios.
- Ver facturas, cambiar la tarjeta o dar de baja la suscripción: Perfil → Facturación, botón
  del portal de cliente de Stripe. La baja surte efecto al final del periodo ya pagado.
- Invitar a alguien del equipo (solo plan Equipo, lo hace el titular): Mi Farmacia → Equipo.
  Llega un email de invitación; al aceptarlo, esa persona pasa a plan Equipo.
- Cambiar la contraseña: Perfil → Seguridad. Si no puedes entrar, "¿Olvidaste tu contraseña?"
  en la pantalla de acceso.
- IAFarma (asistente creativo): textos ilimitados en los planes de pago; las imágenes gastan
  créditos.

LA REBOTICA
Es la campaña quincenal de sorteos del portal: eliges un cajón y lo abres para ver qué te toca.
Arranca el jueves 10 de septiembre de 2026. Las bases legales están en /rebotica/bases-legales.
No inventes premios: si te preguntan cuáles hay, remite a las bases legales.

SOPORTE
- Dudas, incidencias y problemas de pago: soporte@farmapro.es
- Datos personales y derechos RGPD: entra@farmapro.es
- Página de contacto dentro del portal: /contacto-soporte

CÓMO RESPONDER
- Castellano de España, tratando de "tú". Tono profesional y cercano, respuestas breves.
- farmapro SIEMPRE en minúsculas. Sin emojis.
- NUNCA inventes precios, plazos, condiciones, premios ni funciones. Si algo no está en esta
  información ni en los datos del portal, dilo con claridad y remite a soporte@farmapro.es.
- No des consejo sanitario ni prometas resultados de salud.
- No hables de asuntos ajenos al portal.
- Cuando el usuario tenga plan Gratis y pregunte por contenido de pago, explícale qué incluye
  Plus y remítele a la página de Precios, sin presionar.
```

# Anexo B — Arreglo del contexto dinámico

Sustituye `buildPortalContext()` en `supabase/functions/ai-portal-chat/index.ts`:

```ts
async function buildPortalContext(supabase: any, userRole: string | null) {
  let context = '';
  try {
    // Total real + una muestra estable, y solo cursos CON contenido.
    const { count: coursesTotal } = await supabase
      .from('courses').select('*', { count: 'exact', head: true });

    const { data: courses } = await supabase
      .from('courses')
      .select('title, category, is_premium, total_lessons')
      .gt('total_lessons', 0)
      .order('is_featured', { ascending: false })
      .order('title', { ascending: true })
      .limit(20);

    context += `\nCURSOS PUBLICADOS EN TOTAL: ${coursesTotal ?? 0}\n`;
    if (courses?.length) {
      context += `MUESTRA DE CURSOS (${courses.length} de ${coursesTotal ?? 0}):\n`;
      courses.forEach((c: any) => {
        context += `- ${c.title} (${c.category})${c.is_premium ? ' [PLUS/EQUIPO]' : ' [incluido en Gratis]'}\n`;
      });
      context += `Si preguntan por un curso que no está en esta muestra, di que el catálogo completo está en la sección Formación.\n`;
    }

    const { count: resourcesCount } = await supabase
      .from('resources').select('*', { count: 'exact', head: true });
    context += `\nRECURSOS DESCARGABLES: ${resourcesCount || 0}\n`;

    const { data: events } = await supabase
      .from('events')
      .select('title, event_type, start_date')
      .eq('is_published', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })   // los MÁS PRÓXIMOS, no 5 al azar
      .limit(5);
    if (events?.length) {
      context += `\nPRÓXIMOS EVENTOS:\n`;
      events.forEach((e: any) => {
        const f = new Date(e.start_date).toLocaleDateString('es-ES',
          { day: 'numeric', month: 'long', year: 'numeric' });
        context += `- ${e.title} (${e.event_type}) — ${f}\n`;
      });
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const { count: jobsCount } = await supabase
      .from('job_listings_public').select('*', { count: 'exact', head: true })
      .eq('is_active', true).or(`expires_at.is.null,expires_at.gte.${hoy}`);
    context += `\nOFERTAS DE EMPLEO ACTIVAS: ${jobsCount || 0}\n`;

    const { count: promotionsCount } = await supabase
      .from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true);
    context += `PROMOCIONES ACTIVAS: ${promotionsCount || 0}\n`;
    context += `PLAN DEL USUARIO: ${userRole || 'gratis'}\n`;
  } catch (error) {
    console.error('Error building context:', error);
  }
  return context;
}
```

Y en el `serve()`, filtrar los mensajes del cliente antes de pasarlos al modelo (arregla B6):

```ts
const safeMessages = messages.filter(
  (m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
);
if (!safeMessages.length) return json({ error: 'Mensajes inválidos' }, 400);
```

Y cambiar el modelo (B8): `model: 'google/gemini-3.6-flash'`.
