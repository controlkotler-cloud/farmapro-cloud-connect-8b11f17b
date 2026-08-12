# Prompt Lovable — arreglar landing Rebotica ↔ open-reward (mecánica A)

> Detectado en auditoría Cowork 16-07 tarde. La landing `/rebotica` en vivo llama a
> `open-reward` con body vacío, pero la edge desplegada exige `campaign_id` y `cajon`
> → el botón "Abrir mi cajón" SIEMPRE dará error en cuanto la campaña esté activa.
> Además el toast espera `reward_type` (lenguaje de la mecánica B/tanda5, no activa
> en T1) que la edge nunca devuelve → mostraría "participación" en vez del premio.
> Enviar este prompt al proyecto **farmapro-cloud-farm** (vía MCP de Lovable desde
> Cowork con OK de Francesc, o pegándolo en el editor).

---

Arregla la conexión entre la landing de la Rebotica y la edge function open-reward. Solo lógica; no toques estética ni copy del resto de la página.

1. **Edge `supabase/functions/open-reward/index.ts`**: si el body no trae `campaign_id`, resuelve automáticamente la campaña activa (`rebotica_campaigns` con `estado='activa'` y hoy dentro de `quincena_inicio`/`quincena_fin`; si hay varias, la de `quincena_inicio` más reciente). Mantén compatibilidad con `campaign_id` explícito. Añade `reward_type: 'premio'` a todas las respuestas que devuelven premio (también la rama `already`).

2. **`src/pages/Rebotica.tsx`, `handleOpen`**: envía `body: { cajon: selected, source: 'welcome', ...(ctx.campaign ? { campaign_id: ctx.campaign } : {}) }`. En el toast, trata como premio cualquier respuesta con `data.prize` (aunque falte `reward_type`). Elimina la rama de "participación para tu farmacia" (mecánica de equipos no activa en T1): si no hay `data.prize` ni `data.already`, muestra el error genérico.

3. No cambies la Cajonera, los textos de PRIZES/FAQ ni las bases legales.

— CIERRE (obligatorio antes de terminar): (1) actualiza en Notion ("Tareas · farmapro") las tareas afectadas por lo hecho: Estado, y Detalle con evidencia + fecha; busca por palabra clave otras tareas Pendiente que hablen de lo que has cambiado y corrígelas también; (2) si tocaste piezas editoriales, actualiza `impulso/00-estrategia/ESTADO-PRODUCCION.md`; (3) si hay decisión, aprendizaje o cambio de estado de proyecto, actualiza la ficha de memoria correspondiente (y su línea en `MEMORY.md`); (4) resume en el chat qué has actualizado y qué queda. RECUERDA (regla 16-07): no escribas estado del código en Notion — solo acciones humanas; el estado se consulta en vivo.
