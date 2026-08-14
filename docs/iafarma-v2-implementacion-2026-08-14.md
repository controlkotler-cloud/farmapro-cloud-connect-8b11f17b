# IAFarma v2 — implementación · 14-08-2026

Aplicación de la auditoría `informe-iafarma-2026-08-14.md` (decisión de Francesc: I2 sin caducidad,
I1 arreglado, y todo el bloque de confirmados). Estado al escribir esto:

- **BD de producción: YA MIGRADA** (14-08, vía `query_database` del MCP Lovable, sin créditos).
  El SQL está registrado en `supabase/migrations/20260814120000_iafarma_v2_creditos.sql`.
  Verificado en vivo: funciones con grants correctos, `iafarma_tone` en profiles, sin saldos
  negativos pendientes de rescate (la tabla estaba limpia).
- **Código: en el árbol de trabajo, pendiente de `git push`.** El push sincroniza con Lovable y
  despliega frontend y edge functions (mecanismo verificado el 13-08 con portalEmailTemplates).

## Qué cambia, por capa

### Base de datos (ya en producción)
- `ai_image_credits`: saldo persistente de packs. **Los créditos comprados NO caducan.**
  `add_image_credits` (misma firma: el webhook de Stripe no se toca) acredita aquí.
- `consume_image_credit_v2(p_limit)` → jsonb `{remaining, source}`: gasta primero la imagen
  mensual del plan y después el pack. La firma antigua queda como wrapper de compatibilidad.
- `refund_image_credit(p_user, p_source)` y `refund_text_credit(p_user)`: devoluciones atómicas
  a la fuente correcta. **Arregla I1**: antes un fallo de la IA quemaba el crédito de pack.
- `ai_creative_usage`: métrica del asistente de texto (solo user_id + tipo + fecha; sin contenido).
- `profiles.iafarma_tone` (+ grants SELECT/UPDATE columna): el tono sincroniza entre dispositivos.

### Edge functions (deploy con el push)
- **ai-creative-assistant** (reescrita):
  - Prompt v2: usa TODOS los campos del formulario (tono, objetivo, slides, estilo, quién,
    keywords, longitud, tipo GB, descuento, fecha límite, canal, tipo WhatsApp, estrellas y tono
    de reseña) — la v1 recogía 14 y usaba 5 (T1).
  - Contratos de formato que ResultsArea parsea: `SLIDE n:` en carrusel, `GANCHO/DESARROLLO/
    CIERRE` + `TEXTO EN PANTALLA` en reels (T2). Blog con estructura, longitud elegida, keywords
    y `META DESCRIPCIÓN:` (T3). Sugerencia de imagen solo en tipos visuales; WhatsApp y reseñas
    limpias (T4). Reseñas: estrategia por estrellas/tono, sin emojis en negativas, firma de la
    farmacia. Castellano de España explícito (T6).
  - Modelo `google/gemini-3.6-flash` (T5). Blindaje B6 (roles filtrados, máx. 50 mensajes/8k
    chars) (S1). Techo diario invisible de 150 para planes de pago (S2). Registro en
    `ai_creative_usage` (M1). Cabecera `x-iafarma-texts-remaining` para el contador del trial (U3).
- **ai-generate-image**: consume v2 + refund a la fuente correcta (I1); `COPY_MODEL` a 3.6-flash
  (T5); instrucción de "zona segura" cuando el formato pedido (4:5, 9:16, 16:9) difiere del
  generado (2:3, 3:2) para que el recorte del cliente no corte texto (I3); mensajes de cuota sin
  "este mes".
- **create-checkout**: los packs exigen plan de pago también en servidor (D2).
- **ai-portal-chat**: el bot de soporte sabe que los packs no caducan.

### Frontend (deploy con el push)
- `useCreativeChat`: el mensaje del servidor manda sobre el mapa de errores (los textos "Premium,
  Profesional" muertos eran el fallback que lo machacaba) (U1); `regenerate` pasa el historial
  recortado explícito (U2); expone `textsRemaining` (U3).
- `ResultsArea`: la "SUGERENCIA DE IMAGEN" se separa en su propio bloque, "Copiar contenido"
  copia solo la pieza (T4), botón "Crear esta imagen" que salta al workspace de imagen con el
  brief precargado (U8), contador de textos del trial con CTA a Plus (U3).
- `ImageWorkspace`: recorte cliente al formato EXACTO al previsualizar y descargar — Feed 4:5
  baja como 1080x1350 de verdad (I3); botón desactivado sin brief (adiós al clic en vacío que
  gastaba el crédito del mes, I5); pasos de progreso durante la generación (D5); packs solo para
  planes de pago, al trial se le ofrece Plus (D2); textos "no caducan".
- `pieceTypes` + `seasonal.ts` (nuevo) + `QuickTemplates`: calendario farmacéutico de 12 meses
  (vuelta al cole, gripe, piel seca, cofres de Navidad...) — se acabó el verano perpetuo (I4).
- `PharmacyDefaults`: "Guardar en mi perfil" guarda de verdad (pharmacy_name, pharmacy_city,
  iafarma_tone) y sincroniza entre dispositivos (U4/U5). `CreativeWorkspace` pre-rellena el tono
  desde el perfil.
- `ContentForm`: las instrucciones extra ya no van duplicadas (U6). `CreativeHeader`: badge
  "Cumple el código deontológico" en lugar de "Adaptado al algoritmo actual" (P1).
- `plans.ts` y `Precios`: los packs se anuncian "no caducan".

## Pasos para desplegar (Francesc)
1. `cd ~/farmapro/farmapro-portal && git add -A && git commit -m "IAFarma v2: créditos sin caducidad, refunds correctos, prompt completo, estacionalidad" && git push`
2. Esperar la sincronización de Lovable (el push despliega frontend y edges).
3. Prueba de humo (5 min):
   - Generar un post de Instagram eligiendo tono "Divertido" y un objetivo → el resultado debe
     respetar ambos y la sugerencia de imagen salir en bloque aparte.
   - Un carrusel de 5 slides → deben salir las tarjetas SLIDE 1..5.
   - Generar una imagen Feed 4:5 con brief → descarga = PNG 1080x1350.
   - Con un usuario de pago: comprar pack de 20 → `ai_image_credits.balance = 20`; generar hasta
     agotar la mensual → sigue generando del pack; forzar un fallo no aplica, pero el refund está
     cubierto por RPC.
   - Preguntar al bot: "¿caducan los créditos de imagen?" → debe decir que no.

## Dudosos que quedan SIN tocar (decisión pendiente)
- **D1** — Modelo de imagen (gpt-image-2 medium vs Gemini imagen / quality high): pide un A/B con
  5 piezas reales antes de cambiar. El interruptor sigue siendo `IMAGE_MODEL` en la edge.
- **D3/D4** — Emojis en reseñas ya resuelto de forma conservadora (sin emojis en negativas);
  "sin hashtags" se mantiene como política.
- **U7 (biblioteca "Mis piezas") y el plan quincenal propuesto** del blueprint: siguiente tanda.
