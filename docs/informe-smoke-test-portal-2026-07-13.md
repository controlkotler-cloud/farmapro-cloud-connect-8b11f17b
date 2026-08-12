# Smoke test completo del portal — 13-07-2026

Ejecutado por Claude (Cowork) con sesión real de Francesc (admin) en portal.farmapro.es, navegador + BD en producción. Continuación de los fixes del 10-13/07 (quiz, chatbot, sesgo de respuestas, Tests legacy — todos ya aplicados y verificados).

## Resultado por área

| Área | Resultado |
|---|---|
| Formación (catálogo) | ✓ Renderiza — pero **7 cursos invisibles por categorías** (bug nº1) |
| Curso legacy + quiz E2E (Gestión Financiera) | ✓ Evaluación aparece, opciones barajadas, respuesta correcta aceptada, avance de pregunta OK. Intento de prueba borrado |
| Quiz stats | ✗ Error de consola en cada quiz (bug nº2, GRANT) |
| Recursos | ✓ 53 recursos con botón de descarga, marcado premium presente |
| IAFarma (asistente creativo) | ✓ UI 7/7 tipos de contenido; API ya verificada el 10-07 (200 + stream) |
| Chatbot portal | ✓ Verificado 13-07 tras el fix (200 + stream) |
| Comunidad | ✓ Foros y contenido cargan (38 posts) |
| Retos | ✗ La página carga pero **completar retos está roto desde siempre** (bug nº3) |
| Eventos / Empleo / Farmacias / Promociones | ✓ Cargan con contenido, sin errores de consola |
| Perfil / Precios | ✓ Cargan (Precios pre-Stripe como corresponde) |
| Rebotica pública (/rebotica) | ✓ Carga: cajonera, premio, próximo cajón, bases legales |
| Puntos/ranking | ✓ Consistentes (524 pts; +20 del quiz del finde, legítimo). 0 datos huérfanos |
| Búsqueda global y campana de notificaciones | ? No concluyente por automatización (popovers en tab de fondo). **Revisar a mano: 1 minuto** |

## Bugs encontrados (3 backend + 1 frontend)

**1. [FRONTEND — crítico para el D-day] 7 cursos publicados invisibles en el catálogo.** `Formacion.tsx` y `CategoryTabs.tsx` usan una lista fija `CATEGORY_ORDER = ['ventas','marketing','gestion','liderazgo','atencion','otros']`. Los 4 cursos `atencion_cliente` (incluida la **píldora de onboarding que desbloquea el primer cajón de la Rebotica**) y los 3 `tecnologia` (VERI*FACTU, etc.) no aparecen en "Todos", no tienen tab y el buscador tampoco los muestra (la agrupación usa la misma lista). Verificado en vivo: "farmacia silenciosa" y "VERI*FACTU" ausentes de la página. Fix = prompt Lovable (abajo).

**2. [SQL] `calculate_quiz_stats` sin EXECUTE para authenticated** (REVOKE masivo del hardening) → "Error loading quiz stats" en consola en cada quiz.

**3. [SQL] Completar retos roto desde siempre**: `add_user_points` tiene el parámetro `user_id` que choca con la columna en `ON CONFLICT (user_id)` → 42702 "ambiguous" (reproducido en vivo con la sesión real). Solo se llama al completar un reto → "Retos Completados: 0" para todo el mundo, siempre. Además `log_security_event` también quedó revocado y el frontend lo llama (se pierde en silencio).

Los bugs 2 y 3: **SQL listo en** `farmapro-portal/supabase/migrations/20260713120000_smoke_fixes_grants_add_user_points.sql` (pegar en el editor de Lovable; lleva verificación al final).

## Prompt Lovable para el bug 1 (categorías)

```
En el catálogo de Formación hay 7 cursos publicados que no se muestran porque su categoría
no está en las listas fijas de categorías. Haz exactamente esto y nada más:

1. En src/pages/Formacion.tsx: en CATEGORY_ORDER añade 'atencion_cliente' y 'tecnologia'
   (déjalo así: ['ventas','marketing','gestion','liderazgo','atencion','atencion_cliente',
   'tecnologia','otros']).
2. En src/components/course/CategoryTabs.tsx: mismo cambio en su CATEGORY_ORDER, y añade
   las etiquetas visibles "Atención al cliente" para 'atencion_cliente' y "Tecnología" para
   'tecnologia' (con icono coherente con el resto si los tabs llevan icono).
3. Si hay algún otro mapeo de etiqueta/color por categoría (CourseSection, CourseCard),
   añade también esas dos claves para que no salgan sin estilo.

No toques consultas, RLS, ni ningún otro componente.
```

## No probado (fuera de alcance de la automatización)

- **Registro de cuenta nueva (flujo CIF)**: crear cuentas requiere contraseña — debe probarlo Francesc a mano (5 min, con un email de prueba).
- **Pago Stripe test del portal**: bloqueado a propósito hasta los prompts de Stripe + regla del webhook de direct (ya documentado).
- **Descarga real de fichero** (los 53 botones están; el flujo de descarga con las políticas nuevas de storage no se ha ejercitado — 1 clic manual).
- **Búsqueda global y campana**: revisar a mano (1 min).
- Publicar post en Comunidad (evité crear contenido).

## Rastro

Sin residuos: intento de quiz de prueba borrado, RPC de reto con rollback, 0 huérfanos, puntos consistentes. Tareas Notion creadas para los 2 arreglos. Ficha de memoria actualizada.
