# IAFarma — análisis a fondo y mejor versión final · 14-08-2026

Revisión completa de IAFarma: presentación en el portal, prompts, modelos, contratos cliente-servidor,
créditos y UX. Todo verificado contra el código local (`farmapro-portal`), no contra suposiciones.
Análisis en tres fases según el método `analiza`: hallazgos → autocrítica → plan para decidir.
**No se ha implementado nada**: tú eliges qué aplicar de cualquiera de las tres tablas.

---

## 0 · Cómo está montado hoy (mapa en 10 líneas)

- **Presentación**: sidebar → grupo "Crecer" → "IAFarma" → `/asistente-creativo`. Cabecera "Tu asistente
  creativo" con 3 badges. Mención en onboarding y en Precios. El bot de soporte (`ai-portal-chat`) es otra
  pieza, ya repasada el 12-08.
- **Texto** (`ai-creative-assistant`): 8 tipos de pieza + formulario por tipo → system prompt por `switch`
  → `google/gemini-3-flash-preview` en streaming. Trial: 2/mes vía `consume_text_credit`. Pago: ilimitado.
- **Imagen** (`ai-generate-image`): brief → copy JSON con `gemini-3-flash-preview` (headline + lines + art
  direction) → `openai/gpt-image-2` (quality medium) → Supabase Storage + URL firmada 10 años. 1 crédito/mes
  + packs (20/50/100) que se aplican restando en `ai_image_usage.used` del mes en curso.
- **Datos de farmacia**: nombre, localidad y tono en `localStorage` (se precargan del perfil una vez).

---

## FASE 3 · Tablas de decisión

Severidad: 🔴 crítica · 🟠 alta · 🟡 media · ⚪ baja. Esfuerzo: S (<1 h) · M (una tarde) · L (varios días).

### ✅ CONFIRMADOS

#### Prompts y calidad del texto

| ID | Cambio | Archivos | Sev. | Esf. | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **T1** | **El formulario pide 14 datos y el prompt ignora 9.** `buildContext` envía `objective, tone, slides, style, who, keywords, length, postType, discount, deadline, channel, messageType, reviewStars, reviewTone`… y `getSystemPrompt` solo lee `topic, duration, product, reviewText, extraInstructions`. El **tono elegido por la farmacia nunca llega al modelo** (baseRules lo fija en "cercano, profesional"); un carrusel de "8 slides estilo Antes/Después" genera lo que quiera; una promo ignora descuento, fecha límite y canal. La farmacia hace esfuerzo que se tira a la basura — justo lo contrario del objetivo del producto. | `ai-creative-assistant/index.ts:147-222` vs `ContentForm.tsx:52-102` | 🔴 | M | Enorme: es LA causa de resultados genéricos | Nulo | — |
| **T2** | **El renderizador espera un formato que el prompt no pide.** `ResultsArea` parsea `SLIDE n` (carrusel) y `GANCHO/DESARROLLO/CIERRE` (reel) para pintar tarjetas, pero el prompt no exige esa estructura: cuando el modelo no la usa, cae a texto plano y la UI "bonita" no aparece. Añadir el formato exacto al prompt (contrato explícito). | `ResultsArea.tsx:50-113` vs `ai-creative-assistant/index.ts:184-192` | 🟠 | S | UI consistente siempre | Nulo | Mejor junto a T1 |
| **T3** | **El blog se contradice.** La tarjeta promete "Artículo SEO de ~800 palabras", pero el prompt no dice longitud, ignora las keywords y `formatInstruction` ordena "texto plano, sin markdown" → un artículo web sin H2 ni estructura no sirve para SEO. Darle al blog su propia instrucción de formato (títulos, H2, meta descripción, longitud del selector). | `ai-creative-assistant/index.ts:173-179,198-201` | 🟡 | S | Bloque de valor real para webs de farmacia | Nulo | T1 |
| **T4** | **"SUGERENCIA DE IMAGEN:" se cuela donde no debe.** Se exige también en WhatsApp y Google Business, y el botón "Copiar contenido" copia el mensaje CON la sugerencia → la farmacia pega en WhatsApp un bloque que no es para el cliente. Quitarla de los tipos sin imagen y/o separarla del copy al copiar. | `index.ts:173-179` · `ResultsArea.tsx:29-32` | 🟡 | S | Copiar-y-pegar de verdad | Nulo | — |
| **T5** | **Modelo de texto desactualizado.** `ai-creative-assistant` y el `COPY_MODEL` de imagen siguen en `google/gemini-3-flash-preview`; el bot de soporte ya migró a `gemini-3.6-flash` el 12-08 (B8). Una línea en cada fichero: mejor calidad y latencia. | `ai-creative-assistant/index.ts:101` · `ai-generate-image/index.ts:66` | 🟡 | S | Calidad/latencia gratis | Regresión de estilo: regenerar ejemplos | — |
| **T6** | **"Castellano de España" no se pide en el texto creativo** (el copy de imagen sí lo exige). Riesgo de "ustedes/celular" esporádico. Una frase en baseRules. | `index.ts:154-171` | ⚪ | S | Consistencia | Nulo | — |

#### Imagen y créditos

| ID | Cambio | Archivos | Sev. | Esf. | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **I1** | **Quien tiene pack pierde créditos cuando la generación falla.** `refundCredit` solo devuelve si `used > 0`; con packs el saldo vive en negativo (p. ej. `used = -14`), así que un error de la IA consume el crédito comprado sin devolverlo. Es dinero cobrado y no entregado. Arreglo: devolver siempre que el consumo se hizo (o RPC `refund_image_credit` atómica). | `ai-generate-image/index.ts:428-447` + `add_image_credits` (migración 20260716123300) | 🟠 | S | No quemar créditos pagados | Nulo | — |
| **I2** | **A4 (ya documentado el 12-08): los packs caducan a fin de mes.** `add_image_credits` resta sobre `used` del periodo actual; el 1 del mes siguiente se abre fila nueva a 0 y el resto del pack de 16,99 € se esfuma, mientras la UI promete "sin caducidad mensual" (`ImageWorkspace.tsx:417-419`). O saldo persistente (tabla de créditos con arrastre) o cambiar la promesa. Es la incidencia más grave de IAFarma. | migración `20260716123300` · `ImageWorkspace.tsx` | 🔴 | M | Legal + confianza | Migración de datos: cuidado con saldos vivos | — |
| **I3** | **Los formatos anunciados no son los que se generan.** gpt-image-2 solo produce 1:1, 2:3 y 3:2. "Feed 4:5" (1080x1350) sale en 2:3 → Instagram lo recorta; "Horizontal 16:9" sale en 3:2. Opciones: recorte servidor a la proporción pedida tras generar, o modelo Gemini imagen (soporta 4:5/9:16/16:9 nativos), o etiquetar honesto. | `ai-generate-image/index.ts:19-35` · `pieceTypes.ts:32-37` | 🟠 | M | La pieza encaja donde promete | Si recortas: componer bien el encuadre | Decisión D1 |
| **I4** | **Todo huele a verano, para siempre.** Las 4 plantillas de pieza (`buildPrompt`) y varias "ideas rápidas" están hardcodeadas con solar/verano ("fondo veraniego", "sol, crema, gafas", "Colores frescos de verano", "Protección solar primavera"). En noviembre IAFarma seguirá proponiendo cremas solares. Mínimo: plantillas neutras; mejor: calendario estacional (ver blueprint). | `pieceTypes.ts:57-99` · `QuickTemplates.tsx` | 🟠 | S–M | El producto no caduca en septiembre | Nulo | — |
| **I5** | **Un clic en vacío gasta el único crédito del mes.** El prompt viene precargado (oculto tras "Ajustes avanzados"), así que el botón "Generar imagen" está activo sin escribir nada: un clic accidental genera una pieza genérica de crema solar y consume el crédito. Exigir brief (o confirmación si el brief está vacío). | `ImageWorkspace.tsx:83` | 🟡 | S | Protege el crédito escaso | Nulo | — |
| **I6** | Comentario obsoleto: `pieceTypes.ts` documenta las proporciones "que soporta Gemini" pero el modelo activo es gpt-image-2. Actualizar al resolver I3. | `pieceTypes.ts:23-31` | ⚪ | S | Docs fieles | Nulo | I3 |

#### Robustez y coste

| ID | Cambio | Archivos | Sev. | Esf. | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **S1** | **`ai-creative-assistant` no aplica el blindaje B6 que ya tiene el bot de soporte**: no filtra roles (un cliente puede colar mensajes `role:"system"` tras tu prompt), no limita nº de mensajes ni longitud. Copiar el mismo filtro (`user`/`assistant`, máx. 50, `typeof content === 'string'`). | `ai-creative-assistant/index.ts:25-29` vs `ai-portal-chat/index.ts:67-73` | 🟡 | S | Cierra inyección y payloads absurdos | Nulo | — |
| **S2** | **Texto "ilimitado" = coste sin techo.** Para planes de pago no hay ningún rate limit (el bot de soporte tiene 100/día). Un script con una sesión de pago puede quemar créditos del gateway toda la noche. Tope generoso e invisible (p. ej. 150/día) que un humano jamás toca. | `ai-creative-assistant/index.ts` | 🟡 | S | Techo de coste | Nulo | — |
| **S3** | Refunds de texto e imagen son read-then-update (no atómicos). Carrera improbable pero existe; una RPC `refund_*` con `UPDATE ... used = used - 1` lo cierra. | ambas edge functions | ⚪ | S | Contadores fiables | Nulo | Junto a I1 |

#### Cliente y UX

| ID | Cambio | Archivos | Sev. | Esf. | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **U1** | **Los errores del cliente machacan los del servidor y citan planes muertos.** El hook lee `errorData.error` (mensajes buenos: "Hazte Plus…") y acto seguido lo sobrescribe por código HTTP: el 403 dice "Necesitas un plan **Premium, Profesional** o Admin" (planes que ya no se venden) y el 402 dice "contacta con soporte" en vez de "hazte Plus". Justo en el momento de máxima intención de compra, el mensaje despista. Usar el mensaje del servidor y dejar el switch solo como fallback. | `useCreativeChat.ts:107-119` | 🟠 | S | Conversión en el momento clave | Nulo | — |
| **U2** | **"Regenerar" envía el historial sin recortar.** `regenerate` hace `setMessages(slice(0,-2))` pero `sendMessage` usa el closure viejo: el modelo recibe su respuesta anterior + la misma pregunta otra vez → tiende a repetirse (y gasta tokens). Pasar el historial recortado explícitamente. | `useCreativeChat.ts:205-210` | 🟡 | S | Regeneraciones de verdad distintas | Nulo | — |
| **U3** | **El usuario trial no ve cuántos textos le quedan** hasta chocar con el muro. La RPC ya devuelve el restante y la edge lo descarta. Devolverlo en una cabecera/campo y pintar "Te queda 1 texto este mes" con CTA a Plus. | `ai-creative-assistant/index.ts:72-84` | 🟡 | M | Conversión + expectativas claras | Nulo | — |
| **U4** | **Los datos de la farmacia viven solo en ese navegador.** El tono no existe en el perfil; en el móvil o en otro equipo IAFarma "olvida" a la farmacia. Persistir `tono` (y overrides) en `profiles` y usar localStorage solo como caché. | `useIAFarmaDefaults.ts` · `PharmacyDefaults.tsx` | 🟡 | M | Cero esfuerzo repetido, multi-dispositivo | Migración trivial | Base del blueprint |
| **U5** | El botón "Guardar como predeterminado" no guarda nada (ya se guarda solo); solo lanza el toast. Quitarlo o convertirlo en "Guardar en mi perfil" (→U4). | `PharmacyDefaults.tsx:18-24` | ⚪ | S | Honestidad de UI | Nulo | U4 |
| **U6** | Las instrucciones extra van duplicadas: en el mensaje del usuario y en el system prompt. Inofensivo pero ensucia el contexto. | `ContentForm.tsx:104-110` + edge | ⚪ | S | Contexto limpio | Nulo | T1 |
| **U7** | **No hay historial.** Los textos no se guardan en ningún sitio (F5 = perdido todo); las imágenes sí están en `generated_images` pero no hay galería. Una biblioteca "Mis piezas" (texto + imagen, re-usar, re-editar) convierte IAFarma de juguete en herramienta de trabajo. | nuevo + `generated_images` | 🟠 | L | Retención y valor percibido | Nulo | — |
| **U8** | **La "SUGERENCIA DE IMAGEN" es un callejón sin salida.** El texto sugiere un visual y el usuario tiene que ir a la pestaña Imagen y reescribirlo. Botón "Crear esta imagen" que salte al workspace de imagen con el brief precargado. | `ResultsArea` + `ImageWorkspace` | 🟡 | M | Flujo texto→imagen en 1 clic | Consume crédito: dejarlo claro | U7 opcional |

#### Presentación y métricas

| ID | Cambio | Archivos | Sev. | Esf. | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **P1** | Badge "Adaptado al algoritmo actual": afirmación no sustentable (¿qué algoritmo?, ¿actualizado por quién?). Cambiar por algo demostrable ("Sin hashtags de relleno", "Cumple el código deontológico"). | `CreativeHeader.tsx:5-9` | ⚪ | S | Credibilidad | Nulo | — |
| **M1** | **El uso de pago no se mide en absoluto** (`ai_text_usage` solo registra trial). No puedes saber qué tipos de pieza se usan, qué temas, ni si IAFarma retiene. Log ligero por generación (user, tipo, tema, timestamp) = tu cuadro de mando del producto. | nueva tabla + 1 insert en edge | 🟡 | S | Datos para decidir el roadmap | RGPD: no guardar contenido, solo metadatos | — |

### ⚠️ DUDOSOS (los conoces tú mejor)

| ID | Cambio | Archivos | Sev. | Esf. | Beneficio | Riesgo | Por qué dudo |
|---|---|---|---|---|---|---|---|
| **D1** | Cambiar el modelo de imagen a Gemini imagen (o gpt-image-2 `quality: high`) para el texto rotulado. gpt-image-2 en `medium` falla tildes con cierta frecuencia y las piezas de farmacia son texto-céntricas; Gemini imagen soporta además 4:5/9:16 nativos (resolvería I3 de raíz). | `ai-generate-image/index.ts:16-17` | 🟡 | S–M | Tildes perfectas + formatos honestos | Estética distinta; coste/imagen distinto | No he visto tus resultados reales: si las tildes salen bien en producción, no toques lo que funciona. Pide A/B con 5 piezas reales. |
| **D2** | La pantalla de cuota enseña los packs de compra también a usuarios trial, con la nota "disponible en planes Plus y Equipo". Si `create-checkout` no bloquea el pack para gratis, un trial puede comprar créditos sin plan. | `ImageWorkspace.tsx:458-475` | 🟡 | S | Coherencia comercial | Nulo | No he leído `create-checkout`; puede que ya lo rechace en servidor. Verificar antes de tocar. |
| **D3** | `baseRules` permite 2-4 emojis también al responder reseñas de Google (caso que hereda las reglas). Una respuesta a una reseña negativa con emojis puede chirriar. | `ai-creative-assistant/index.ts:211-214` | ⚪ | S | Tono adecuado en el caso más delicado | Nulo | Criterio de marca tuyo: quizá quieres emojis también ahí. |
| **D4** | "Sin hashtags" como política global de Instagram. Hay funcionamiento razonable sin hashtags en 2026, pero es una decisión de marketing, no técnica. | prompt | ⚪ | S | — | — | Es tu tesis de contenido; solo señalo que está hardcodeada y la farmacia no puede elegir. |
| **D5** | Latencia de imagen: dos llamadas encadenadas (copy → imagen) con el mensaje "esto puede tardar unos segundos". Si la percepción real es 30-60 s, mostrar pasos ("Escribiendo el copy… → Dibujando la pieza…"). | `ImageWorkspace.tsx:449-456` | ⚪ | S | Espera percibida menor | Nulo | Depende de latencias reales de producción que no puedo medir desde aquí. |
| **D6** | CORS `*` en las tres funciones. Con auth obligatoria es lo habitual en Supabase, pero un allowlist de orígenes reduciría superficie. | las 3 edge functions | ⚪ | S | Endurecimiento | Romper apps/preview si se olvida un origen | Práctica común; discutible que compense. |

### ❌ PROBABLES FALSOS POSITIVOS (los tumba la autocrítica)

| ID | Sospecha inicial | Por qué parecía un problema | Por qué probablemente no lo es |
|---|---|---|---|
| **FP1** | `consume_image_credit(p_limit: 1)` limitaría a 1 imagen/mes también a quien compró packs | El límite parece fijo en 1 para todos | Los packs dejan `used` en negativo (`add_image_credits` resta), así que `used < 1` sigue cumpliéndose durante todo el pack. El diseño es raro (y causa I1/I2), pero el límite en sí funciona. |
| **FP2** | El insert de `ai_chat_usage` en el bot podría fallar en silencio por falta de policy INSERT (y el límite diario no contaría nunca) | El resultado del insert se ignora | Verificado en `20260617120000_audit_hardening.sql:128-129`: la policy "Users can insert own ai usage" existe. |
| **FP3** | El parser SSE de `useCreativeChat` podría perder chunks con JSON partido | El `break` con push-back parece frágil | Revisado línea a línea: re-encola `line + '\n' + textBuffer` y el flush final repesca lo pendiente. Correcto. |
| **FP4** | La URL firmada de 10 años en Storage parecía un riesgo de expiración/privacidad | 10 años ≠ permanente | Es decisión consciente (imágenes de marketing, no datos sensibles) y el path se guarda en `generated_images`, así que se puede re-firmar. Aceptable. |

### Orden recomendado (solo confirmados)

1. **Dinero y confianza (esta semana)**: I2 (packs que caducan) → I1 (refund con pack) → U1 (mensajes de error) → I5 (clic en vacío).
2. **Calidad inmediata (una tarde)**: T5 (modelo) → T1+T2+T3 (reescritura de prompts, un solo PR) → T4 → I4 (plantillas neutras) → S1+S2.
3. **Producto (siguiente tanda)**: U3 → U4+U5 → M1 → U2 → U8 → I3 (con D1 decidido) → U7 (biblioteca).
4. **Cosmética**: T6, U6, S3, I6, P1.

---

## La mejor versión final — "IAFarma 2.0: la que trabaja sola"

Tu criterio de diseño: *la mejor IA para una farmacia es la que no le genera ningún esfuerzo*. Hoy IAFarma
es un **formulario que espera**: la farmacia tiene que decidir qué crear, cuándo, sobre qué tema, con qué
titular. El salto no es un modelo mejor: es **invertir la iniciativa**. Cuatro movimientos, por fases:

### 1. Perfil de marca único (base de todo) — esfuerzo: una vez, 2 minutos
Un "Perfil creativo" en servidor (extensión de `profiles` o tabla `pharmacy_brand`): nombre, localidad,
tono, especialidades (dermo, infantil, deporte, ortopedia…), servicios (SPD, nutrición…), qué NO quiere
(p. ej. "nada de precios en redes"). Se rellena en el onboarding o con 4 preguntas la primera vez que entra
en IAFarma, viaja en TODAS las generaciones (texto e imagen) y sincroniza en todos los dispositivos.
*Sustituye a: localStorage (U4), campos repetidos en cada formulario.*

### 2. IAFarma propone, la farmacia aprueba — el corazón del "sin esfuerzo"
- **Calendario farmacéutico estacional** (estático, mantenible en un fichero): septiembre = vuelta al cole
  y piojos; octubre = gripe e inmunidad; noviembre = piel seca; diciembre = regalos dermo; enero =
  propósitos… cruzado con las especialidades del perfil.
- Al entrar, en vez del grid vacío: **"Esta quincena te propongo estos 6 contenidos"** (2 posts, 1 reel,
  1 carrusel, 1 Google Business, 1 cartel), cada uno con tema y titular ya escritos. Un clic → generado.
  Un clic más → su imagen a juego.
- Es barato: la propuesta es una sola llamada de texto (o ninguna: plantillas parametrizadas por temporada
  + perfil). *Sustituye a: QuickTemplates estáticas de verano (I4).*

### 3. Piezas completas, no mitades
- **Texto+imagen de un tirón**: cada contenido generado termina en pieza publicable (copy + imagen
  coherentes, mismo tema y titular). La "SUGERENCIA DE IMAGEN" muere como texto y renace como botón (U8).
- **Biblioteca "Mis piezas"** (U7): todo lo generado queda guardado, filtrable por tipo y mes, re-editable
  ("cámbiale el titular"), re-descargable. La farmacia acumula un archivo de marca en vez de empezar de
  cero cada vez.

### 4. Prompts y modelos, versión final
- **Texto**: `google/gemini-3.6-flash` (T5). Un solo builder de prompt que recibe TODO el contexto del
  formulario + perfil de marca (T1), con: castellano de España explícito (T6), tono del perfil, contratos
  de formato por tipo (T2: `SLIDE 1:`… / `GANCHO:`…; blog con H2 y longitud, T3), sugerencia de imagen solo
  donde aplica (T4), y las restricciones deontológicas actuales (que están bien y son el activo
  diferencial: consérvalas tal cual).
- **Imagen**: decidir D1 con un A/B real de 5 piezas (gpt-image-2 `high` vs Gemini imagen). Gane quien
  gane, formatos honestos (I3) y plantillas estacionales desde el calendario (I4). El pipeline
  copy→art-direction→imagen actual es bueno — es de lo mejor que tiene IAFarma hoy; no lo toques, solo
  aliméntalo con el perfil de marca.
- **Créditos**: saldo persistente sin caducidad para packs (I2), refund correcto (I1), y contador visible
  siempre ("Te quedan 14 imágenes · Recargar").

### Qué NO haría
- Publicación automática en redes (APIs de Meta/Google = coste de mantenimiento alto y revisiones de app;
  el download + copiar ya cubre el 90 % del valor).
- Chat libre estilo ChatGPT: el valor de IAFarma es precisamente que NO hay que saber promptear.
- Cambiar el naming: "IAFarma" en sidebar + "Tu asistente creativo" como subtítulo funciona y está
  consistente en portal, precios, onboarding y bot de soporte.

### Resultado
La farmacia entra, ve 6 piezas propuestas para su quincena con su tono y sus campañas, aprueba con un
clic, descarga texto+imagen y sale. Dos minutos al mes de esfuerzo. Eso no lo da ninguna IA generalista,
porque el valor no está en el modelo: está en el calendario, el perfil y el criterio farmacéutico
embebido en los prompts.
