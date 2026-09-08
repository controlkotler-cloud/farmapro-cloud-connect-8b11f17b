# Revisión completa de IAFarma — 07-09-2026

Auditoría de arriba a abajo: funcionamiento, prompts y contabilidad de créditos.
Todo verificado contra **producción** (BD real vía MCP de Lovable) y contra el repo
sincronizado con Lovable (`git rev-list HEAD...origin/main` = 0/0).

> **Aviso metodológico.** La lógica de créditos NO está en `supabase/migrations/`.
> Las migraciones del 14-08 describen una versión anterior. Lo que corre hoy se
> instaló directo en BD (rework del 31-08, sin migración versionada). Auditar
> IAFarma leyendo solo el repo da un resultado equivocado. La fuente de verdad es
> `pg_get_functiondef` contra la BD.

---

## 0. Lo primero: la lógica que hay en producción no se ha ejecutado nunca

Última actividad registrada en las tres tablas de IAFarma:

| Tabla | Último registro | Filas |
|---|---|---|
| `ai_creative_usage` (texto) | 2026-08-28 09:48 | 7 |
| `generated_images` (imagen) | 2026-08-28 09:50 | 33 |
| `ai_chat_usage` (chat soporte) | 2026-08-28 09:55 | 18 |

El reparto de cuota por farmacia y el tope diario se instalaron **después**, el
31-08. Conclusión literal: **el sistema de créditos que está hoy en vivo no se ha
ejecutado ni una sola vez**, a tres días del D-day.

**Trampa para probarlo:** las cuentas admin (`control@`, `alejandro@`, `laura@`)
tienen bypass explícito de crédito en `ai-generate-image` y además 10.000 créditos
de pack cada una. Probar con la cuenta de Francesc **no prueba el circuito de
créditos**: hace falta una cuenta con rol `plus` o `freemium`.

---

## 1. Los límites reales (producción) frente a lo que se le cuenta al cliente

Valores reales, de `image_limits_for_role` y `text_limits_for_role` en BD:

| Plan | Imágenes/mes | Imágenes/día | Textos/día | Textos/mes |
|---|---|---|---|---|
| Gratis | 1 | 1 | 2 | 2 |
| Plus / premium / profesional | **12** | 12 | **30** | **300** |
| Equipo (compartido por farmacia) | **25** | 15 | **60** | **600** |
| Admin | 500 | 100 | 500 | 5000 |

### 1.1 El chatbot de soporte vende 1 imagen donde hay 12 — CRÍTICO

La constante `KNOWLEDGE` de `supabase/functions/ai-portal-chat/index.ts` dice:

> Plus […] IAFarma texto ilimitado, **1 crédito de imagen al mes**

La realidad son **12**. Y del plan Equipo ni menciona las 25. La página de precios
(`src/lib/plans.ts`) sí dice 12 y 25 correctamente, así que el portal se
contradice a sí mismo.

Agravante: el propio prompt ordena «NUNCA inventes precios […] si algo no está en
esta información, dilo con claridad», de modo que el bot dará la cifra mala con
total seguridad, y justo en la conversación donde el usuario decide pagar.
**Se está infravendiendo el producto 12 veces.**

### 1.2 El muro de "sin créditos" repite el error

`src/components/creative/ImageWorkspace.tsx:580`:

> Tu plan Gratis incluye 1 imagen al mes. Con Plus tienes texto ilimitado, **1 imagen al mes** y packs de recarga que no caducan.

Es el mensaje de upsell más importante del producto (aparece justo cuando el
usuario gratuito se queda sin crédito) y vende 1 en lugar de 12.

### 1.3 "Texto ILIMITADO" no es cierto

La página de precios dice «IAFarma texto **ILIMITADO**» y el chatbot lo repite.
El tope real de Plus es 30/día y 300/mes. El mensual es holgado, pero **30 al día
es alcanzable** por un usuario intensivo, y la palabra «ilimitado» en publicidad
es un compromiso exigible.

Decisión de Francesc: subir el tope hasta que sea nominalmente irrelevante, o
cambiar el copy a algo como «sin límite de uso normal».

---

## 2. Bugs de contabilidad de créditos

### 2.1 En plan Equipo, el tope diario bloquea también los packs comprados — GRAVE

En `consume_image_credit_v2`, el orden es: si aún queda cuota mensual, se
comprueba el tope diario y **si está agotado se lanza excepción**. El bloque que
tira de los packs comprados queda por debajo y **nunca se alcanza**.

Caso real: farmacia con plan Equipo (25/mes, 15/día) que genera 15 imágenes en un
día. Le quedan 10 del mes, pero ve *"Te has quedado sin créditos de imagen"*, la
interfaz le ofrece comprar un pack, **y el pack no le desbloquea nada hasta el día
siguiente**. Se le cobra por algo que no funciona.

Plus no lo sufre porque su tope diario y mensual coinciden (12 = 12).

**Arreglo:** en el bloque diario, no lanzar excepción; dejar caer el flujo al
saldo de packs (que ya está exento de tope diario por diseño).

### 2.2 El mensaje de tope diario es falso

`ai-generate-image/index.ts:336` traduce cualquier error que contenga la palabra
`quota` a un 402 con *"Te has quedado sin créditos de imagen IAFarma."*. Bajo esa
misma frase caen `Monthly image quota exceeded` y `Daily image quota exceeded`,
que son cosas distintas. Al usuario de Equipo se le dice que no tiene créditos
cuando le quedan 10 del mes; lo que tiene es un tope diario que se levanta solo
mañana.

**Arreglo:** distinguir los dos errores y decir «has llegado al máximo de hoy,
vuelve mañana» en el caso diario.

### 2.3 El reembolso regala cuota diaria

`refund_image_credit` decrementa **siempre** el contador del día. Pero cuando el
crédito salió de un pack, ese contador nunca se incrementó (el bloque diario solo
se ejecuta mientras queda cuota mensual). Cada fallo de la IA sobre un pack rebaja
en 1 el contador diario sin motivo, y permite superar el tope del día.

**Arreglo:** devolver el tick diario solo si `p_source = 'monthly'`.

### 2.4 Doble cobro por doble clic en "Regenerar pieza"

`ImageWorkspace.tsx:659`: el botón de regenerar no lleva `disabled`, a diferencia
del botón principal (línea 379, `disabled={loading || !canSubmit}`). Dos clics
rápidos antes del siguiente render disparan dos generaciones = 2 créditos.

### 2.5 El webhook de packs se traga el error y devuelve 200 — GRAVE (packs ya activos)

`PACKS_CHECKOUT_READY = true` en `src/lib/plans.ts:170`: los packs se venden desde
ya (4,99 € / 9,99 € / 16,99 €). En `stripe-webhook`, si la llamada a
`add_image_credits` falla, **solo se escribe en el log**: no se lanza excepción, el
webhook responde 200, Stripe no reintenta y nadie se entera. **Pago cobrado sin
créditos entregados.**

**Arreglo:** lanzar el error para que Stripe reintente, y avisar a
soporte@farmapro.es.

### 2.6 Riesgo de doble acreditación en un reintento a medias

La idempotencia va por `stripe_events.completed_at`. Si el proceso muere entre el
`add_image_credits` y el marcado final, el reintento de Stripe vuelve a ejecutar el
handler completo y suma los créditos otra vez. No hay marca por sesión de pago.

### 2.7 Lo que SÍ está bien

- Consumo y reembolso son RPC atómicas: no hay condición de carrera real ni saldo
  negativo (`CHECK (balance >= 0)` en `ai_image_credits`).
- Los créditos de pack no caducan y se acumulan; la cuota mensual se resetea sola
  al cambiar de clave de periodo, sin cron que pueda fallar.
- RLS correcta: `GRANT SELECT` a `authenticated` y ninguna política de escritura.
  El usuario no puede tocar su propio saldo.
- El plan Equipo comparte de verdad la bolsa: `image_billing_account` remapea al
  titular. Y **el rol al aceptar invitación se asigna bien** (`manage-team` pone
  `subscription_role = 'equipo'`): el gap que figuraba en memoria está resuelto.
- Se cobra **antes** de llamar a la IA y se reembolsa en todos los puntos de fallo
  posteriores (falta de clave, 429/402, payload vacío, fallo de Storage, fallo de
  URL firmada). El diseño es correcto.

---

## 3. Los prompts

Son buenos: contextualizados con la farmacia, con restricciones deontológicas,
formato contractual por tipo de pieza (`SLIDE n:`, `GANCHO/DESARROLLO/CIERRE`,
`META DESCRIPCIÓN:`) y variedad de composición forzada explícitamente. No es
trabajo que haya que rehacer. Lo que se puede mejorar:

### 3.1 Sin `temperature` ni `max_tokens` en ninguna de las tres funciones — el arreglo de mejor relación coste/beneficio

Verificado: cero apariciones en los tres ficheros. Las tres llamadas usan el valor
por defecto del gateway, que es el mismo para el chat de soporte y para el
generador creativo. Deberían ser opuestos:

- `ai-portal-chat`: `temperature` baja (0.2-0.3). Es un bot que no debe inventar y
  al que se le pide expresamente que no invente. Hoy va a temperatura de escritura
  creativa.
- `ai-creative-assistant`: temperatura alta está bien, pero **sin `max_tokens` un
  artículo de blog de 1200 palabras puede cortarse a mitad** sin aviso.

### 3.2 El prompt del chatbot duplica la fuente de verdad — causa raíz del §1.1

`KNOWLEDGE` es una constante escrita a mano con precios, cifras y fechas. Ya está
desactualizada. Mientras siga siendo texto fijo, volverá a desactualizarse en el
siguiente cambio de precios. La función ya construye contexto vivo desde la BD
(`buildPortalContext`): los planes y límites deberían salir de ahí o de `plans.ts`,
no de una copia manual.

### 3.3 `responder-resena`: le falta la protección de datos — riesgo real en farmacia

La estrategia para reseñas negativas dice «sin admitir negligencias», que está
bien, pero **no prohíbe confirmar que esa persona fue atendida**. Responder en
público a una reseña dando por hecho que alguien es paciente, o aludiendo a lo que
compró o consultó, es un problema de protección de datos de salud, no un detalle
de estilo. Falta una línea: *no confirmes ni des a entender que esa persona sea
cliente o paciente, no menciones ningún producto, tratamiento ni consulta concreta,
y lleva cualquier detalle a un canal privado.*

### 3.4 Pedirle al modelo que escriba el texto de la imagen es la clase de fallo más cara

El prompt de imagen repite tres veces «spelled EXACTLY as written» y exige tildes
perfectas. Esa insistencia delata que ya han peleado con ello: los modelos de
imagen fallan con acentos y palabras largas en español, y una pieza con una falta
de ortografía no se puede publicar. Ya existe la maquinaria para resolverlo bien:
`imageUtils` compone el logo real sobre la imagen en el cliente al descargar. **El
titular puede ir por el mismo camino** — se reserva el área en el prompt (ya se
hace para el logo, `logoBlock`) y el texto se compone encima con tipografía real.
Elimina de golpe la clase de fallo más común del producto.

### 3.5 Menor

- A `baseRules` le falta prohibir inventar precios, horarios o servicios de la
  farmacia concreta.
- `ai-portal-chat` registra el uso diario tras el `response.ok` inicial pero antes
  de que termine el streaming: una respuesta cortada a mitad cuenta igual contra el
  límite de 100/día.

---

## 4. Otros fallos de interfaz

1. **El chat borra el mensaje del usuario cuando falla.** `useCreativeChat.ts:214`
   hace `slice(0, -1)` dando por hecho que el último elemento es el placeholder del
   asistente. Si el error ocurre antes (sesión caducada, respuesta no-ok), lo que
   borra es **la petición del usuario**, que desaparece del hilo.
2. ~~**Los ajustes de marca no vuelven al perfil.**~~ **FALSO POSITIVO, corregido el
   mismo día.** El hook `useIAFarmaDefaults` efectivamente solo escribe en
   `localStorage`, pero la escritura a `profiles` no es cosa suya: la hace
   `PharmacyDefaults.tsx:86-95` (`pharmacy_name`, `pharmacy_city`, `iafarma_tone`,
   `iafarma_brand_primary`, `iafarma_brand_secondary`, y el logo en las líneas 55 y
   76), y `CreativeWorkspace.tsx:39-57` rehidrata los seis campos desde el perfil.
   La sincronización entre dispositivos existe y funciona. La validación de colores
   tampoco hace falta: los dos campos son `<input type="color">`
   (`PharmacyDefaults.tsx:168` y `:178`), que solo puede devolver `#rrggbb`.
   El fallo del auditor fue juzgar desde un solo fichero.
3. **La imagen generada se pierde al cambiar de pestaña**: todo vive en `useState`,
   sin persistencia ni aviso.
4. **El carrusel solo se puede regenerar entero.** Si falla la slide 4 de 5, no hay
   forma de repetir esa sola: el botón regenera las cinco y vuelve a cobrar.
5. **El mes estacional se congela.** `getSeasonal()` se evalúa al cargar el módulo,
   no por render: una pestaña abierta cruzando el cambio de mes sigue sugiriendo
   temas del mes anterior. El 30 de septiembre importa.

---

## 5. Qué haría, por orden

**Antes del D-day (10-09):**

1. Corregir «1 imagen al mes» → 12 en el `KNOWLEDGE` del chatbot y en
   `ImageWorkspace.tsx:580`, y añadir las 25 de Equipo. (El chatbot es edge
   function: hay que pedírselo a Lovable. El componente es repo: gratis.)
2. Decidir qué hacer con «texto ILIMITADO»: subir el tope o cambiar el copy.
3. Hacer **una prueba real con una cuenta que no sea admin**: generar texto,
   generar imagen, agotar el crédito y comprobar el mensaje. Nada de esto se ha
   ejecutado nunca en la configuración actual.
4. Arreglar el webhook de packs (§2.5): se están vendiendo ya.

**La semana siguiente:**

5. Tope diario que no bloquee los packs y mensaje de error distinguido (§2.1, §2.2).
6. `temperature` y `max_tokens` en las tres funciones (§3.1).
7. Línea de protección de datos en `responder-resena` (§3.3).
8. `disabled` en el botón de regenerar (§2.4) y el `slice` del chat (§4.1).

**Cuando haya hueco:**

9. Componer el titular en el cliente en lugar de pedírselo al modelo (§3.4).
10. Sacar precios y límites del prompt y leerlos de la BD (§3.2).
11. Guardar el `pg_get_functiondef` de las funciones de créditos como migración
    versionada, para que el repo vuelva a ser auditable.


---

## 6. Qué se ha arreglado (07-09-2026, tarde)

Ejecutado en la misma sesión, después del informe.

### Aplicado y verificado en producción (SQL, sin coste)

| # | Arreglo | Verificación |
|---|---|---|
| §2.1 | `consume_image_credit_v2`: el tope diario ya no bloquea los packs comprados. Al agotar el diario marca `v_day_blocked` y cae al saldo de packs en vez de cortar. | `pg_get_functiondef` |
| §2.2 | Errores distintos: `Daily image quota exceeded` vs `Monthly image quota exceeded`. | `pg_get_functiondef` |
| §2.3 | `refund_image_credit`: con `p_source = 'pack'` ya no devuelve el tick diario (nunca se incrementó). | `pg_get_functiondef` |
| §1.3 | `text_limits_for_role` sube: Plus 100/día y 1.000/mes (antes 30/300), Equipo 200/2.000 (antes 60/600). «Texto ilimitado» pasa a ser cierto en la práctica. | `SELECT` de la función |
| §2.6 | Nueva tabla `ai_image_credit_grants` (PK = `session.id` de Stripe) y `add_image_credits_once(uuid, integer, text)`, con `REVOKE` a `anon`/`authenticated` y `GRANT` solo a `service_role`. | Prueba en vivo: primera llamada `granted:true`, segunda con la misma `ref` `granted:false`. Saldo de prueba restaurado a 10.000. |

Todo esto queda además versionado, retroactivamente, en
`supabase/migrations/20260907210000_iafarma_fix_creditos_y_packs.sql`, para que el
repo vuelva a describir lo que hay en la BD (el problema de fondo del §0).

### Escrito en el repo — pendiente de push y de desplegar

**Frontend** (entra con el push, sin coste):

- §1.2 `ImageWorkspace.tsx`: el muro de upsell dice 12 imágenes en Plus y 25 en
  Equipo, en vez de 1.
- §2.2 El muro distingue el tope diario («Mañana vuelves a tener disponibles las de
  tu plan… los packs no tienen tope diario») de quedarse sin créditos. El backend
  manda `reason: 'daily' | 'quota'` en el 402 y el hook lo propaga.
- §2.4 Doble cobro: `disabled` en el botón de regenerar **y**, sobre todo, guarda de
  reentrada con `useRef` en `useImageGeneration` — `loading` es estado de React y no
  se ve hasta el siguiente render, así que el botón deshabilitado por sí solo no
  cierra la ventana de dos clics rápidos.
- §4.1 `useCreativeChat`: el `catch` retira solo el hueco vacío del asistente, y
  solo si llegó a crearse. Ya no borra el mensaje del usuario.
- §4.5 Estacionalidad reactiva: `pieceTypes.ts` usa getters y `QuickTemplates.tsx`
  construye la lista en cada render.

**Edge functions** (necesitan despliegue; hay que pedírselo a Lovable):

- §1.1 `ai-portal-chat`: el `KNOWLEDGE` dice 12 imágenes en Plus y 25 compartidas en
  Equipo, y se le prohíbe fingir que puede consultar el saldo de nadie.
- §3.1 `temperature` y `max_tokens` en las tres: chat de soporte 0.2/800 (se le
  exige no inventar), asistente creativo 0.7/1200, copy de imagen 0.6/400.
- §3.3 `responder-resena`: bloque de protección de datos — no confirmar que quien
  escribe es paciente, no mencionar medicamentos, tratamientos, patologías ni
  visitas, no repetir datos personales, y derivar a privado lo que requiera datos
  clínicos.
- §2.5 `stripe-webhook`: llama a `add_image_credits_once` con `session.id` y **lanza**
  si falla, en vez de tragarse el error. Al lanzar, `completed_at` se queda a null,
  se guarda `last_error` y se devuelve 500, que es lo que hace que Stripe reintente.
  Como la factura de Holded va después, el reintento no duplica factura.

### Lo que NO se ha tocado, y por qué

- §3.4 (componer el titular en el cliente en vez de pedírselo al modelo) y §3.2
  (leer precios y límites de la BD en lugar de repetirlos en el prompt): son
  rediseños, no arreglos. A tres días del D-day no compensa el riesgo.
- §4.3 (la imagen se pierde al cambiar de pestaña) y §4.4 (regenerar una sola slide
  del carrusel): funcionalidad nueva, no defectos.
- §0 sigue en pie: **nada de esto se ha probado con una cuenta real que no sea
  admin.** Las cuentas internas tienen bypass de créditos y 10.000 créditos de pack,
  así que no sirven. Sigue siendo la prueba pendiente más importante.
