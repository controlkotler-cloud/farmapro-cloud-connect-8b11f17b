# IAFarma: alta guiada de la farmacia

Fecha: 20-11-2026. Estado: aprobado por Francesc («si», 20-11-2026, alta guiada sola, sin motor). Sin código escrito.

## 1. Por qué

La generación de imágenes es la única queja que ha tenido el portal. La comparación del 20-11 (§10) demostró que el generador actual de IAFarma (gpt-image-2 por Lovable, calidad media, tamaño nativo desde el 24-10) ya queda al nivel del motor de MKPRO con los mismos datos. Lo que fallaba era otra cosa:

- el recorte en el navegador (arreglado el 24-10, sin estrenar porque nadie ha generado desde entonces);
- el texto de ejemplo «Escribe aquí los consejos…» que se envía tal cual al modelo (`src/components/creative/pieceTypes.ts:95-98`);
- y, sobre todo, lo que señaló Francesc: **si la farmacia no configura IAFarma bien, el resultado no es el esperado.** Hoy la configuración es un formulario opcional (nombre, localidad, tono, dos colores y logo). En la base, 2 de 93 perfiles tienen logo y 4 tienen color.

Por eso, antes de generar, IAFarma busca la información de la farmacia en su web y su Instagram (si no tiene ninguno, se la pregunta), recoge logo, colores, nombre comercial, tono, servicios y marcas, se lo enseña a la farmacia y deja que lo edite o lo valide.

Éxito = las farmacias dejan de quejarse de las imágenes y las que generan vuelven a generar.

## 2. Objetivos

1. Antes de su primera imagen, cada farmacia pasa un **alta guiada**: el sistema busca sus datos, se los enseña en una ficha editable y ella la valida.
2. Todo lo que el sistema propone viene de una fuente comprobable (cita literal o recurso descargado). Nada inventado.
3. Lo validado llega al prompt de `ai-generate-image` (nombre comercial, paleta, tono, servicios y marcas) y el logo a la superposición del navegador.
4. Se arregla el texto de ejemplo de `pieceTypes.ts:95-98` y se permite una línea más para el subtítulo.

## 3. No objetivos

- El motor de MKPRO queda fuera (aparcado, ver §11).
- La farmacia no conecta su cuenta de Meta ni hace login con Facebook. No hay App Review.
- No se raspa el HTML de Instagram. Solo la API oficial (`business_discovery`).
- No se cambia el sistema de créditos de IAFarma ni sus precios.
- No se toca el modelo ni la calidad de `ai-generate-image`.

## 4. Anti-objetivos (fracaso aunque funcione)

- Que una farmacia vea datos, logo o fotos de **otra** farmacia (cuenta de Instagram equivocada, web de otra farmacia).
- Que el alta sea una barrera: si no se encuentra nada, la farmacia tiene que poder rellenarla a mano en un minuto.
- Que la búsqueda se cuelgue: la farmacia nunca espera más de 45 s.

## 5. Restricciones

- Portal: Lovable + Supabase (`jeysistgdajopfruqpbc`). Frontend por repo + push + `deploy_project` + comprobación en vivo; edge functions con una petición cerrada al chat de Lovable (`send_message`) y comprobación de que corre la versión nueva. Migraciones por `query_database`, idempotentes.
- Las edge functions de Supabase no tienen Pillow ni fuentes y tienen límite de tiempo.
- Secrets que ya tiene el portal: `LOVABLE_API_KEY` (pasarela de Lovable, `google/gemini-3.6-flash`), `OPENAI_API_KEY`, los de Supabase. **No tiene** token de Instagram.
- Sin ficha de Google (decisión de Francesc del 20-11-2026, «si la web y su instagram son las mejores bases si no tiene se tendra que preguntar a la farmacia»): para un post de una farmacia, la ficha solo identificaba la farmacia y daba la web; con ninguna web ni Instagram, se pregunta a la farmacia.
- Encender algo que ven las farmacias necesita el sí de Francesc.
- Secrets: nunca en el repo ni en el chat.

## 6. Enfoques considerados

| Enfoque | Qué supone | Por qué no / sí |
|---|---|---|
| A. Búsqueda en el VPS de ops (raspador, Sonnet y Pillow ya están allí) | Publicar un endpoint del VPS con dominio, Caddy y token | Es justo la infraestructura que se ahorra al dejar fuera el motor. Descartado. |
| B. Añadir la ficha de Google (DataForSEO) como tercera fuente | Dos secrets más, elegir entre homónimas | Para un post solo aportaba identificar la farmacia y su web. Descartado por Francesc el 20-11. |
| **C. Edge function propia del portal, `iafarma-perfil`, con web e Instagram** | Paleta en el navegador | **Elegido** (decisión mía). Todo vive en el portal, sin VPS. |

## 7. Diseño

### 7.1 Cuándo se ve

Antes de la primera generación, obligatoria. Las farmacias que ya usan IAFarma la ven en su próxima generación, prerrellenada con lo que ya tenían (nombre, localidad, tono, colores, logo); no se les borra nada. *Decisión mía.*

### 7.2 Paso 1, lo que escribe la farmacia

Nombre de la farmacia y localidad (obligatorios); web y usuario de Instagram, destacados como lo que hace que acierte («con tu web o tu Instagram lo rellenamos por ti»). Si no escribe ninguno de los dos, no hay búsqueda: pasa directo a la ficha vacía para rellenarla a mano.

### 7.3 Paso 2, la búsqueda (edge function `iafarma-perfil`, 15–40 s)

Requiere sesión (JWT). Web e Instagram se piden en paralelo cuando se puede; cada una tiene su tiempo máximo y, si falla, se sigue sin ella.

1. **Web.** La que escribió la farmacia. Guarda SSRF: solo `http(s)`, sin IP literal privada, sin puertos raros, se resuelve el DNS y se rechaza si apunta a red privada, como mucho 3 redirecciones comprobadas, 1,5 MB y 8 s (mismo criterio que `_url_publica` de `mkpro-ops/backend/app/perfil_captura.py`). Se extraen: logo (`<link rel=icon>` grande, `og:image`, `<img>` con «logo» en clase, id, alt o src), colores del CSS (`theme-color`, variables y hex del HTML y de la primera hoja de estilos propia), el primer `instagram.com/<usuario>` y el texto visible (limitado a 12.000 caracteres).
2. **Instagram.** El usuario que escribió la farmacia o el de su web. `business_discovery` de la Graph API: nombre, biografía, web, foto de perfil y los 6 últimos pies de foto. Solo cuentas de empresa o creador; si es personal o no existe (error 110), se sigue sin Instagram y se le dice en una línea. Sin token, este paso se salta.
3. **Logo.** Prioridad: logo de la web → foto de perfil de Instagram. Se descarga (con la misma guarda, solo imágenes, 2 MB) y se sube al bucket `iafarma-logos` en una ruta provisional; pasa a ser el logo de la farmacia solo al validar.
4. **Lectura del texto.** Con el texto de la web, la biografía y los pies de foto, `google/gemini-3.6-flash` por la pasarela de Lovable devuelve en JSON nombre comercial, tono (uno de los que ya tiene IAFarma), servicios y marcas, **cada dato con su cita literal y su fuente**. La función comprueba que cada cita aparece de verdad en el texto de esa fuente (normalizando espacios, mayúsculas y acentos); lo que no pasa se descarta. Mismo esquema que `perfil_contenido.py` de ops. Las marcas de la lista de veto (robots Julia y Celia) se quitan.
5. **Respuesta.** Una propuesta con cada campo, su fuente y su cita, y qué fuentes fallaron. No escribe en `profiles`.

**Paleta.** La saca el navegador del logo con un canvas (cuantizar a 6 colores, descartar casi blancos y casi negros) y la contrasta con los colores del CSS que devuelve la función. Si coinciden, se proponen esos; si no hay logo, los del CSS. *Decisión mía:* en Deno no hay Pillow y el navegador ya tiene el logo.

**Límites.** 3 búsquedas por farmacia y día (tabla `iafarma_perfil_busquedas`: farmacia, fecha, fuentes usadas, coste estimado). Coste por alta: unos céntimos de la pasarela; Instagram es gratis.

### 7.4 Paso 3, la ficha

Una tarjeta con logo, colores (muestras editables), nombre comercial, localidad, tono, servicios y marcas (etiquetas que se quitan o añaden) y, al lado de cada dato, de dónde salió («de tu web», «de tu Instagram»). Botones: «Está bien así» y editar cada campo. Si no se encontró nada, la misma tarjeta vacía para rellenar a mano, con el mismo botón. Debajo, una muestra hecha en el navegador (canvas con su paleta, su nombre comercial y su logo, sin gastar gpt-image) para que vea el efecto de lo que valida. Diseño dentro de la base visual del portal (`DESIGN.md`).

### 7.5 Paso 4, guardar

Al validar se guarda en `profiles` y se marca `iafarma_perfil_validado_at`. Desde «Mi farmacia» de IAFarma (`PharmacyDefaults.tsx`) se puede volver a editar o repetir la búsqueda.

**Datos nuevos en `profiles`** (migración idempotente, los que ya existen se mantienen):

| Columna | Tipo |
|---|---|
| `iafarma_nombre_comercial` | text |
| `iafarma_localidad` | text (solo si hoy no existe una equivalente) |
| `iafarma_servicios` | text[] |
| `iafarma_marcas` | text[] |
| `iafarma_web` | text |
| `iafarma_instagram` | text |
| `iafarma_perfil_validado_at` | timestamptz |
| `iafarma_perfil_fuentes` | jsonb (fuente y cita de cada dato) |

Ya existen y se rellenan desde el alta: `iafarma_tone`, `iafarma_brand_primary`, `iafarma_brand_secondary`, `iafarma_logo_url`. El `localStorage` (`farmapro_iafarma_defaults`) pasa a ser solo caché.

### 7.6 Uso en la generación

- `ai-generate-image` toma del perfil validado el nombre comercial (para la firma), la paleta y el tono, y añade servicios y marcas como contexto («la farmacia trabaja X; si la pieza encaja, puede sugerirlo de forma genérica»), sin obligar a pintarlos y sin logos de marca.
- El logo se sigue superponiendo en el navegador (`overlayLogo`) como hoy, y el modelo deja libre su esquina.
- **Texto de ejemplo.** «Escribe aquí los consejos si quieres que salgan literales» sale del prompt (`pieceTypes.ts:95-98`) y pasa a ser ayuda de la pantalla; los consejos que escriba la farmacia van como líneas literales.
- **Subtítulo.** El límite de líneas de apoyo de `ai-generate-image` sube de 4 a 5, para que el post con 4 consejos conserve su subtítulo.

### 7.7 Interruptor

`iafarma_alta_guiada_activa` en la configuración del portal. Apagado, IAFarma sigue como hoy y el alta no aparece. **Encenderlo necesita el sí de Francesc.** El arreglo del texto de ejemplo y del subtítulo no depende del interruptor.

## 8. Lo que necesita a Francesc

- Token de Instagram de larga duración (usuario del sistema de Business Manager), como secret `IG_GRAPH_TOKEN`. Sin él, el alta funciona sin Instagram.
- El sí para encender `iafarma_alta_guiada_activa`.

## 9. Queda en manos de quien lo construya

- Estructura del código de la edge function y de las pantallas.
- Textos de la pantalla del alta.
- Tests: el alta con las farmacias reales del 20-11, un Instagram que no es de la farmacia, una sin web ni Instagram y una web que apunta a red privada.

## 10. Resultado de la comparación (20-11-2026)

Las 3 piezas reales (cartel de Lleida, post de Sevilla, promo de Castellón) se generaron con la misma información en tres versiones: Lovable antes (septiembre-octubre), Lovable con el código del repo de hoy (gpt-image-2 calidad media, tamaño nativo 1024x1280, 29-50 s por imagen) y el motor (calidad alta y comprobación letra a letra).

- Lovable hoy queda al nivel del motor y en la promo por encima. Texto correcto en las 3, firma en su sitio y paleta de la farmacia respetada.
- Lo que fallaba antes no era el modelo: era el recorte en el navegador, el copy que se inventaba frases y el texto de ejemplo enviado tal cual. Las 36 imágenes guardadas son anteriores al cambio del 24-10 (`3314ae9`).
- Sin confirmar: que la edge function desplegada sea la del repo. Se comprueba antes de desplegar nada.
- Con 3 muestras no se mide la tasa de errores de texto.

## 11. Motor de MKPRO (aparcado)

Francesc eligió el 20-11-2026 el alta guiada sola. El motor (calidad alta, comprobación letra a letra, fallback Pillow, en el VPS) queda como opción si, con el alta en marcha, siguen llegando quejas por texto mal escrito. Supondría publicar el motor (`render.mkpro.es`), una entrada `/iafarma/*` con cuota propia y pasar `ai-generate-image` a asíncrona. Coste: ~80 s y ~0,20 $ por imagen frente a ~40 s y 0,05–0,08 $ hoy.
