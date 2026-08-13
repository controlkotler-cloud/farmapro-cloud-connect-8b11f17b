# Portal farmapro — qué se ha hecho hoy y qué queda · 12-08-2026

Sesión de repaso completo. Todo lo de abajo está verificado contra la base de datos de producción o
contra el código desplegado, no contra los ficheros locales.

---

# PARTE 1 · Hecho hoy

## Seguridad (3 agujeros cerrados)

| | Qué era | Verificación |
|---|---|---|
| **P2** | `send-portal-email` abierta a internet sin autenticación: cualquiera podía mandar invitaciones de equipo con su propio enlace desde `somos@farmapro.es` | POST sin cabecera devuelve ahora `401`; antes llegaba al código y devolvía 400 |
| **P1** | Cualquier usuario registrado podía crearse un plan Equipo activo con un `insert` desde la consola del navegador (políticas `FOR ALL` en `team_subscriptions`) | Solo quedan políticas `SELECT` + la `ALL` de admin |
| **P1b** | `add_image_credits` era ejecutable por `anon` y `authenticated` con usuario y cantidad arbitrarios: imágenes ilimitadas gratis, con coste real | `has_function_privilege` devuelve false para ambos roles |

## Pagos

**P3 — el webhook de Stripe deja de tragarse los fallos.** Idempotencia en dos tiempos (`completed_at` /
`last_error`), errores de BD que lanzan y devuelven 500 para que Stripe reintente, y filtro `origen='portal'`.
Por el camino apareció un fallo vivo: `subscriptions.status` es un enum de cinco valores y el código escribía
el estado de Stripe tal cual, incluidos `unpaid`, `incomplete` y `paused`, que no caben. Ahora hay traducción.

**Invariante nuevo, a raíz de tu observación** ("quien paga el plan Equipo es el administrador de ese equipo"):
un disparador en `profiles` garantiza el equipo en cuanto alguien pasa a rol `equipo`. Excluye a los miembros
invitados, que también reciben ese rol — si no, cada empleado se habría creado su propio equipo.

## Email (P4)

De 22 envíos del portal, 18 habían fallado y Mailrelay llegó a poner la cuenta "under review". Cuatro causas,
las cuatro corregidas:

- `suppressed_emails` existía pero **no se consultaba nunca**. Ahora se consulta antes de enviar y se alimenta
  sola con los rebotes duros (422 `bounced`).
- Se reintentaba ante **cualquier** error, incluidos 400 y 422 permanentes. Ahora solo ante red o 5xx.
- Sin control de calentamiento. Ahora hay tope diario (`DAILY_CAP = 450`, subir al terminar el warm-up).
- `notify_trial_ending` apuntaba el aviso **antes** de enviarlo, así que un fallo era definitivo: el usuario
  `bd39d01d…` no habría recibido nunca su último aviso. Ahora se confirma solo tras el envío, y ese aviso
  concreto ha quedado marcado como pendiente para que se reintente.

También: inyección de HTML en el `href` de los botones cerrada, CTAs que apuntaban a pestañas inexistentes
(`?tab=facturacion` → `?tab=billing`), Perfil ya lee `?tab=` de la URL (el cliente con la tarjeta fallida ya
aterriza en Facturación), y dos erratas de asunto.

## El bot de soporte

Antes solo conocía 10 cursos y cuatro recuentos. Ni precios, ni planes, ni cómo darse de baja, ni a quién
escribir. Preguntado por el precio de Plus, se lo inventaba.

- **Base de conocimiento fija**: planes y precios, prueba de 30 días, alta/baja, cambio de tarjeta, equipo,
  IAFarma, La Rebotica y los correos de soporte. Con una regla explícita: si no lo sabe, lo dice y deriva a
  `soporte@farmapro.es`.
- **Contexto arreglado**: decía "10 cursos" cuando hay 34 (imprimía el tamaño del trozo); no había `ORDER BY`,
  así que cursos y eventos salían al azar — a "¿hay eventos próximos?" podía responder con congresos de 2027 y
  callarse Farmaforum, que es el siguiente. Ahora: 34 cursos, muestra estable de 20, y los 5 eventos más
  próximos por fecha.
- Modelo actualizado a `gemini-3.6-flash`, filtrado de mensajes para que nadie inyecte instrucciones de
  sistema, preguntas sugeridas útiles, y el chat ya no borra tu pregunta cuando falla.

## Contenido y arreglos menores

- `total_lessons` corregido en 9 cursos que aparecían con "0 lecciones" estando completos.
- Los 6 recursos con `file_url` vacío, enlazados a sus PDF (que ya estaban subidos).
- Botón "Gestionar mi equipo" en Perfil → Plan.
- `/mi-farmacia` deja de expulsar en silencio al dashboard: ahora explica qué es y ofrece salida.
- El equipo de julio, marcado como prueba.
- Recursión infinita en la RLS de `team_members` (era de origen, no de mis cambios: lo comprobé reproduciendo
  el estado anterior). Listar los miembros de un equipo nunca había funcionado.
- Permiso de UPDATE que faltaba en `employees_count` y `specialty_areas` — la migración de ayer las añadió sin
  el GRANT y **eso rompía el guardado del perfil para todos los usuarios**.

---

# PARTE 2 · Qué queda

## Antes de cobrar a un cliente real

1. **A2 — El contador de plazas fundador está a mano.** `plans.ts` tiene `spotsTaken: 0` fijo, pero el servidor
   decide con `founder_count` real. Cubiertas las 100 plazas, la web seguiría anunciando 19,90 €/49 € y Stripe
   cobraría 39 €/79 €. Publicidad engañosa. Ahora que `subscriptions` se puebla de verdad, ya hay de dónde leer.
2. **A3 — El ciclo anual muere al agotarse el lanzamiento.** `stripePrices.ts` lanza error si no quedan plazas
   fundador, pero Precios inventa un anual regular (390 €/año Plus, 790 € Equipo — precios que no existen) y
   deja el botón activo. El usuario pulsa y solo ve un toast genérico.
3. **A4 — Los packs de imágenes se cobran y caducan a fin de mes.** Quien compra el pack de 100 (16,99 €) el
   día 28 pierde los créditos el día 1. Y en Precios no se avisa.
4. **C3 — Nada impide contratar dos veces.** Dos pestañas abiertas = dos suscripciones y dos cobros.
5. **C13 — Facturas de Holded que fallan y nadie ve.** Sin reintento ni aviso. Y solo 1 de 7 perfiles tiene
   CIF: sin él, Holded emite como particular sin NIF (factura no deducible para la farmacia).

## Bloqueos de acceso

6. **A1 — El corte del plan Gratis a los 30 días es código muerto.** `AppRoutes` lee la categoría `system` de
   `system_settings`, pero la bandera vive en `subscription`; y la RLS de esa tabla es solo-admin, así que un
   usuario normal recibe `{}` siempre. Hay ya un perfil gratis de hace 55 días navegando sin corte. Mismo
   origen que **C17** (los interruptores de visibilidad de secciones tampoco los lee nadie).
7. **C1 — Precios promete "lo sigues viendo todo"** y la redirección (hoy muerta) manda a `/precios` también
   `/perfil`, dejando a un cliente caducado sin poder arreglar su tarjeta.
8. **Endurecer `is_team_owner_strict`.** Quedó aparcado en P1 porque `subscriptions` estaba vacía. Ya no lo está.
9. **A6 — `remove_member` degrada perfiles protegidos.** Retirar del equipo a un admin lo deja en Gratis para
   siempre.
10. **C12 — Invitaciones caducadas ocupan plaza.** En el equipo de prueba, 5 de 9 plazas bloqueadas por
    invitaciones muertas el 29-07.

## Contenido y UX

11. **C5 — Categorías duplicadas**: conviven `atencion` (2 cursos) y `atencion_cliente` (4). Dos pestañas para
    lo mismo. Es un `UPDATE` y limpiar tres constantes.
12. **C6 — Ningún curso tiene portada.** Las 34 tarjetas caen al color de categoría, y `marketing`/`tecnologia`
    comparten color, igual que `atencion_cliente`/`otros`.
13. **C9 — La Rebotica anuncia premios que no existen.** El array está a mano y no cuadra con los 11 premios
    reales: promete un curso premium que no existe e insignias que tampoco, y oculta los créditos de imagen,
    que son el tercer premio más probable. Con bases legales publicadas, es exposición innecesaria.
14. **C10 — El anónimo se registra para abrir un cajón que no puede abrir.** Y ojo: llegado el 10-09 hay que
    pasar la campaña a `estado='activa'` a mano o seguirá todo bloqueado.
15. **C8 — El onboarding dice que Premium es "para titulares".** Falso: depende del plan, no del cargo.
16. **C11 — "Ver todas las notificaciones" lleva a un 404.**
17. **C4/C4b — Contadores a mano**: `total_lessons` se volverá a desincronizar al editar un curso desde
    Lovable, y `quiz_attempts.total_questions` no se escribe nunca (vale 0 en los 10 intentos).
18. **A8 — `Recursos.tsx` no comprueba que haya fichero** antes de "descargar". Los datos están bien hoy, pero
    el próximo recurso sin URL repetirá el fallo.
19. **C7 — Tres modelos contradictorios de límites del plan Gratis** (`plans.ts`, `useSubscriptionLimits`,
    `system_settings`).

## Legal y RGPD

20. **C15 — Prueba de consentimiento para 2 usuarios de 7.** `consents` es opcional en el alta y cualquier ruta
    que no pase por el formulario deja al usuario sin rastro. Con el portal aún sin lanzar es el momento barato.
21. **C16 — `fin-prueba` es un correo comercial sin enlace de baja** y sin cruzar con `consent_ledger`.
    `email_unsubscribe_tokens` está a 0 filas y sin uso en la ruta de Mailrelay.
22. **D2 — Los correos de auth no salen por Mailrelay** sino por la API de Lovable desde otro dominio. Contradice
    el mapa de plataformas del CLAUDE.md y parte el estado en dos tablas sin vista unificada.

## Detalles

23. Title Case a la inglesa en Empleo y en las tarjetas de curso · "7.500+ profesionales" sin fuente en Rebotica
    · un curso con "0h 0m" · metas SEO solo en cliente (`/rebotica` se sirve con título genérico) · 6 quizzes
    inactivos duplicados · aceptar invitación falla si el email lleva mayúsculas (D1).

---

# PARTE 3 · Decisiones que son tuyas

- **`paused` → `canceled`**: he mapeado la suscripción pausada de Stripe a "pierde el acceso". Si prefieres que
  lo conserve, es una línea.
- **`DAILY_CAP = 450`**: subirlo cuando Mailrelay dé por terminado el calentamiento.
- **El equipo de julio**: lo he dejado activo y renombrado como prueba. Si quieres desactivarlo del todo, dilo.
- **Los 6 quizzes inactivos duplicados**: se pueden borrar, pero preferí no tocar datos de contenido sin tu ok.

# Vigilancia

Dos consultas que antes no se podían hacer:

```sql
-- Pagos que entraron pero no llegaron a procesarse del todo
select id, type, processed_at, last_error from stripe_events where completed_at is null;

-- Avisos de fin de prueba reclamados pero no confirmados por Mailrelay
select user_id, kind, claimed_at, attempts from portal_trial_notice_log where sent_at is null;
```

# Pendiente de comprobar por ti

Recarga el portal y prueba: guardar el perfil, el botón "Gestionar mi equipo" en Perfil → Plan, invitar a
alguien desde Mi farmacia, y preguntarle al bot cuánto cuesta Plus y cómo darse de baja.
