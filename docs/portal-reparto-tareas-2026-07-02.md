# Portal farmapro — Reparto de tareas para dejarlo listo · 2026-07-02

> Todo lo pendiente, repartido por quién lo ejecuta. Orden recomendado: 1 → 2 → 3 → 4 → 5.
> Referencias: hallazgos en `portal-revision-lanzamiento-2026-07-02.md`, plan en `portal-plan-lanzamiento-30-dias.md`.

---

## 1. HECHO YA POR CLAUDE (commit local, falta solo el push)

Commit en tu `farmapro-portal` local con la tanda de UI (compila y typecheck OK):

- Contador de plazas REAL por fases: `spotsTaken = 0`, el contador no se muestra hasta 20 altas reales
  (`showCounterFrom` en `plans.ts`); Precios enseña antes "las primeras 100 plazas conservan este precio",
  después "X de 100 ocupadas" y al final "quedan X". Cuando haya una venta, sube `spotsTaken` a mano
  (o se conecta al recuento real con Stripe).
- PlanTab del Perfil reescrito sobre `plans.ts` + `getAccessState`: fuera el checkout del modelo viejo
  (SubscriptionPlans/TeamPlanCard a 5/29/39 €) y los textos de "Profesional/estudiante". Ahora muestra plan
  actual, días de prueba restantes y CTA a /precios.
- Expiración del gratis unificada: `AppRoutes` usa `getAccessState` (fuera `trial_ends_at`/`student_valid_until`,
  columnas que nadie escribe).
- `AdminRetos`: insert sin `as any` (title+name coherentes) y sin console.logs. `AdminCursos` sin console.logs.
- Huérfanos borrados: `src/pages/Login.tsx` y `src/components/ai/CreativeAssistant.tsx`.
- Descarga premium preparada para bucket privado: el cliente extrae bucket y ruta de `file_url`
  (funciona con el bucket actual y con `recursos-premium` cuando exista).

**ÚNICO PASO TUYO: el push** (las credenciales de GitHub están en tu Mac, no en mi sandbox).
En Terminal o pidiéndoselo a Claude Code:
```sh
cd ~/farmapro/farmapro-portal && git push origin main
```

## 2. SQL PARA TI (SQL editor de Lovable, en este orden) — ✅ HECHO (confirmado por Francesc 02-07)

### 2a. Enum de roles nuevos (A6) — necesario ANTES del prompt de Stripe
Cada sentencia POR SEPARADO (ALTER TYPE ... ADD VALUE no admite transacción con más cosas):
```sql
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'plus';
```
```sql
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'equipo';
```

### 2b. CIF anti-pillaje persistido (M1)
```sql
-- Columna + unicidad (1 prueba gratis por farmacia)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cif text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cif_unique
  ON public.profiles (upper(trim(cif))) WHERE cif IS NOT NULL AND trim(cif) <> '';

-- handle_new_user pasa a persistir el CIF que el registro ya guarda en user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, cif)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(trim(NEW.raw_user_meta_data->>'cif'), '')
  );
  RETURN NEW;
END;
$$;
```
OJO: si el índice único falla al crearse es que ya hay CIF duplicados de pruebas; me lo dices y los limpiamos.
Con el índice, un segundo registro con el mismo CIF fallará: el mensaje de error amable en el formulario
lo añado yo en la siguiente tanda de UI.

### 2c. Verificaciones (solo consultar y pasarme el resultado)
```sql
-- ¿Está aplicada la migración del scan de seguridad? (deben salir las 2 funciones)
SELECT proname FROM pg_proc WHERE proname IN ('get_active_quiz_questions','submit_quiz_answer');

-- Políticas vigentes de recursos y cursos (para confirmar el estado real)
SELECT tablename, policyname, cmd, roles FROM pg_policies
WHERE tablename IN ('resources','courses') ORDER BY tablename, cmd;
```

## 3. PROMPT PARA LOVABLE nº 1 — Backend pre-Stripe — ✅ EJECUTADO (5 commits hasta `4fb2c9b`, 02-07)

```text
Necesito una tanda de backend de seguridad y coherencia. No toques nada de UI en src/ salvo lo que se indica. Punto por punto:

1. RECURSOS PREMIUM EN BUCKET PRIVADO. Los ficheros de recursos con is_premium=true están en el bucket público "recursos", así que cualquiera con la URL los descarga sin pagar. Crea un bucket PRIVADO "recursos-premium"; mueve allí los ficheros de todos los recursos con is_premium=true; actualiza su file_url en la tabla resources a la ruta del bucket nuevo; añade política de Storage: SELECT en recursos-premium solo si el perfil del usuario tiene subscription_role IN ('plus','equipo','premium','profesional','admin'). El cliente ya firma URLs extrayendo bucket y ruta de file_url, no hay que tocarlo.

2. IAFARMA TEXTO (supabase/functions/ai-creative-assistant/index.ts). Hoy exige roles ['premium','profesional','admin'] con subscription_status='active', lo que contradice los planes: el usuario gratis en prueba tiene prometidos 2 textos/mes y Plus/Equipo deben tener ilimitado. Replica el patrón de ai-generate-image: PAID_ROLES = ['plus','equipo','premium','profesional','admin'] sin exigir subscription_status; estado free_trial (created_at + 30 días) puede generar con tope de 2 textos/mes natural (contador atómico en servidor, como consume_image_credit pero para texto, con su tabla de uso); free_locked recibe 403. Los planes de pago sin límite.

3. INVITACIONES DE EQUIPO. Tres roturas: (a) stripe-webhook invoca clientify-sync con action 'send_team_invitation' pero el switch solo implementa 'team_invitation': alinea el nombre; (b) clientify-sync exige un JWT de usuario, que el webhook no tiene: para llamadas internas desde otras edge functions añade autenticación por secreto compartido interno (header X-Internal-Key contra un secret) manteniendo el flujo de usuario como está; (c) la URL de invitación se construye con SUPABASE_URL (dominio de supabase.co, da 404): usa la URL pública del portal (secret o constante APP_URL) y crea la página/ruta /invitation en la app que acepte el token y una al equipo.

4. provision-admin-user crea el perfil con subscription_role='admin' y fila en admin_users pero NO inserta en user_roles, que es lo único que lee is_current_user_admin(): añade el insert en user_roles (user_id, 'admin') para que el admin provisionado pase AdminProtectedRoute y las RLS.

5. ai-portal-chat: migra de OPENAI_API_KEY al gateway de Lovable (como el resto de IA del portal) y añade el mismo gating por plan que el punto 2 (free_locked 403; free_trial y pago con el rate limit diario ya existente). Registra el uso solo si la llamada al modelo tuvo éxito.

6. PROMPT DE IMAGEN COMERCIAL (ai-generate-image). El prompt actual fuerza "Professional pharmaceutical/medical context" y prohíbe todo texto en la imagen; los farmacéuticos necesitan piezas COMERCIALES: promos de producto, carteles de servicio, posts de campaña. Sustituye el enhancedPrompt por uno de marketing retail de farmacia: "Marketing image for a Spanish retail pharmacy (parafarmacia): {prompt}. Commercial, bright, professional aesthetic; clean composition with space for a headline; suitable for social media or in-store poster." Acepta del body dos campos opcionales nuevos: headline (string corto, máx 60 caracteres) que si llega debe renderizarse LITERAL y sin faltas en la imagen como titular destacado, y pieceType ('promo'|'cartel'|'post'|'story') que ajusta la descripción. MANTÉN los guardrails: sin marcas ni envases reales de medicamentos, sin claims de salud ni promesas terapéuticas, sin personas reconocibles; categorías genéricas (solar, dermocosmética, vitaminas) sí. Sigue devolviendo {imageUrl, revisedPrompt, remaining} y no toques cuota, refund ni Storage. Después haz una generación de prueba y confirma que el payload que envías al gateway para google/gemini-3.1-flash-image es el correcto (hoy mezcla formato chat con el endpoint /v1/images/generations y espera data[0].b64_json: verifica que el gateway lo acepta y si no, corrige el formato).

7. Vuelca a una migración las políticas de profiles que existen en producción pero no en el repo (SELECT propia y de admin), para que el repo refleje la realidad.

8. CONTENIDO DE CURSOS PREMIUM EXPUESTO. El contenido real de los cursos vive en la columna JSONB courses.course_modules, en la misma fila que la política "Anyone can view published courses" deja leer a cualquier autenticado: un usuario gratis puede leer por API el contenido completo de un curso premium sin pagar (la protección de course_lessons no sirve porque el alumno lee el JSONB, no esa tabla). Aplica el mismo patrón que get_active_quiz_questions: (a) RPC get_course_modules(p_course_id) SECURITY DEFINER que devuelva course_modules solo si el curso no es premium, o el usuario tiene rol de pago/admin, o está en free_trial y el curso entra en su límite; (b) revoca el SELECT de la columna course_modules a authenticated (GRANT por columnas, como ya se hizo en profiles) manteniendo legibles título, descripción, categoría, portada, etc. para el catálogo; (c) actualiza el hook del cliente que lee course_modules (useCourseData/CourseView) para usar la RPC. Ojo: el catálogo debe seguir viendo la FICHA de todos los cursos (el gratis bloqueado "lo ve todo pero no entra"), solo se protege el contenido.

9. Elimina la política "Premium users can access premium resources" de resources: es permisiva y no restringe nada (las políticas se combinan con OR y "Anyone can view published resources" ya deja pasar); da falsa sensación de protección. La protección real de recursos es el punto 1 (bucket privado).

No borres ai-generate-image. No toques el Worker ni farmapro-direct.
```

## 4. PROMPT PARA LOVABLE nº 2 — Conectar Stripe (cuando hayas hecho el 2a y tengas las claves)

```text
Vamos a conectar Stripe con el modelo de planes REAL (src/lib/plans.ts): Gratis / Plus 39 €/mes (lanzamiento 19,90 de por vida para las primeras 100 plazas, anual 199) / Equipo 79 €/mes hasta 10 usuarios (lanzamiento 49, anual 490). IVA incluido. El enum user_role ya tiene 'plus' y 'equipo'. Secrets STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET ya configurados. Punto por punto:

1. Crea en Stripe (o documenta para crear a mano) los Products/Prices: plus_monthly_launch 19,90, plus_monthly 39, plus_yearly_launch 199, equipo_monthly_launch 49, equipo_monthly 79, equipo_yearly_launch 490, todos EUR impuestos incluidos, con metadata plan=plus|equipo y launch=true|false. Guarda los Price IDs en un mapa en supabase/functions/_shared/stripePrices.ts espejo de plans.ts.

2. Reescribe create-checkout: recibe {plan: 'plus'|'equipo', cycle: 'monthly'|'yearly'}; elige el Price de lanzamiento si quedan plazas fundador (recuento real, ver punto 5) y el regular si no; modo subscription; metadata plan y founder=true|false; success/cancel a la URL del portal. Elimina los importes hardcodeados 500/2900/3900 y el texto "Portal FarmaPro" (farmapro en minúsculas). Desactiva o borra create-team-checkout y calculate_team_price_v2 (modelo viejo).

3. stripe-webhook: registra la idempotencia (event.id con unique) al PRINCIPIO del handler, no al final. checkout.session.completed: asigna profiles.subscription_role según metadata plan, guarda stripe_customer_id, inserta fila en subscriptions (hoy no se inserta y por eso la cancelación no encuentra qué degradar) y si founder=true marca is_founder en la suscripción. Maneja además invoice.payment_failed (marca past_due y notifica) y customer.subscription.updated/deleted (degrada a freemium SOLO si el rol actual no es admin). Mantén la integración Holded y Clientify existentes.

4. Reescribe check-subscription para validar por Price IDs del mapa (no por importes) y con lista de roles protegidos que NUNCA se degradan (admin). Hasta que esto esté probado, validation_mode sigue en beta.

5. Contador de plazas fundador real: crea una función o vista founder_count que cuente las suscripciones activas con is_founder=true, y un endpoint ligero (o RPC pública de solo lectura) para que la web actualice LAUNCH.spotsTaken; mientras tanto se actualiza a mano en plans.ts.

6. En config.toml declara explícitamente [functions.stripe-webhook] verify_jwt = false (Stripe llega sin JWT; la seguridad es la firma del webhook).

7. Perfil > Facturación: conecta el botón "Gestionar suscripción" a la edge customer-portal existente (Stripe Billing Portal) para usuarios con stripe_customer_id.

8. Packs de imágenes (add-ons de plans.ts: 20/4,99, 50/9,99, 100/16,99): Prices de pago único con metadata pack_credits; en el webhook, al pagarse, suma los créditos con una función atómica add_image_credits. La recarga automática NO va en esta tanda.

9. NOTIFICACIONES mínimas: email de bienvenida al registrarse y aviso de fin de prueba (día 23 y día 28 desde created_at, cron diario), vía el sistema de email existente. Plantillas en castellano de España, firma "El equipo de farmapro", farmapro en minúsculas, sin emojis.

Al terminar: pago de prueba end-to-end con tarjeta test 4242 (alta Plus → rol en profiles → fila en subscriptions → factura → Billing Portal → cancelación degrada).
```

## 5. VERIFICACIONES EN VIVO (tras cada bloque)

- [ ] Tras mi push + deploy: Precios muestra "las primeras 100 plazas conservan este precio" SIN contador; Perfil > Plan muestra el plan nuevo con días de prueba.
- [ ] Tras 2c: pásame los dos resultados SQL.
- [ ] Hacer un quiz completo como usuario normal (depende de las RPC del scan).
- [ ] Tras Lovable nº 1: generar 1 imagen IAFarma (con titular de prueba, ej. "Protección solar -20%"), intentar descargar un recurso premium con una cuenta gratis (debe fallar) y con admin (debe funcionar).
- [ ] Tras Lovable nº 2: el pago test completo del punto final.

## ACTUALIZACIÓN 2026-07-02 (tarde) — tanda IAFarma UI hecha + Lovable nº 1 ejecutado

- **Lovable ejecutó el prompt nº 1** (5 commits en origin/main hasta `4fb2c9b`): `ai-generate-image` ya acepta
  `headline` (corta a 60) + `pieceType` (promo/cartel/post/story, default post) con prompt comercial retail,
  además de ai-creative-assistant, ai-portal-chat, clientify-sync (+/invitation), provision-admin-user,
  stripe-webhook y migración `20260702094101`. Pasar las VERIFICACIONES del bloque 5 (imagen con titular, recurso premium).
- **Tanda IAFarma UI hecha por Claude (commit local `21c7d88`, typecheck+build OK)**: plantillas de pieza con
  formato por defecto y prompt precargado por pieza, campo titular 60 chars con contador, selector de formato
  (1:1 / 9:16 / 16:9 → `size`), lenguaje de créditos en labels/402/plans.ts, packs de recarga (IMAGE_ADDONS) con
  compra a 1 clic ya cableada a `create-checkout {pack}` detrás de la palanca **`PACKS_CHECKOUT_READY` en
  `plans.ts` (false)** → ponerla a true cuando la tanda Stripe conecte los packs. Nuevo fichero
  `src/components/creative/pieceTypes.ts`.
- **Formatos corregidos (commits `fefa642` + `275693d`)**: solo proporciones que el modelo de Gemini SOPORTA
  (lista cerrada de imageConfig.aspectRatio). Feed y carrusel IG/FB = 4:5 (1080x1350), story/reel = 9:16,
  cartel para imprimir = **2:3 (1200x1800)** porque el DIN A4 (1:1,41) no está soportado (2:3 es la más
  cercana; al imprimir queda margen o recorte mínimo), horizontal 16:9. El cuadrado se eliminó (el carrusel
  también es 4:5). Defaults: promo y post → feed, cartel → 2:3, story → 9:16.
- **MINI-PROMPT LOVABLE pendiente (aspect ratio de verdad)**: hoy `ai-generate-image` solo mete
  "Target size" como TEXTO en el prompt y Gemini lo ignora a menudo (hay reportes de que incluso ignora el
  config en ediciones). Pedir a Lovable: *"En ai-generate-image, deriva la proporción del campo `size`
  (1080x1350→4:5, 1080x1920→9:16, 1200x1800→2:3, 1920x1080→16:9) y pásala en el payload del gateway como
  configuración de imagen (imageConfig/aspect_ratio) si el gateway de Lovable la admite para
  google/gemini-3.1-flash-image; haz una generación de prueba POR CADA proporción y confirma las dimensiones
  reales del PNG resultante."* Añadir a la verificación del bloque 5: comprobar los píxeles reales de una
  imagen por formato.
- **PASO DE FRANCESC** (el sandbox no puede ni rebasar en .git ni pushear). Son 3 commits locales
  (`21c7d88` + `fefa642` + `275693d`). OJO: el primer intento de pull falló por locks huérfanos del sandbox
  y dejó el working tree a medias (los commits están intactos). Secuencia de recuperación completa:
  ```sh
  cd ~/farmapro/farmapro-portal
  rm -rf .git/HEAD.lock* .git/index.lock* .git/rebase-merge* .git/rebase-apply
  git reset --hard main
  git pull --rebase origin main
  git push origin main
  ```
  Sin conflictos esperables (ficheros disjuntos). Limpieza opcional: `rm -f vite.config.ts.timestamp-*.mjs`.
  Lección para próximas tandas: el commit lo hace Cowork, pero pull/rebase/push SIEMPRE en el Mac
  (el sandbox no puede borrar ficheros de .git y el rebase los necesita).

## TANDA CIF DUPLICADO — ✅ HECHA (commit `cb92895`, 02-07)

El registro ya avisa amablemente cuando el CIF ya gastó su prueba: pre-check antes de crear la cuenta
(RPC `cif_disponible`) + red de seguridad mapeando el error del trigger. **SQL 2d PARA TI** (SQL editor
de Lovable, idempotente; sin él, el aviso amable sigue funcionando por la red de seguridad, pero el
pre-check exacto no):

```sql
CREATE OR REPLACE FUNCTION public.cif_disponible(p_cif text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE cif IS NOT NULL AND upper(trim(cif)) = upper(trim(p_cif))
  );
$$;

REVOKE ALL ON FUNCTION public.cif_disponible(text) FROM public;
GRANT EXECUTE ON FUNCTION public.cif_disponible(text) TO anon, authenticated;
```

Después: `git pull --rebase origin main && git push origin main` (commit `cb92895` pendiente de push).
Verificación: registrarse con un CIF ya usado → toast "Este CIF ya tiene cuenta" sin crear el usuario.

## TANDA MEDICIÓN — ✅ HECHA (commit `91d4197`, 02-07) + FIX IAFARMA PIEZAS (commit `f00ede5`)

- **Medición montada en el portal**: GA4 y píxel de Meta se cargan SOLO con consentimiento del banner de
  cookies ya existente (GA4 ← "análisis", píxel ← "marketing"); pageviews en navegación SPA; conversión
  `sign_up`/`CompleteRegistration` al registrarse; captura UTM first-touch (localStorage) que viaja en el
  `user_metadata` del alta. **PASO TUYO 1**: rellenar los dos IDs en `src/lib/analytics.ts`
  (`ANALYTICS_CONFIG`): el píxel lo creas en Meta Events Manager y el ID de GA4 en Analytics (si quieres lo
  hacemos juntos por navegador). Con IDs vacíos todo queda desactivado sin romper.
- **Convención UTM**: `impulso/00-estrategia/convencion-utm.md` (regla: ningún enlace sin UTM; plantillas
  por canal listas para copiar).
- **PASO TUYO 2 — SQL 2e (atribución)**, en el SQL editor, para persistir el origen de cada alta en profiles:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_page text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, cif,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(trim(NEW.raw_user_meta_data->>'cif'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_source'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_medium'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_campaign'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_term'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_content'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'landing_page'), '')
  );
  RETURN NEW;
END;
$$;
```

- **Fix IAFarma tras tu prueba real** (la imagen bonita pero inservible): las plantillas ya NO describen
  "una farmacia" (eso producía fachadas y farmacéuticas ficticias) sino la PIEZA gráfica (titular, iconos,
  lista de consejos), y hay selector de estilo **Diseño gráfico (por defecto) / Fotografía** que viaja en el
  campo `style`. Repite tu prueba del post 4:5 tras el deploy: escribe los 5 consejos literales en la
  descripción si quieres que salgan tal cual. Si aun así el resultado tira a foto, el siguiente paso es
  backend (añadir al mini-prompt de Lovable que respete el estilo del cliente).
- **PASO TUYO 3**: `git pull --rebase origin main && git push origin main` (commits `91d4197` + `f00ede5`).
- Pendiente hermano (sesión aparte, repo farmapro-direct): píxel + GA4 + banner en farmapro.es.

## SQL 2g — Admin sin límite de imágenes (para pruebas) · propuesto 02-07

`CREATE OR REPLACE` de `consume_image_credit`: si el usuario es admin (por `subscription_role`
o `is_current_user_admin()`), no aplica cuota (devuelve 999) pero sigue registrando el uso en
`ai_image_usage`. Resto de usuarios idéntico. El SQL exacto quedó en el chat de la sesión 02-07;
si hay que regenerarlo, partir de la definición de `20260623092736_*.sql` añadiendo el bypass admin.

## PROMPT PARA LOVABLE nº 3 — IAFarma imagen: cambio a GPT Image + copy automático (cópialo tal cual)

> Decisión de producto (Francesc, 02-07): el farmacéutico NO escribe el copy; da el tema y IAFarma
> redacta titular y textos y los mete literales en la imagen. Si le pedimos el texto hecho, ChatGPT
> nos gana. Tras ejecutarlo, Claude (Cowork) adapta la UI (campo "tema", copy editable, regenerar).
>
> **AÑADIDO tras la prueba A/B de Francesc (02-07 noche)**: mismo brief a Gemini directo, a IAFarma
> y a ChatGPT → Gemini e IAFarma inservibles, ChatGPT clavado. El problema es el MODELO
> (gemini-3.1-flash-image), no nuestro prompt. El gateway de Lovable sirve `openai/gpt-image-2`
> (ya previsto comentado en el código) → cambiar de motor. Puntos 0, 2b y 7 añadidos por esto.

```text
Amplía supabase/functions/ai-generate-image/index.ts: cambio de modelo de imagen y generación del COPY antes que la imagen, en la misma llamada. Punto por punto:

0. CAMBIA IMAGE_MODEL de 'google/gemini-3.1-flash-image' a 'openai/gpt-image-2' (la rama de payload no-Gemini ya existe). Sube quality de 'low' a 'medium'. GPT Image solo acepta size 1024x1024, 1024x1536 y 1536x1024: mapea el size que llega del cliente al más cercano (1080x1350 y 1080x1920 y 1200x1800 → 1024x1536; 1920x1080 → 1536x1024; 1024x1024 → igual) y mantén la respuesta b64_json → Storage como está. Haz una generación de prueba y dime cuántos créditos de Lovable consume UNA imagen en quality medium (lo necesitamos para validar el precio de los packs).

1. Acepta en el body un campo nuevo opcional `brief` (string, máx 200 caracteres): el TEMA de la pieza en lenguaje natural (ej. "consejos para tomar el sol este verano", "promoción 20% en solares"). Si llega `brief`, el flujo es: primero copy, después imagen. Si no llega, el flujo actual queda intacto (retrocompatible).

2. PASO COPY: llama al gateway de Lovable con el modelo de texto del portal (gemini-3-flash, endpoint chat completions, igual que ai-creative-assistant) pidiendo SOLO un JSON: { "headline": string (máx 8 palabras, gancho comercial), "lines": string[] (3 a 5 líneas de máx 6 palabras cada una, consejos o argumentos según pieceType) }. Reglas del copy en el system prompt: castellano de España, sin faltas, sin emojis, sin nombres de medicamentos ni marcas, sin promesas de salud ni curación (código deontológico farmacéutico), tono cercano y profesional. Si el usuario envió `headline` en el body, se respeta el suyo y el modelo solo genera las lines. Parsea el JSON con tolerancia (strip de markdown fences) y si el parse falla, reintenta 1 vez; si vuelve a fallar, sigue sin lines (solo headline) en vez de romper.

3. PASO IMAGEN: construye el prompt de imagen incluyendo los textos LITERALES: el headline como titular principal grande y cada line como elemento de lista con su icono, indicando que todo texto renderizado debe estar escrito EXACTAMENTE como se pasa y sin faltas de ortografía. Acepta del body opcionales pharmacyName y locality: si llegan, se renderizan como firma pequeña al pie ("Farmacia Central · Barcelona"). PROHÍBE explícitamente logotipos inventados, webs y redes sociales inventadas (la prueba con ChatGPT se inventó logo y URL). Mantén pieceGuidance, el campo style del cliente, los guardrails actuales y todo el pipeline (cuota, refund, Storage, signed URL).

4. Devuelve en la respuesta, además de { imageUrl, revisedPrompt, remaining }, el copy usado: { copy: { headline, lines } }, para que la UI pueda mostrarlo y ofrecer regenerar.

5. El coste del paso copy es de texto (barato) y NO consume el contador de textos de IAFarma (ai_text_usage o equivalente): es parte interna de la generación de imagen, que ya cobró su crédito de imagen.

6. Prueba end-to-end: brief "consejos para tomar el sol este verano", pieceType post, formato 1080x1350: verifica que la imagen sale tipo infografía con titular y 3-5 consejos legibles y bien escritos, y pega en el chat el JSON de copy que generó.
```

✅ **EJECUTADO por Lovable** (commits hasta `5564256`: gpt-image-2 + brief/copy + pharmacyName/locality
+ copy en la respuesta). Lovable NO pudo medir créditos (sin sesión de pago en sandbox): se miden con la
primera generación real → Francesc genera y Lovable consulta `ai_gateway_logs` después.

✅ **TANDA UI DEL BRIEF HECHA por Claude** (commit `b3648e7`): campo principal "¿Qué quieres comunicar?"
(máx 200, dispara el copy automático), titular opcional ("si lo dejas vacío, IAFarma lo escribe"),
descripción plegada en "Ajustes avanzados", firma de farmacia enviada desde los defaults guardados
(farmacia + localidad), y el copy generado se muestra bajo la imagen con "Regenerar (gasta 1 crédito)".

**PRUEBA END-TO-END (Francesc, tras pull+push y deploy):** rellenar datos de farmacia si no están
(Farmacia Central / Barcelona), brief "consejos para tomar el sol este verano", pieza Post, formato
Feed 4:5, estilo Diseño gráfico, titular VACÍO → Generar. Verificar: copy visible y bien escrito,
titular y líneas legibles EN la imagen, firma "Farmacia Central · Barcelona" al pie, sin logos/URLs
inventados, proporción del PNG (baja y mira: debería ser 1024x1536). Después pedir a Lovable:
"consulta ai_gateway_logs y dime los créditos de la última generación de imagen" → validar margen packs
(pack 20 a 4,99 € = 0,25 €/imagen de tope).

## PROMPT PARA LOVABLE nº 4 — Variedad creativa de IAFarma imagen (cópialo tal cual)

> Hallazgo de Francesc (02-07, tras 3 generaciones reales): la calidad ya es buena, pero TODAS las
> piezas salen con la misma composición (titular arriba izquierda + lista con iconos + producto a la
> derecha) sea cual sea el tema. Causa: el prompt de imagen del punto 3 del prompt nº 3 prescribía esa
> composición fija. Solución: la dirección de arte la genera el modelo de texto en cada pieza.

```text
Ajuste de variedad creativa en supabase/functions/ai-generate-image/index.ts. Hoy todas las piezas salen con la misma composición (titular arriba a la izquierda, lista de consejos con iconos, producto a la derecha) porque el prompt de imagen la prescribe fija. Punto por punto:

1. Amplía el JSON del PASO COPY con un campo nuevo "art": una dirección de arte en 1 o 2 frases (en inglés, para el modelo de imagen) que describa composición, paleta y estilo visual de ESTA pieza concreta. En el system prompt del copy exige VARIEDAD real: que elija cada vez una composición distinta de un abanico amplio (título central gigante con elementos alrededor; foto a sangre con banda inferior de texto; split vertical o diagonal; lista con numerales grandes sin iconos; estilo etiqueta o sticker de oferta; producto flotante sobre fondo de color plano con sombra dura; retícula editorial tipo revista; primer plano macro con texto superpuesto) y que NO use por defecto "titular arriba + lista con iconos + producto a la derecha". La paleta también debe variar según el tema, no siempre azul marino con naranja.

2. En el PASO IMAGEN, sustituye la instrucción fija de composición por la dirección de arte del copy ("Art direction: {art}"). Mantén intactos: los textos LITERALES y sin faltas (headline y lines deben seguir siendo legibles), la firma pharmacyName · locality al pie, la prohibición de logotipos, webs y redes inventados, los guardrails sanitarios y todo el pipeline (cuota, refund, Storage). Si el copy no devuelve "art" (fallback), elige en el servidor una de 6 direcciones de arte predefinidas al azar.

3. Devuelve "art" dentro de copy en la respuesta, junto a headline y lines.

4. Prueba: genera 3 veces el mismo brief "promoción 20% en solares" (pieceType promo) y pega las 3 direcciones de arte: deben ser claramente distintas entre sí.
```

## Pendientes que siguen en mi tejado (próximas tandas Cowork)

- Migrar leaderboard/comunidad a `profiles_public` si al verificar no se ven los nombres de otros usuarios.
- Secuencia de emails E1-E8 y materiales de lanzamiento (tandas editoriales, cadencia martes/viernes de la
  adenda G). Próxima sesión: "tanda E1-E2".
- Medición en farmapro.es (farmapro-direct): píxel + GA4 + banner de consentimiento propio.
