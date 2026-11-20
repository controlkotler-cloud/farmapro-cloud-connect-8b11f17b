# IAFarma: alta guiada. Plan de construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** antes de su primera imagen, la farmacia ve una ficha con sus datos (buscados en su web, Instagram y ficha de Google), la corrige o la valida, y eso llega a la generación.

**Architecture:** una edge function nueva `iafarma-perfil` busca y devuelve una propuesta con fuente y cita de cada dato, sin escribir en `profiles`. La lógica pura (guarda SSRF, lectura del HTML, citas, elección del candidato de Google) vive en `supabase/functions/_shared/iafarmaPerfil/` sin dependencias de Deno, para probarla con vitest. El navegador saca la paleta del logo con canvas, enseña la ficha y guarda lo validado en `profiles`.

**Tech Stack:** React + Vite + TypeScript, Supabase (Postgres, Storage, edge functions en Deno), vitest, DataForSEO, Graph API de Instagram, pasarela de Lovable (`google/gemini-3.6-flash`).

**Spec:** `docs/superpowers/specs/2026-11-20-iafarma-alta-guiada-design.md`

## Global Constraints

- Despliegue de frontend: push a `main` → `deploy_project` (proyecto `c3f72248-9d45-48ac-947a-a3472f2c51ba`) → comprobar en vivo.
- Edge functions: una sola `send_message` cerrada a Lovable con los nombres de las funciones y esta frase literal: «No toques codigo, no corrijas errores de build aunque los veas, no redespliegues nada; si detectas un error, dimelo y para». Después, `get_diff` del commit que devuelva y prueba de que corre la versión nueva.
- Nunca un mensaje a Lovable con un commit nuestro sin sincronizar. `git add` solo por ruta, nunca `-A`; `git fetch` antes de cada commit.
- Migraciones por `query_database` (`project_id`, `sql`), idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), y copia en `supabase/migrations/`.
- Secrets: nunca en el repo ni en el chat. Los mete Francesc: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `IG_GRAPH_TOKEN`, `IG_BUSINESS_ID`. Sin ellos, el paso correspondiente se salta.
- Interruptor: `system_settings` con `category='iafarma'`, `key='alta_guiada_activa'`, `value=false`. Encenderlo necesita el sí de Francesc.
- La farmacia nunca espera más de 45 s; tope de búsqueda completa 40 s.
- 3 búsquedas completas por usuario y día.
- Marcas vetadas, se quitan siempre: «Julia», «Celia» cuando se refieren a los robots (se quita cualquier marca que contenga `robot julia`, `robot celia`, `julia` o `celia` como palabra completa, salvo `blíster celia` y `blister celia`).
- Textos de pantalla en castellano de España, de tú, «farmapro» en minúsculas, sin raya larga.

## Review Focus

1. **Farmacias homónimas en la misma localidad.** Dos resultados con nombre parecido: nunca se elige solo, sale la lista. Test en la tarea 3 (`elegirCandidato`).
2. **Web que apunta a red privada** (`localhost`, `10.x`, `169.254.169.254`, DNS que resuelve a privada, redirección a privada). Se rechaza sin descargar. Tests en la tarea 3 (`comprobarUrl`).
3. **Fuente lenta o caída.** La búsqueda devuelve lo que tenga a los 40 s y dice qué fuentes fallaron. Prueba en vivo en la tarea 4 con una web que tarda 20 s.
4. **Cita con otros acentos, mayúsculas o espacios** se acepta; cita inventada se descarta. Tests en la tarea 3 (`filtrarConCita`).
5. **Logo casi blanco o transparente** (paleta vacía): se usan los colores del CSS y, si tampoco hay, los dos actuales o ninguno. Test en la tarea 5 (`paletaDeImagen`, `combinarPaleta`).

---

### Task 1: Texto de ejemplo fuera del prompt y quinta línea

**Files:**
- Modify: `src/components/creative/pieceTypes.ts:95-98` (pieza `post`)
- Modify: el componente que pinta la ayuda bajo la descripción de la pieza (buscar dónde se usa `hint` o `headlineExample` en `src/components/creative/ImageWorkspace.tsx`)
- Modify: `supabase/functions/ai-generate-image/index.ts:430-432`
- Test: `src/components/creative/pieceTypes.test.ts`

**Interfaces:**
- Produces: campo opcional `promptHelp?: string` en el tipo de pieza de `pieceTypes.ts`.

- [ ] **Step 1: test que falla**

```ts
it('el prompt del post no lleva texto de ejemplo', () => {
  const post = PIECE_TYPES.find(p => p.id === 'post')!;
  const p = post.buildPrompt({} as any);
  expect(p).not.toMatch(/Escribe aquí/i);
  expect(p).not.toMatch(/si quieres que salgan literales/i);
});
it('el post enseña la ayuda en pantalla', () => {
  expect(PIECE_TYPES.find(p => p.id === 'post')!.promptHelp)
    .toBe('Si escribes tus consejos en las líneas, saldrán tal cual en la imagen.');
});
```
(Usar el nombre real del array exportado en `pieceTypes.ts`.)

- [ ] **Step 2:** `npx vitest run src/components/creative/pieceTypes.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** quitar la frase del `buildPrompt` del post, añadir `promptHelp` al tipo y al post, y pintarlo en `ImageWorkspace.tsx` como texto de ayuda pequeño bajo el campo de descripción.
- [ ] **Step 4:** en `ai-generate-image/index.ts`, `copy.lines.slice(0, 4)` → `slice(0, 5)` y el comentario: «Máximo 5 líneas de apoyo: titular aparte, subtítulo y 4 consejos. Desde el 24-10 se pide tamaño nativo y no hay recorte.» Buscar en el mismo fichero cualquier instrucción al modelo de copy que diga «4 lines»/«4 líneas» y subirla a 5.
- [ ] **Step 5:** `npm test` y `npm run build`. Esperado: verde.
- [ ] **Step 6: Commit** `fix(iafarma): texto de ejemplo fuera del prompt y quinta línea de apoyo`.

### Task 2: Migración

**Files:**
- Create: `supabase/migrations/20261120120000_iafarma_alta_guiada.sql`

**Interfaces:**
- Produces: columnas en `profiles`: `iafarma_nombre_comercial text`, `iafarma_servicios text[]`, `iafarma_marcas text[]`, `iafarma_web text`, `iafarma_instagram text`, `iafarma_perfil_validado_at timestamptz`, `iafarma_perfil_fuentes jsonb`. La localidad sigue en `pharmacy_city` (ya existe). Tabla `iafarma_perfil_busquedas(id uuid pk default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, created_at timestamptz not null default now(), fuentes text[] not null default '{}', coste_estimado numeric(8,4) not null default 0)`, índice `(user_id, created_at)`, RLS activada sin políticas para usuarios (solo escribe y lee la service role). Fila `system_settings('iafarma','alta_guiada_activa', false)`.

- [ ] **Step 1:** escribir el SQL idempotente. Para `system_settings`, mirar en `supabase/migrations/` el tipo de `value` (jsonb o text) y si hay restricción única por `(category,key)`; si no la hay, `INSERT ... WHERE NOT EXISTS`.
- [ ] **Step 2:** aplicar con `query_database` y comprobar con `select column_name from information_schema.columns where table_name='profiles' and column_name like 'iafarma_%'` (11 columnas) y `select * from system_settings where category='iafarma'` (una fila, false).
- [ ] **Step 3:** volver a aplicar el mismo SQL. Esperado: sin error.
- [ ] **Step 4: Commit** `feat(iafarma): columnas del alta guiada y registro de búsquedas`.

### Task 3: Lógica pura compartida

**Files:**
- Create: `supabase/functions/_shared/iafarmaPerfil/urlSegura.ts`, `extraerWeb.ts`, `citas.ts`, `google.ts`, `tipos.ts`
- Create: tests al lado, `*.test.ts`
- Modify: `vitest.config.ts` (añadir `supabase/functions/_shared/**/*.test.ts` al `include`)

Sin imports de Deno ni de URL remotas en estos ficheros: deben cargar en vitest y en Deno.

**Interfaces (Produces):**
- `tipos.ts`:
  - `type Fuente = 'web' | 'instagram' | 'google' | 'manual'`
  - `interface Dato<T> { valor: T; fuente: Fuente; cita?: string }`
  - `interface Candidato { cid: string; placeId?: string; nombre: string; direccion: string; telefono?: string; web?: string; categoria?: string; foto?: string }`
  - `interface PropuestaPerfil { nombreComercial?: Dato<string>; localidad?: Dato<string>; tono?: Dato<string>; servicios: Dato<string>[]; marcas: Dato<string>[]; web?: string; instagram?: string; logoProvisional?: { url: string; path: string; fuente: Fuente }; coloresCss: string[]; googleElegido?: Candidato; fuentesFallidas: { fuente: Fuente; motivo: string }[] }`
  - `type RespuestaPerfil = { estado: 'elegir'; candidatos: Candidato[] } | { estado: 'ok'; propuesta: PropuestaPerfil } | { estado: 'limite'; mensaje: string }`
- `urlSegura.ts`: `esIpPrivada(ip: string): boolean`; `comprobarUrl(url: string, resolver: (host: string) => Promise<string[]>): Promise<{ ok: true; url: URL } | { ok: false; motivo: string }>`. Solo `http:`/`https:`, puerto vacío, 80 o 443, sin usuario/contraseña en la URL, host que no sea IP literal privada y cuyas IP resueltas sean todas públicas. Privadas: `127/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `100.64/10`, `0/8`, `::1`, `fc00::/7`, `fe80::/10`, IPv4 mapeada en IPv6.
- `extraerWeb.ts`: `extraerDeHtml(html: string, base: string): { logos: string[]; colores: string[]; instagram: string | null; texto: string; hojaCss: string | null }` (logos absolutos en orden: `<img>` con «logo» en class/id/alt/src, `apple-touch-icon`, `icon` con `sizes` ≥ 128, `og:image`; `texto` sin scripts ni estilos, espacios colapsados, máximo 12.000 caracteres; `instagram` = primer usuario de un enlace `instagram.com/<usuario>`, sin `p/`, `reel/` ni `explore/`); `coloresDeCss(css: string): string[]` (hex de `theme-color`, variables y reglas, normalizados a `#rrggbb` en minúscula, ordenados por frecuencia, sin casi blancos ni casi negros, máximo 6).
- `citas.ts`: `normalizar(s: string): string` (minúsculas, sin acentos, espacios colapsados); `filtrarConCita(items: Dato<string>[], textos: Partial<Record<Fuente, string>>): Dato<string>[]` (se queda con los que tienen cita, su fuente tiene texto y `normalizar(texto).includes(normalizar(cita))`); `quitarVetadas(marcas: Dato<string>[]): Dato<string>[]` según Global Constraints.
- `google.ts`: `nameSim(a: string, b: string): number` (0 a 1), `simplifyName`, `esFarmacia` portados de `farmapro-direct/supabase/functions/analizar-ficha/index.ts`; `elegirCandidato(nombre: string, cands: Candidato[]): { claro: Candidato | null; lista: Candidato[] }`: `claro` solo si hay exactamente un candidato con `nameSim ≥ 0.85`; `lista` ordenada por `nameSim`, máximo 6.

- [ ] **Step 1: tests que fallan**, como mínimo:
  - `comprobarUrl('http://localhost/', r)` → `ok:false`; `'http://169.254.169.254/'` → `ok:false`; `'https://farmacia.es/'` con resolver `['10.0.0.5']` → `ok:false`; con `['93.184.216.34']` → `ok:true`; `'ftp://x.es'` → `ok:false`; `'https://x.es:8080/'` → `ok:false`; `'http://[::ffff:127.0.0.1]/'` → `ok:false`.
  - `extraerDeHtml` con un HTML de muestra que tenga `<img class="site-logo" src="/img/l.png">`, `<a href="https://www.instagram.com/farmaciapepa/">`, un `<script>` y `<meta name="theme-color" content="#1A7F5A">` → `logos[0] === 'https://farmacia.es/img/l.png'`, `instagram === 'farmaciapepa'`, `texto` sin el contenido del script, `colores` contiene `'#1a7f5a'`.
  - `filtrarConCita([{valor:'Ortopedia',fuente:'web',cita:'ORTOPEDÍA  infantil'}], {web:'Servicio de ortopedia infantil'})` → 1 resultado; con `cita:'dermoestética avanzada'` → 0; sin `cita` → 0.
  - `quitarVetadas` quita `'Robot Julia'` y `'Celia'`, deja `'Blíster Celia'` y `'ISDIN'`.
  - `elegirCandidato('Farmacia Pepa', [Farmacia Pepa (calle A), Farmacia Pepa (calle B)])` → `claro === null`, `lista.length === 2`; con uno solo → `claro` ese.
- [ ] **Step 2:** `npx vitest run supabase/functions/_shared`. Esperado: FAIL.
- [ ] **Step 3:** implementar los cinco ficheros.
- [ ] **Step 4:** `npm test`. Esperado: verde.
- [ ] **Step 5: Commit** `feat(iafarma): lógica pura del alta guiada con tests`.

### Task 4: Edge function `iafarma-perfil`

**Files:**
- Create: `supabase/functions/iafarma-perfil/index.ts`

**Interfaces:**
- Consumes: todo lo de la tarea 3; tabla y columnas de la tarea 2.
- Produces: `POST /functions/v1/iafarma-perfil`, cuerpo `{ nombre: string; localidad: string; web?: string; instagram?: string; cid?: string }`, respuesta `RespuestaPerfil` (tarea 3). Error 401 sin sesión, 400 si faltan nombre o localidad.

- [ ] **Step 1:** auth igual que `ai-generate-image/index.ts:261-271` (cliente admin con service role, `admin.auth.getUser(token)`). CORS igual que esa función.
- [ ] **Step 2:** límite: contar filas de `iafarma_perfil_busquedas` del usuario en las últimas 24 h; con 3 o más, `{estado:'limite', mensaje:'Ya has hecho 3 búsquedas hoy. Puedes rellenar tu ficha a mano o volver mañana.'}`. La llamada que solo devuelve `estado:'elegir'` no cuenta; la que devuelve `ok` inserta una fila con fuentes usadas y coste estimado (0,003 por llamada a DataForSEO).
- [ ] **Step 3:** Google. Si hay `cid`, buscar ese; si no, `serp/google/maps/live/advanced` con `"{nombre} {localidad}"`, `location_coordinate` de `geocodeCity` (Nominatim con Photon de reserva, copiado de `analizar-ficha`), `language_code: 'es'`, filtrado con `esFarmacia`, reintento con `simplifyName`. Mapear a `Candidato` (`cid`, `place_id`, `title`, `address`, `phone`, `url`, `category`, `main_image`). `elegirCandidato`: si no hay claro y hay lista, devolver `{estado:'elegir', candidatos}` sin seguir. Sin secrets o sin resultados: `fuentesFallidas` y seguir.
- [ ] **Step 4:** web (la del cuerpo o la del candidato) e Instagram (el del cuerpo o el de la web) en paralelo con `Promise.allSettled`, cada uno con `AbortSignal.timeout(8000)`, todo dentro de un tope global de 40 s. Web: `comprobarUrl` con `Deno.resolveDns` (A y AAAA), `redirect: 'manual'` y hasta 3 saltos comprobados uno a uno, cuerpo cortado a 1,5 MB; luego `extraerDeHtml` y la primera hoja CSS propia con la misma guarda. Instagram: `GET https://graph.facebook.com/v21.0/{IG_BUSINESS_ID}?fields=business_discovery.username({usuario}){username,name,biography,website,profile_picture_url,media.limit(6){caption}}`; error 110 o cuenta no encontrada → `fuentesFallidas` con «Tu Instagram es personal o no lo encontramos».
- [ ] **Step 5:** logo: primer candidato que descargue (orden: logos de la web, foto de Instagram, foto de Google), con guarda, `content-type` `image/*`, máximo 2 MB. Subir a `iafarma-logos/{userId}/provisional-{timestamp}.{ext}` y devolver URL pública y `path`.
- [ ] **Step 6:** lectura del texto. Copiar el patrón de llamada a la pasarela de `supabase/functions/ai-creative-assistant/index.ts` con `google/gemini-3.6-flash` y salida JSON. Instrucción: devolver `nombreComercial`, `tono` (uno de los valores que admite IAFarma, ver `useIAFarmaDefaults.ts`), `servicios` y `marcas`, cada uno con `cita` literal copiada del texto y `fuente`; no inventar. Pasar el resultado por `filtrarConCita` y `quitarVetadas`; servicios y marcas máximo 8 cada uno. `localidad` del cuerpo, fuente `manual`.
- [ ] **Step 7:** `deno check supabase/functions/iafarma-perfil/index.ts` (o, sin Deno en el Mac, `npm run build` y revisión de imports). Esperado: sin errores.
- [ ] **Step 8: Commit** `feat(iafarma): función iafarma-perfil`.

### Task 5: Paleta del logo en el navegador

**Files:**
- Create: `src/lib/paleta.ts`, `src/lib/paleta.test.ts`

**Interfaces (Produces):**
- `paletaDeImagen(px: Uint8ClampedArray, n = 6): string[]` (RGBA; ignora alfa < 128, casi blancos con luminosidad > 0,92 y casi negros < 0,08; cuantiza a 4 bits por canal y devuelve los `n` más frecuentes como `#rrggbb`).
- `combinarPaleta(logo: string[], css: string[]): { primario?: string; secundario?: string }` (si un color del logo está a distancia RGB < 40 de uno del CSS, ese par manda; si no, los dos primeros del logo; sin logo, los dos primeros del CSS).
- `paletaDeUrl(url: string): Promise<string[]>` (carga con `crossOrigin='anonymous'`, dibuja a 64×64 en canvas, llama a `paletaDeImagen`; si falla, `[]`).

- [ ] **Step 1: tests que fallan:** píxeles todos `#ffffff` → `[]`; mitad `#1a7f5a` y mitad transparente → `['#187858']` (cuantización al centro del cubo de 4 bits, `v & 0xf0 | 0x08` por canal); `combinarPaleta([], ['#aa0000','#00aa00'])` → `{primario:'#aa0000', secundario:'#00aa00'}`; `combinarPaleta([], [])` → `{}`.
- [ ] **Step 2:** `npx vitest run src/lib/paleta.test.ts`. FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** verde. **Commit** `feat(iafarma): paleta del logo`.

### Task 6: Pantalla del alta

**Files:**
- Create: `src/hooks/useAltaGuiada.ts`
- Create: `src/components/creative/alta/AltaGuiada.tsx` (pasos 1 a 4), `FichaFarmacia.tsx` (tarjeta editable), `MuestraCanvas.tsx` (muestra)

**Interfaces:**
- Consumes: `RespuestaPerfil`, `PropuestaPerfil` (importar los tipos de `supabase/functions/_shared/iafarmaPerfil/tipos.ts` con ruta relativa o copiarlos a `src/types/iafarmaPerfil.ts` si el alias de Vite no llega); `paletaDeUrl`, `combinarPaleta`.
- Produces:
  - `useAltaGuiada()` → `{ buscar(datos: {nombre; localidad; web?; instagram?; cid?}): Promise<RespuestaPerfil>; guardar(ficha: FichaValidada): Promise<void>; buscando: boolean }`.
  - `interface FichaValidada { nombre: string; localidad: string; nombreComercial: string; tono: string; colorPrimario?: string; colorSecundario?: string; logoPath?: string; servicios: string[]; marcas: string[]; web?: string; instagram?: string; fuentes: Record<string, unknown> }`
  - `<AltaGuiada inicial?: Partial<FichaValidada> onTerminar={() => void} />`

- [ ] **Step 1:** `guardar`: si `logoPath` es provisional, copiar en Storage a `iafarma-logos/{userId}/logo.{ext}` y borrar la provisional; `update` de `profiles` con `pharmacy_name`, `pharmacy_city`, `iafarma_tone`, `iafarma_brand_primary`, `iafarma_brand_secondary`, `iafarma_logo_url` y las 7 columnas nuevas, `iafarma_perfil_validado_at = now()`; refrescar la caché de `useIAFarmaDefaults`.
- [ ] **Step 2:** paso 1: nombre y localidad obligatorios, web e Instagram opcionales con la ayuda «Si los tienes, acertaremos más». Botón «Buscar mis datos» y enlace «Prefiero rellenarlo yo».
- [ ] **Step 3:** paso 2: estado de espera con las tres fuentes y su avance; si llega `elegir`, lista de candidatos (foto, nombre, dirección) y «Ninguna es la mía», que sigue sin Google; si llega `limite`, su mensaje y la ficha a mano.
- [ ] **Step 4:** paso 3: `FichaFarmacia` con logo (cambiar o quitar), dos muestras de color editables (paleta = `combinarPaleta(await paletaDeUrl(logo), coloresCss)`), nombre comercial, localidad, tono (mismo selector que `PharmacyDefaults.tsx`), servicios y marcas como etiquetas que se quitan o añaden; junto a cada dato, «de tu web», «de tu Instagram», «de tu ficha de Google» o nada si es manual. Lo que falló, en una línea: «No hemos podido leer tu web». `MuestraCanvas` pinta 1080×1350 a escala: fondo primario, titular de ejemplo «Así se verán tus piezas» en blanco, firma con el nombre comercial y el logo abajo a la derecha al 16 % del ancho (mismo criterio que `overlayLogo`).
- [ ] **Step 5:** paso 4: «Está bien así» → `guardar` → `onTerminar`.
- [ ] **Step 6:** base visual del portal (`DESIGN.md` de la raíz de farmapro); móvil a 390 px sin scroll horizontal.
- [ ] **Step 7:** `npm run build` y `npm test`. Verde. **Commit** `feat(iafarma): pantalla del alta guiada`.

### Task 7: Puerta, prerrelleno y uso en la generación

**Files:**
- Modify: `src/components/creative/CreativeWorkspace.tsx`
- Modify: `src/components/creative/PharmacyDefaults.tsx`
- Modify: `src/hooks/useImageGeneration.ts:191-205` y `src/components/creative/CarouselImages.tsx:124`
- Modify: `supabase/functions/ai-generate-image/index.ts` (lectura del cuerpo, ~líneas 319-337)

**Interfaces:**
- Consumes: `AltaGuiada`, `useSystemSettings` (patrón de `useModoGratis.ts`).
- Produces: cuerpo de `ai-generate-image` con dos campos opcionales nuevos `services?: string[]`, `brands?: string[]`.

- [ ] **Step 1:** en `CreativeWorkspace`, mostrar `<AltaGuiada>` en lugar del generador si (`alta_guiada_activa` es true **o** la URL lleva `?altaGuiada=1`) y el perfil no tiene `iafarma_perfil_validado_at`. `inicial` = lo que ya hay en `useIAFarmaDefaults` (nombre, localidad, tono, colores, logo).
- [ ] **Step 2:** en `PharmacyDefaults.tsx`, campos de servicios y marcas y botón «Buscar de nuevo mis datos», que abre `AltaGuiada` con lo guardado.
- [ ] **Step 3:** `useImageGeneration` y `CarouselImages`: `pharmacyName` = `iafarma_nombre_comercial` si existe, si no `pharmacy_name`; enviar `services` y `brands` del perfil.
- [ ] **Step 4:** en `ai-generate-image`, leer `services` y `brands` (máximo 8 cada uno, 40 caracteres cada uno, sin vetadas) y, si hay alguno, añadir al prompt: ` Context only (do not render as text, no brand logos): the pharmacy offers ${services.join(', ')}; it works with brands ${brands.join(', ')}. Use this only to keep imagery coherent with the pharmacy.`
- [ ] **Step 5:** `npm run build`, `npm test`. **Commit** `feat(iafarma): puerta del alta y datos validados en la generación`.

### Task 8: Despliegue y prueba en vivo

- [ ] **Step 1:** `git fetch`, `git status`, rebase si Lovable ha commiteado, push a `main`. Confirmar con `get_project` que `latest_commit_sha` es el nuestro.
- [ ] **Step 2:** `deploy_project` y comprobar en vivo (`portal.farmapro.es`) que el bundle tiene la cadena «Buscar mis datos».
- [ ] **Step 3:** una `send_message` a Lovable: desplegar `iafarma-perfil` y `ai-generate-image`, con la frase literal de Global Constraints. `get_diff` del commit que devuelva: no debe tocar nada más.
- [ ] **Step 4:** pedir a Francesc los secrets (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, y si quiere `IG_GRAPH_TOKEN`, `IG_BUSINESS_ID`) por el formulario seguro de Lovable. Mientras tanto, probar sin ellos: el alta debe funcionar con web y a mano.
- [ ] **Step 5:** con la cuenta de pruebas del portal y `?altaGuiada=1`: alta de las 3 farmacias de la comparación del 20-11 (Farmàcia del centre de Lleida, Farmacia del Toro de Sevilla, Farmacia Catalán de Castellón) y 2 más de las que tienen perfil en el portal, una homónima, una sin web ni Instagram y una web lenta (`https://httpbin.org/delay/20`). Comprobar: ningún dato sin fuente, ninguna espera > 45 s, homónima con lista, la lenta sale en `fuentesFallidas`.
- [ ] **Step 6:** tras el alta, generar un post con 4 consejos: salen titular, subtítulo y los 4, la firma con el nombre comercial y el logo superpuesto. Esto prueba también que corre la versión nueva de `ai-generate-image`.
- [ ] **Step 7:** devolver la cuenta de pruebas a su estado (borrar `iafarma_perfil_validado_at`), apuntar en la nota de memoria lo verificado y preguntar a Francesc si enciende `alta_guiada_activa`.
