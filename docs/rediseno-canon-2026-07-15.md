# Rediseño del portal al canon farmapro — 2026-07-15

> Estado y reglas para cualquier sesión (Cowork, Claude Code o prompt a Lovable) que toque la UI del portal a partir de ahora.
> Canon completo: `DESIGN.md` en la raíz de la carpeta farmapro (espejado como knowledge del proyecto Lovable).

## Qué se desplegó (commits `4c5e690` y `ed56388` en main)

1. **Tokens** (`src/index.css` + `tailwind.config.ts`): verde canónico hue 84 (`brand` #88C835 / `brand-dark` / `brand-soft`), neutros cálidos, radio 0.625rem, dark mode completo, y la paleta **botica** con clases Tailwind propias: `miel`, `terracota`, `salvia`, `ciruela` (+ variante `-soft` cada una).
2. **Tipografía**: Manrope 400-800 + Fraunces itálica cargadas en `index.html` (antes se declaraban Plus Jakarta/Space Grotesk y no se cargaba ninguna). Utilidad `.italic-display` = la firma farmapro (solo bienvenidas/cabeceras/vacíos).
3. **Logos**: `/logo-farmapro.svg`, `/icono-farmapro.svg`, `/favicon.svg` (SVG canónicos copiados de direct). Prohibido volver a los PNG de `lovable-uploads`.
4. **Barrido de color** (~110 componentes): cero clases Tailwind crudas (green/blue/purple/…/red-NNN) fuera de `components/ui/`. Asignación de acentos por sección: formación=brand · retos/premios/Rebotica=miel · foro/eventos/comunidad=terracota · recursos/empleo/farmacias=salvia · IA/premium=ciruela · admin/settings=neutro shadcn. Estados reales → `success`/`warning`/`info`/`destructive`.
5. **Dashboard nuevo** (`src/pages/Dashboard.tsx`): `DashboardHero` (saludo por hora + frase del día en Fraunces + nivel/puntos + chip de racha + CTA continuar curso), `HighlightCards.tsx` (Formación/Reto/Evento/Foro/Recursos con queries reales vía `src/hooks/useDashboardHighlights.ts`), `ReboticaBanner` (pergamino, fecha de `REBOTICA_NEXT_OPENING`), `StatsGrid` claro con chips, `MiniLeaderboard`. Fuera: WelcomeCard, MotivationalBanner, RecentActivity, EngagementWidget, UpcomingChallenges, RecentBadges (siguen en el repo por si se recuperan).
6. **Sidebar** (`SidebarNavigation.tsx`): agrupado en Tu farmacia / Comunidad / Crecer, con **La Rebotica** en el menú. Sin side-stripe ni micro-animaciones decorativas.

## Reglas al tocar UI del portal

- Máximo un acento botica por componente; chips = fondo `-soft` + texto del acento; nunca blanco sobre `bg-brand`; botones sólidos = `bg-primary text-primary-foreground`.
- La cajonera de la Rebotica (`rebotica/Cajonera.tsx`, madera/pergamino con hex propios) es submarca con licencia temática: NO normalizarla al look del portal.
- `components/ui/**` (primitivas shadcn) no se tocan.
- Si Lovable genera UI que viola esto, corregirle citando el knowledge del proyecto.

## Fase 2 — restyle de TODAS las secciones de usuario (16-07-2026, Cowork/Fable + 6 agentes Sonnet; SIN COMMIT, push pendiente)

Detonante: Francesc — "solo el Dashboard sigue la estética; el resto solo cambió colores". Se aplicó el registro completo del Dashboard (cabecera con firma Fraunces, chips pill `-soft`, CTAs pill brand-dark, barras de progreso canon, filas divide-y, vacíos cálidos honestos, shadow-soft/lift, cero emojis en UI, cero grises/arcoíris crudos) a **78 ficheros** de: Formación (+CourseView/Quiz), Comunidad/foro, Recursos, Promociones, Retos, Eventos, Empleo, Farmacias, Perfil, auth (login/reset/invitación; **bloque RGPD del registro intacto, ni una palabra**), IAFarma/asistente creativo (+chatbot a ciruela), access/search/onboarding, NotFound, Header/Footer/Sidebar/DashboardLayout y Precios (solo marco visual: h1 con em, CTAs pill, barra fundador; **lógica de checkout intacta**).

Cabeceras de sección fijadas: Formación "Formación que *se nota en el mostrador*" · Comunidad "El foro donde *la farmacia habla*" · Recursos "Plantillas y guías *listas para usar*" · Promociones "La Rebotica regala; aquí *se ofrece*" · Retos "Retos que *suman*" · Eventos "La agenda *del sector*" · Empleo "Empleo *en farmacia*" · Farmacias "El mapa de *farmacias*" · IAFarma "Tu asistente *creativo*" · 404 "Esta página *se nos ha traspapelado*".

Verificado: `tsc --noEmit` limpio + `vite build` OK + grep: 0 clases de color crudas fuera de `ui/` y `admin/`. **admin/** queda a propósito solo con tokens (fase posterior si se quiere).

Flags anotados por los agentes (no bloqueantes): (1) `courseCover.ts` asigna blanco sobre `bg-brand` en la categoría "ventas" → guard local de tinta en CourseCard/CourseSection/CourseHeader; si se cambia el mapa, revisar los 3 guards. (2) Código huérfano detectado: `forum/ForumContainer|ForumFilters|ForumStats` y `pharmacy/PharmacyForm|SubscriptionPrompt|ContactForm` (este último = no hay forma de publicar farmacia desde la UI pública; ¿feature pendiente?). (3) `quiz/QuizProgress|QuizQuestion` posiblemente huérfanos. (4) Insignias del Perfil se quedan en miel (premios) a propósito.

## Fase 2.1 — remates + páginas legales (16-07 tarde, Cowork/Fable + 1 agente Sonnet; SIN COMMIT, push pendiente)

Feedback de Francesc tras ver fase 2 en vivo: faltaban Mi farmacia, Mi perfil y la caja del chatbot; y los enlaces legales del footer daban error.

- **Mi farmacia** (`MiFarmacia.tsx`): cabecera canon (h1 extrabold + sub), eyebrow-chips brand en las 3 cards (Plan Equipo / Formación / Suscripción), badges Titular/Activo/Pendiente en tipografía chip, barra de plazas con borde canon, cabecera de tabla uppercase chip, botones Retirar/Reenviar/Cancelar → pill.
- **Mi perfil** (`Perfil.tsx`): la TabsList shadcn por defecto (cajas grises) → chips pill sueltos (activo `bg-brand-soft text-brand-dark border-brand/30`); en móvil sigue el Select.
- **Chatbot** (`PortalChatbot.tsx`): fuera la cabecera sólida ciruela con texto blanco → cabecera `bg-card` con chip icono ciruela-soft + título/subtítulo; ventana `rounded-2xl` con tamaño fluido para móvil (`min(24rem, 100vw-3rem)` × `min(600px, 100dvh-6rem)`); botón enviar pill; aria-labels.
- **PÁGINAS LEGALES (bug real)**: `/politica-cookies`, `/politica-privacidad`, `/aviso-legal` y `/contacto-soporte` estaban enlazadas desde Footer + CookieBanner + registro pero LAS RUTAS NO EXISTÍAN → 404. Creado `src/pages/Legal.tsx` (AvisoLegal, PoliticaPrivacidad, PoliticaCookies, ContactoSoporte; chrome tipo ReboticaBasesLegales) adaptando los textos validados de farmapro-direct al portal (cuenta, consentimientos versionados, Stripe, Mailrelay, remisión a bases de la Rebotica; cookies según las categorías REALES del CookieManager: técnicas/analíticas GA4 pendiente de activar/marketing Meta pendiente/preferencias reservada) + 4 rutas públicas en AppRoutes. **PENDIENTE ASESOR** (flags del agente): (1) el registro exige AMBOS consentimientos (privacidad Y comercial) para crear cuenta — art. 7.4 RGPD, valorar hacer el comercial opcional; (2) faltan condiciones de contratación/suscripción como doc propio (desistimiento, renovación, cancelación); (3) confirmar razón social exacta de Mailrelay (se puso "CIPSA / iPZ Marketing").

Verificado: tsc limpio + vite build OK. Ficheros: PortalChatbot.tsx, AppRoutes.tsx, MiFarmacia.tsx, Perfil.tsx, Legal.tsx (nuevo).

## Pendiente

- [x] **Claude Code: commit+push de fase 2.1 (5 ficheros) + Publish** (tarea en Notion 16-07) — commit `b665eda4`, push a main + publish en Lovable OK (16-07). Verificado en vivo: las 4 páginas legales responden con contenido real (antes 404); /perfil y /mi-farmacia redirigen a login correctamente. Pendiente solo la vista logueada (Francesc: pestañas pill, chips, chatbot).
- [x] **Claude Code: commit+push del restyle fase 2 (79 ficheros, working tree de 16-07) + Publish** (tarea en Notion 16-07) — commit `7decd3c4`, push a main + publish en Lovable OK (16-07). Verificado en vivo: bundle con las 3 cabeceras nuevas (Formación/Comunidad/Recursos), Precios (h1 con em, toggle pill, barra fundador, CTAs), login/registro con bloque RGPD intacto. Pendiente solo la vista logueada (Francesc, siguiente punto).
- [ ] Francesc: revisar dashboard en preview (requiere login) + **Publish** (tarea en Notion).
- [ ] Decisión de Francesc: crear "píldora de la quincena" y "reto 21 días" como mecánicas reales (hoy no existen en BD; el dashboard muestra curso/reto activo equivalentes). Contenido: skill `rebotica-contenido`; BD: tablas nuevas o categoría de curso + challenge dedicado.
- [ ] OG image del portal con plantilla de marca + cross-navegación web↔portal (fase 4 del plan estético).
- [ ] (opcional, fase posterior) admin/**: sigue en tokens sin registro botica; y limpieza de componentes huérfanos detectados en fase 2.
