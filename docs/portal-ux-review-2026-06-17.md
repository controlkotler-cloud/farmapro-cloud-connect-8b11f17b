# Revisión UX/UI/visual — farmapro-portal (pre-lanzamiento)

**Fecha:** 2026-06-17
**Alcance:** revisión READ-ONLY del portal React+Vite+Tailwind+shadcn/ui en `farmapro-portal/`.
**Objetivo:** plan priorizado y accionable de mejoras visuales, de jerarquía/sistema, estados, gamificación (prioridad de negocio), responsive, accesibilidad y toque premium.

> Formato de cada ítem: **dónde** · **problema** (con cita/referencia) · **propuesta** · **impacto** (alto/medio/bajo) · **esfuerzo** (S/M/L).

---

## Diagnóstico de una frase

El portal tiene **buenos cimientos** (shadcn bien tokenizado, framer-motion ya integrado, onboarding cuidado, login con tokens, estructura por dominios limpia), pero **la identidad de marca está rota**: el token de marca es verde lima (`--primary: 85 65% 55%`) y casi toda la Uql de páginas pinta con gradientes azul/morado/rosa/ámbar **hardcodeados** (149 apariciones en 60 archivos). El resultado es un portal colorido tipo "plantilla genérica" que no se parece a farmapro y que **no soporta dark mode** pese a tenerlo definido. La gamificación —que es el gancho de recurrencia— existe y es rica, pero vive enterrada y con bugs de coherencia.

---

## 0. Lo que YA está bien (no romper)

- **Primitivas shadcn correctamente tokenizadas.** `button.tsx`, `badge.tsx`, `card.tsx` usan `bg-primary`, `bg-card`, `text-card-foreground`, `focus-visible:ring-ring`. La base es sólida; el problema está en las capas de dominio que la ignoran.
- **framer-motion ya está instalado y en uso** (v12) con patrones de entrada consistentes (`initial/animate`, `staggerChildren`). No hace falta añadir dependencias para microinteracciones.
- **OnboardingWizard** (`components/onboarding/OnboardingWizard.tsx`) es de buena calidad: 5 pasos, dots de progreso animados, skip, persiste `has_completed_onboarding`, y se puede repetir desde Perfil. Bien pensado.
- **`pointsService.ts`** define un modelo de niveles con identidad farmacéutica ("Alumno 🌱", "Auxiliar Digital 💊", "Farmacéutico Pro ⚕️", "Referente del Sector 👑"). Es un buen activo de producto.
- **Estados de carga existen** en casi todas las superficies (skeletons en cursos, recursos, retos, badges, ranking).
- **Responsive considerado** en el layout: `useIsMobile`, sidebar colapsable, Perfil convierte tabs en `Select` en móvil, GlobalSearch se reubica.
- **Login bien tokenizado y on-brand** existe... aunque no es el que se usa (ver 3.1).
- **i18n de fechas** en `es-ES` y SEO/OG correctos en `index.html` con la marca en minúsculas.

---

## 1. Quick wins visuales (alto impacto / bajo esfuerzo)

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 1.1 | `src/App.css` | Es el **boilerplate de Vite sin tocar** (`.logo`, `logo-spin`, `#root { max-width:1280px; text-align:center }`). Si `#root` se aplicara entró­metería el layout; es ruido muerto. | Vaciar/eliminar `App.css` (confirmar que no se importa, o limpiarlo). | Bajo | S |
| 1.2 | `src/components/retos/ChallengeCard.tsx` (líneas 33-40) | **`console.log('Challenge progress debug:', …)` en producción** dentro de un componente que se renderiza por cada reto. También hay `console.log` en 28 archivos (varios de UI). | Quitar los `console.log` de componentes de render. | Medio | S |
| 1.3 | `OnboardingWizard.tsx` (líneas 21, 38) | **"Farmapro" con F mayúscula** ("¡Bienvenido a Farmapro!", "El foro de Farmapro…"). Viola la regla universal de marca en minúsculas. | Cambiar a "farmapro". | Medio | S |
| 1.4 | `OnboardingWizard.tsx` (highlights de cada paso) | Cifras **hardcodeadas y falsas en pre-lanzamiento**: "10 cursos disponibles", "7 categorías · 24 hilos activos", "9 recursos descargables". Un usuario nuevo verá promesas que el portal vacío no cumple. | Sustituir por copy sin números, o por conteos reales desde Supabase. | Alto | S |
| 1.5 | `components/dashboard/StatsGrid.tsx` | Las 4 tarjetas de stats son **gradientes saturados a pantalla completa** (azul, verde, morado, naranja) con número grande. Compiten entre sí y con la WelcomeCard verde. | Tarjetas en `bg-card` con borde, número en `text-foreground` y solo el **icono** con color de acento. Más legible y más premium. | Alto | S |
| 1.6 | `Header.tsx` (línea 144) | Avatar de usuario en `bg-gradient-to-r from-green-500 to-green-600` (verde hardcodeado), mientras el `SidebarFooter` usa avatar **azul-morado** y el `SidebarHeader` un punto verde. Tres tratamientos de avatar distintos. | Unificar avatar con `bg-primary text-primary-foreground` en los tres sitios. | Medio | S |
| 1.7 | `Header.tsx` (líneas 77-81) | El badge de notificaciones muestra el **número crudo** sin tope; con 100+ se desborda visualmente. | Mostrar `9+` cuando `> 9`. | Bajo | S |
| 1.8 | `components/layout/sidebar/SidebarHeader.tsx` | Punto verde con `animate-pulse` permanente arriba a la derecha del logo: parece un indicador de estado/notificación que no significa nada. | Quitar el punto, o convertirlo en indicador real (online/novedades). | Bajo | S |
| 1.9 | `Footer.tsx` | El año se calcula bien, pero el copyright es escueto. Pre-lanzamiento: falta enlace a "Planes/Precios" y a soporte visible desde el dashboard. | Añadir enlace a `/precios` y mailto soporte en el footer. | Bajo | S |

---

## 2. Jerarquía visual, consistencia y sistema (tokens vs hardcodeo)

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 2.1 | **Todo el portal** (149 apariciones de `from-blue-/from-purple-/from-yellow-/…` en 60 archivos) | El sistema define `--primary` = **verde lima** pero la UI real está pintada con **gradientes hardcodeados** ajenos a la marca. La identidad visual no es verde: es un arcoíris genérico. | Definir 1-2 acentos de marca como tokens (`--brand`, `--brand-2`) y migrar componentes a esos tokens. Empezar por las superficies de mayor exposición (sidebar, headers, stats, gamificación). | **Alto** | **L** |
| 2.2 | `index.css` (no define `--success/--warning/--info`) vs `tailwind.config.ts` (líneas 64-66, los declara) | **Tokens rotos:** `success`, `warning`, `info` están mapeados a `hsl(var(--success))` etc. pero esas variables **no existen** en `:root`. Cualquier `text-success`/`bg-warning` renderiza color inválido. | Añadir las variables al `:root` y `.dark`, o quitar el mapeo del config. | Medio | S |
| 2.3 | `--primary` vs `--accent` en `index.css` (líneas 19 y 28) | **`accent` es idéntico a `primary`** (`85 65% 55%`). No hay color de acento real; `hover:bg-accent` en ghost/outline pinta verde lima saturado, no un sutil hover. | Definir `accent` como un tono suave (p. ej. `muted` o un verde muy claro) distinto del `primary`. | Medio | S |
| 2.4 | Fuente `display` (Space Grotesk) | `font-display` se define en Tailwind y se carga, pero **solo se usa en 1 archivo** (`pages/Login.tsx`, que además está muerto, ver 3.1). **Todos los títulos del portal real usan Plus Jakarta Sans.** El esfuerzo de cargar dos fuentes no rinde. | Decidir: o aplicar `font-display` a los `h1/h2/CardTitle` (más carácter), o quitar la fuente para no pagar su coste. | Medio | S/M |
| 2.5 | Títulos en `text-gray-900` / textos en `text-gray-600` (decenas de archivos: `FormacionHeader`, `Perfil`, `CommunityHeader`, `CommunityStats`, etc.) | Se usan **grises de Tailwind hardcodeados** en vez de `text-foreground`/`text-muted-foreground`. Consecuencia: **el dark mode (definido en `index.css`) no funciona** — el `.dark` cambia los tokens, pero estos textos quedan fijos en gris claro. | Reemplazar `text-gray-900→text-foreground`, `text-gray-600→text-muted-foreground`, `bg-gray-50→bg-muted`, etc. | Alto | M |
| 2.6 | Headers de sección, cada uno con su pastel: `Formacion` azul, `Comunidad` rosa, `Retos` amarillo (y dentro indigo), `Eventos` naranja | Patrón repetido (`bg-gradient-to-r from-X-50 to-X-100 … barra lateral from-X-400 to-X-600`) **copiado y pegado** con un color distinto por sección. Es consistente en *forma* pero incoherente en *marca* y multiplica el mantenimiento. | Extraer un componente `<PageHeader title subtitle icon>` con estilo de marca único (o acento por sección derivado de un token, no de Tailwind crudo). | Alto | M |
| 2.7 | `LevelProgressCard.tsx` (líneas 15-23, 50-52) vs `pointsService.ts` | **Bug de coherencia de datos:** la tarjeta de nivel de Retos calcula el progreso con `totalPoints % 1000` y objetivo `level * 1000`, **ignorando** el modelo real de `LEVELS` (0-99, 100-299, 300-599, 600-999, 1000-1999, 2000+). La `WelcomeCard` del Dashboard sí usa `pointsService`. **Un mismo usuario verá "faltan X" distintos en Dashboard y en Retos.** | Hacer que `LevelProgressCard` use `getNextLevelProgress`/`getPointsToNextLevel`/`getLevelInfo` de `pointsService`. | Alto | S |
| 2.8 | Badge "X pts" pintado de tres formas | En `ChallengeCard` es `from-yellow-400 to-orange-500`, en `WeeklyChallengesSection` es `variant="outline"`, en `UpcomingChallenges` es `<Badge>` default (verde). El mismo concepto ("puntos") con tres estilos. | Crear un `<PointsBadge value>` reutilizable y único. | Medio | S |
| 2.9 | `CourseCard.tsx` (línea 89) | "Nivel" del curso es **falso/derivado**: muestra `course.is_premium ? 'Avanzado' : 'Intermedio'` con icono de "Users" (que sugiere nº de alumnos, no dificultad). Engañoso. | Usar un campo real de dificultad, o quitar el indicador. Cambiar icono. | Bajo | S |

---

## 3. Estados (vacío / carga / error) y primeras impresiones

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 3.1 | `pages/Login.tsx` vs `components/auth/LoginForm.tsx` (usado en `AppRoutes.tsx` línea 97) | **Hay dos logins y se usa el peor.** `Login.tsx` está **on-brand** (icono Pill en `bg-primary`, "farma**pro**" con `text-primary`, `font-display`, tabs login/registro) pero **es código muerto**: la ruta `/login` renderiza `LoginForm`, que usa `bg-gradient-to-br from-blue-50 to-indigo-100` y enlaces `text-blue-600` (azul, off-brand). La **primera pantalla** del portal contradice la marca. | Adoptar el diseño de `Login.tsx` (o portar su estilo a `LoginForm`) y borrar el muerto. | **Alto** | **M** |
| 3.2 | `pages/Dashboard.tsx` + widgets | **Primera impresión de un usuario nuevo (pre-lanzamiento) = dashboard casi vacío.** `MiniLeaderboard`, `RecentBadges`, `EngagementWidget`, `WeeklyChallengesSection`, `RecentBadges` hacen `return null` cuando no hay datos. Para un usuario a estrenar queda: banner motivacional + WelcomeCard con **0 pts** + StatsGrid **todo a 0** + "No hay actividad reciente" + columna derecha **vacía**. Comunica "esto está muerto". | Diseñar un **estado de bienvenida/activación**: en vez de `null`, mostrar tarjetas "primer paso" ("Completa tu primer curso para empezar a sumar puntos", "Preséntate en la comunidad"). Convertir vacíos en llamadas a la acción. | **Alto** | **M** |
| 3.3 | `LeaderboardSection.tsx` (línea 34) y `RecentActivity.tsx` (línea 48) | Vacíos **solo texto**, sin ilustración ni CTA: "Aún no hay datos de ranking.", "No hay actividad reciente aún." Funcional pero pobre y desmotivador en una superficie de enganche. | Empty states con icono/ilustración + microcopy + CTA (p. ej. botón "Ver retos"). | Medio | S |
| 3.4 | Ausencia de **error states** | Muchos data-fetch (`CommunityContent`, `EngagementWidget`, `MotivationalBanner`, `Comunidad.loadForumStats`) capturan el error con `console.error` y **se quedan en silencio** (UI vacía o sin feedback). El usuario no distingue "no hay datos" de "ha fallado la carga". | Añadir estado de error con reintento (al menos en Comunidad/Recursos/Formación/Retos). | Medio | M |
| 3.5 | `AppRoutes.tsx` (líneas 46-55) | Loader global = spinner azul (`border-blue-600`) "Iniciando aplicación..." sobre `bg-gray-50`. Off-brand y sin logo. Es lo primero que se ve. | Spinner con color de marca + logo farmapro centrado. | Bajo | S |
| 3.6 | `pages/NotFound.tsx` | Usa gradientes azules (aparece en el grep). El 404 es una superficie de marca olvidada. | Rediseñar 404 con marca + CTA "Volver al dashboard". | Bajo | S |
| 3.7 | `OnboardingWizard.tsx` | Es **modal a pantalla completa que bloquea** y dispara en el primer render del Dashboard. Bien, pero si el perfil aún carga, `has_completed_onboarding` puede estar `undefined` y parpadear. Además no hay paso que pida los datos clave (farmacia/cargo) que el registro deja opcionales. | Garantizar que solo aparezca con perfil cargado; considerar un paso de "completa tu perfil" accionable. | Medio | M |

---

## 4. Gamificación como gancho de recurrencia (PRIORIDAD DE NEGOCIO)

> El sistema ya existe y es rico (niveles temáticos, badges con progreso, retos permanentes + semanales con countdown, leaderboard, racha, banner motivacional, EngagementWidget con "te faltan X"). El problema **no es falta de funcionalidad, es de visibilidad, coherencia y de que no tira del usuario hacia la acción.**

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 4.1 | `pages/Dashboard.tsx` (layout, líneas 45-55) | Toda la gamificación de enganche (UpcomingChallenges, RecentBadges, **MiniLeaderboard**) está en la **columna derecha**, que en móvil cae **debajo** de RecentActivity+EngagementWidget, y en desktop compite por atención. El gancho está literalmente en segundo plano. | Subir a una **fila superior de "engagement"** bajo la WelcomeCard: racha + posición en ranking + próximo badge + reto semanal con countdown, en tarjetas compactas y visibles sin scroll. | **Alto** | **M** |
| 4.2 | `WelcomeCard.tsx` | Es la pieza mejor resuelta (usa `pointsService`, barra de progreso, icono de nivel) pero está **en verde corporativo a sangre** y no enlaza a Retos. El "héroe" del enganche no invita a hacer nada. | Añadir CTA "Ver mis retos" y micro-stat "puesto #N". Hacerla el centro de gravedad de la página. | Alto | S |
| 4.3 | `points` invisibles tras una acción | No se ve evidencia de **feedback inmediato al ganar puntos** (toast/animación "+10 pts") al completar módulo/quiz/post. La recompensa llega "en frío" (banner el día siguiente). El refuerzo es lo que crea hábito. | Añadir toast/animación "+X pts" y, en hitos, celebración (confetti framer-motion) al subir de nivel / desbloquear badge. | **Alto** | **M** |
| 4.4 | `LevelProgressCard.tsx` (ver 2.7) | El progreso de nivel **muestra números incorrectos** en la página dedicada a Retos. Justo donde el usuario va a "ver cuánto le falta", el dato miente. | (mismo fix que 2.7) usar `pointsService`. | Alto | S |
| 4.5 | `Retos.tsx` (líneas 81-121) | El **ranking está escondido en la 3ª pestaña** ("Retos Permanentes | Insignias | Ranking"), por defecto en "challenges". El leaderboard es el motor competitivo y casi nadie llegará a pulsar la 3ª tab. | Subir el ranking (o un Top-5 + "tu puesto") por encima de las tabs, siempre visible. El MiniLeaderboard ya existe: reusarlo. | Alto | S |
| 4.6 | Emojis como sistema de iconografía (`UserStatsCards` 🔥, `LeaderboardSection` 🏅, `ChallengeCard` 📚💬📁👥🏆🎉, badges con emoji, niveles con emoji) | La densidad de emoji da un tono **informal/inconsistente** entre navegadores (render distinto) y choca con la regla "sin emojis salvo redes". En gamificación pueden funcionar, pero hoy **conviven emoji + iconos lucide + gradientes** sin criterio. | Definir UNA estrategia: o iconos lucide coloreados con tokens (recomendado), o emoji solo en niveles/badges como "ilustración" y lucide para el resto. Quitar emoji de microcopy ("🎯 Te faltan…", "🔥 Racha"). | Medio | M |
| 4.7 | `UserStatsCards.tsx` | 4 tarjetas, cada una de un color (amarillo/azul/verde/naranja) — mismo problema de arcoíris que StatsGrid, y **duplica** datos que ya están en LevelProgressCard (puntos, nivel). Redundante y ruidoso. | Unificar estilo (tokens), y eliminar la duplicación nivel/puntos con la LevelProgressCard. | Medio | S |
| 4.8 | `WeeklyChallengesSection.tsx` | Muy bien hecho (countdown en vivo, gradiente ámbar atractivo) pero **`return null` si no hay retos** (línea 43). En pre-lanzamiento sin retos semanales cargados, desaparece sin avisar. | Si no hay retos activos, mostrar placeholder "Pronto: nuevos retos semanales" en vez de nada. | Medio | S |
| 4.9 | Badges (`BadgesSection.tsx`) | Buen diseño (bloqueadas en grayscale, progreso). Pero las desbloqueadas no tienen **celebración** ni se anuncian en el momento; el usuario las descubre. Se pierde el "subidón". | Modal/toast de "¡Insignia desbloqueada!" con la animación spring que ya usa `RecentBadges`. | Alto | M |

---

## 5. Responsive / móvil

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 5.1 | `pages/Dashboard.tsx` | En móvil, el grid `lg:grid-cols-2` colapsa a 1 columna y la columna de **gamificación queda al final**, tras RecentActivity y EngagementWidget. El usuario móvil tiene que hacer mucho scroll para ver ranking/retos. | Reordenar para móvil: engagement primero (ligado a 4.1). | Alto | S |
| 5.2 | `Perfil.tsx` (línea 100) | En desktop el `TabsList` usa `gridTemplateColumns: repeat(N, …)` con hasta **7 tabs** (Personal, Plan, Equipo, Insignias, Facturación, Seguridad, Notificaciones). Con iconos+texto en 7 columnas, en pantallas medianas se aprietan/parten. (En móvil sí hay `Select`, bien.) | Permitir wrap o scroll horizontal del TabsList en breakpoints intermedios. | Medio | S |
| 5.3 | `SidebarNavigation.tsx` (línea 73) | `space-y-2 lg:space-y-7` → en desktop **28px entre items** del menú: el menú queda muy aireado y obliga a scroll con 10+ secciones (+admin). | Reducir a `space-y-1`/`space-y-2`; el aire actual desperdicia vertical. | Bajo | S |
| 5.4 | `Header.tsx` (móvil) | En móvil se muestran hamburguesa + logo + (search abajo) + campana + avatar. Razonable, pero el **logo se repite** (también está en el SidebarHeader al abrir el drawer). Menor. | Revisar duplicidad de logo en móvil. | Bajo | S |
| 5.5 | Tarjetas de stats `h-32` fijo (`StatsGrid`) | Altura fija puede recortar contenido si el título envuelve en móvil estrecho. | Usar min-height en vez de height fija. | Bajo | S |

---

## 6. Accesibilidad (quick wins reales)

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 6.1 | `--primary: 85 65% 55%` + `--primary-foreground: 0 0% 100%` (`index.css`) | **Contraste insuficiente:** texto blanco sobre el verde lima de marca ronda ~2:1, **muy por debajo de 4.5:1 (AA)**. Afecta a todos los botones primarios, badges default y `WelcomeCard`. Es el problema de accesibilidad más extendido. | Oscurecer el `--primary` (bajar la L a ~40-45%) para que el blanco cumpla AA, o usar texto oscuro sobre el verde claro. Verificar con un checker. | **Alto** | **S/M** |
| 6.2 | Botones/tarjetas clicables sin label | `ThreadCard` (línea 47) y patrones similares son `Card onClick` sin rol/teclado: no son focuseables ni accionables con Enter. La campana sí tiene `aria-label` (bien), pero las cards no. | Hacer las tarjetas clicables `<button>`/`role="button"` con `tabIndex` y handler de teclado, o envolver el título en `<a>`. | Medio | M |
| 6.3 | `CommunityContent.tsx` (líneas 200-226) | Filtros de categoría como `<button>` con color **rosa** activo (`bg-pink-500 text-white`) — contraste ok, pero el estado activo se comunica **solo por color** (sin `aria-pressed`). | Añadir `aria-pressed`/`aria-current` a los chips de filtro. | Bajo | S |
| 6.4 | Iconos informativos sin texto alternativo | Iconos lucide que portan significado (RankIcon corona/medalla en leaderboard, candado premium, check de completado) no tienen `aria-label`/`sr-only`. | Añadir `aria-label` o texto `sr-only` a iconos con significado. | Medio | S |
| 6.5 | `SidebarNavigation` activo | El item activo se indica por color azul + barra + flecha, pero falta `aria-current="page"`. | Añadir `aria-current="page"` al `Link` activo. | Bajo | S |
| 6.6 | Imágenes/avatars | `AvatarFallback` usa `first_name[0]` — si el nombre viene vacío puede romper; y los `alt` de imágenes de curso/evento están (bien), pero el degradado decorativo sobre imágenes de evento no necesita alt (ok). Revisar fallback de inicial. | Guardas para inicial vacía. | Bajo | S |

---

## 7. Toque premium / moderno (microinteracciones, ilustración)

| # | Dónde | Problema | Propuesta | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 7.1 | Global | Los vacíos son **icono lucide gris + texto**. Hoy se siente "plantilla". framer-motion ya está disponible. | Ilustraciones simples (SVG) y estados vacíos animados. Eleva mucho la percepción con poco. | Medio | M |
| 7.2 | Subida de nivel / badge / completar curso | No hay **momentos de celebración**. Es lo que diferencia un portal "premium con alma" de uno funcional. | Confetti/animación al subir de nivel y al desbloquear badge (framer-motion). Liga con 4.3/4.9. | Alto | M |
| 7.3 | Hover de tarjetas | Mezcla de efectos: unas `hover:scale-[1.02]` (CommunityStats, ResourceCard), otras solo `hover:shadow-lg`, el sidebar `hover:scale-[1.02]` en cada item. Inconsistente. | Unificar el lenguaje de hover (p. ej. shadow + leve translate) en un patrón de tarjeta. | Bajo | M |
| 7.4 | Gradientes saturados de fondo | Los gradientes a sangre (StatsGrid, WelcomeCard, headers) leen "2019". El look premium 2026 tiende a superficies claras, bordes sutiles, color en acentos y datos. | Sustituir grandes superficies de gradiente por `bg-card` + acentos. (Liga con 1.5 / 2.6.) | Alto | M |
| 7.5 | Skeletons genéricos | Los skeletons son `bg-gray-200`/`bg-muted` rectangulares; algunos usan `bg-gray-200` (no token) → no dark-mode safe. | Skeletons con shimmer y tokens (`bg-muted`), con forma parecida al contenido real. | Bajo | S |
| 7.6 | Transiciones de página | El scroll-to-top es `behavior:'instant'` (`DashboardLayout`). Correcto para no marear, pero no hay transición entre rutas. | Opcional: fade sutil entre páginas (ya hay patrón con framer-motion). | Bajo | S |

---

## TOP 5-10 recomendaciones por ROI

1. **Arreglar el contraste del verde de marca (`--primary`).** (6.1) — Afecta a TODOS los botones/badges, es un fallo AA real y la corrección es un cambio de token. **Impacto alto / esfuerzo S.** Bloqueante de calidad para lanzar.
2. **Reemplazar el login en uso por la versión on-brand y borrar el muerto.** (3.1) — La primera pantalla del portal hoy contradice la marca (azul en vez de verde). Ya existe el `Login.tsx` bueno. **Alto / M.**
3. **Rediseñar el estado de "usuario nuevo / portal vacío" del Dashboard.** (3.2, 4.1) — En pre-lanzamiento el dashboard se ve muerto (ceros + columnas en `null`). Convertir vacíos en CTAs de activación y subir la gamificación a la primera fila. **Alto / M.** Es la cara del producto el día del lanzamiento.
4. **Corregir el bug de coherencia de niveles en Retos.** (2.7, 4.4) — `LevelProgressCard` muestra números distintos a los del Dashboard porque ignora `pointsService`. Dato erróneo en la página estrella de gamificación. **Alto / S.**
5. **Hacer visible el ranking + feedback inmediato de puntos.** (4.5, 4.3, 4.9) — Sacar el leaderboard de la 3ª pestaña y añadir el "+X pts"/celebración al ganar. Es directamente el gancho de recurrencia del negocio. **Alto / M.**
6. **Tokenizar grises y migrar superficies clave del arcoíris al color de marca.** (2.5, 2.1, 2.6) — Empezar por sidebar, headers de página (componente `PageHeader`) y StatsGrid. Arregla identidad **y** habilita dark mode. Es L en total, pero por fases da retorno inmediato. **Alto / M-L.**
7. **Limpiar deuda visible:** quitar `console.log` de `ChallengeCard` y otros, vaciar `App.css`, corregir "Farmapro"→"farmapro", y quitar/usar la fuente `display`. (1.1, 1.2, 1.3, 2.4) — Conjunto de quick wins de pulido. **Medio / S.**
8. **Sustituir cifras falsas del onboarding por copy/cifras reales.** (1.4) — Evita prometer al usuario nuevo un portal lleno que aún no existe. **Alto / S.**
9. **Definir/limpiar tokens semánticos** `success/warning/info` y diferenciar `accent` de `primary`. (2.2, 2.3) — Cierra agujeros del sistema que hoy renderizan colores inválidos. **Medio / S.**
10. **Estados vacíos con ilustración + celebración de hitos.** (7.1, 7.2) — El salto de "funcional" a "premium con alma" que el portal necesita para justificar la suscripción. **Alto / M.**

---

### Nota de método
Revisión basada en lectura directa del código (no ejecución). Archivos clave citados, todos bajo `farmapro-portal/`:
`tailwind.config.ts`, `src/index.css`, `src/App.css`, `index.html`,
`src/components/routing/AppRoutes.tsx`, `src/components/layout/{DashboardLayout,Header,Sidebar,Footer}.tsx` y `sidebar/*`,
`src/pages/{Dashboard,Login,Formacion,Comunidad,Recursos,Perfil,Precios,CourseView,NotFound}.tsx`,
`src/components/auth/{LoginForm,AuthForm}.tsx`, `src/components/onboarding/OnboardingWizard.tsx`,
`src/components/dashboard/*` (WelcomeCard, StatsGrid, MiniLeaderboard, RecentBadges, EngagementWidget, MotivationalBanner, UpcomingChallenges, RecentActivity),
`src/components/retos/*` (LevelProgressCard, UserStatsCards, ChallengeCard, BadgesSection, LeaderboardSection, WeeklyChallengesSection),
`src/components/{course/CourseCard,forum/ThreadCard,resources/ResourceCard,events/EventCard}.tsx`,
`src/components/community/{CommunityHeader,CommunityStats,CommunityContent}.tsx`,
`src/services/pointsService.ts`, `src/components/ui/{button,badge,card}.tsx`.
