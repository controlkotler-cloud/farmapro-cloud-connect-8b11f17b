# Consulta: modelos de imagen del AI gateway (solo lectura, sin cambios)

Fuente: `GET /v1/models` autenticado del workspace (`workspace_models: included`), 23-10-2026, y documentación interna del gateway. No se ha modificado nada.

## 1-3. Modelos de imagen

Precios en créditos Lovable **por token** (no por imagen), tal como los devuelve el catálogo.

| Modelo (nombre) | ID exacto `model` | Salida imagen (créd./token) | Entrada imagen | Formato / endpoint | Máx. referencias |
|---|---|---|---|---|---|
| GPT Image 2.5 Sunburst (default del workspace) | `openai/gpt-image-2.5-sunburst` | 0.00012 | 0.000032/token; texto 0.00002 | `openai`: `/v1/images/generations` (prompt); edición multipart `/v1/images/edits` con `image[]` | No documentado |
| GPT Image 2 (actual en ai-generate-image) | `openai/gpt-image-2` | 0.00012 | 0.000032; texto 0.00002 | Igual que arriba | No documentado |
| GPT Image 2.5 Flare | `openai/gpt-image-2.5-flare` | 0.00012 | 0.000032; texto 0.00002 | Igual que arriba | No documentado |
| GPT Image 1 Mini | `openai/gpt-image-1-mini` | 0.000032 | 0.00001; texto 0.000008 | Igual que arriba | No documentado |
| Gemini 3 Pro Image (Nano Banana Pro) | `google/gemini-3-pro-image` | 0.00048 | facturada como texto (0.000008) | `gemini-chat`: `/v1/images/generations` con `messages` y partes `image_url` (data URL) | No documentado |
| Gemini 3.1 Flash Image | `google/gemini-3.1-flash-image` | 0.00024 | como texto (0.000002) | `gemini-chat` (igual) | No documentado |
| Gemini 3.1 Flash Lite Image | `google/gemini-3.1-flash-lite-image` | 0.00012 | como texto (0.000001) | `generate-content`: `contents` con `inlineData` (base64 sin prefijo) en `/v1/images/generations` | No documentado |
| Gemini 2.5 Flash Image | `google/gemini-2.5-flash-image` | 0.00012 | como texto (0.0000012) | (no tengo contrato documentado confirmado) | No documentado |
| Seedream 5 Pro | `bytedance/seedream-5-pro` | **No aparece en el catálogo** | — | `cloudflare-input`: `input.prompt`, `input.image`, `stream: true` obligatorio | 1 a 10 (documentado) |

Alias adicionales (no son modelos propios): `lovable/image-fast`, `lovable/image-standard`, `lovable/image-premium` (solo generaciones; calidad por defecto low/low/medium) y `lovable/image-edit`.

Coste por imagen: el catálogo cobra por token, así que el coste real depende de cuántos tokens produzca cada imagen, y eso varía con la calidad y la resolución (en OpenAI con `quality` y `size`; en Gemini, con la resolución). El catálogo no da un número fijo de tokens por imagen, así que no doy una cifra exacta por imagen. La forma fiable de saberlo es una generación de prueba por modelo y mirar el coste en los logs del gateway. Solo en Seedream la documentación habla de precio por imagen sin recargo por tamaño, pero hoy no está disponible.

Máximo de referencias: la documentación del gateway solo da un límite para Seedream (10). Para OpenAI dice que se mandan varias como `image[]` y, para Gemini, varias partes `image_url`, pero no da un máximo. No lo invento.

## 4. Seedream / ByteDance

ByteDance **no está activado** en este workspace: `bytedance/seedream-5-pro` no aparece en el catálogo y cualquier llamada devolvería `403 model_vendor_not_enabled`. Para usarlo, un administrador del workspace tiene que activarlo en Connectors → AI. Es un ajuste del workspace, no de este proyecto concreto.

## 5. Modelos de texto disponibles (además de `google/gemini-3.6-flash`)

Google: `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`, `google/gemini-2.5-pro`, `google/gemini-3-flash-preview`, `google/gemini-3.1-flash-lite`, `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`, `google/gemini-3.7-flash`, `google/gemini-3.8-flash`, `google/gemini-4-argon`.
Para comparar: `google/gemini-3.6-flash` y `google/gemini-3.7-flash` cuestan lo mismo (entrada 0.000003 y salida 0.000015 por token).

OpenAI: `openai/chat-latest`, `openai/gpt-5`, `openai/gpt-5-mini`, `openai/gpt-5-nano`, `openai/gpt-5.2`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`, `openai/gpt-5.4-nano`, `openai/gpt-5.4-pro`, `openai/gpt-5.5`, `openai/gpt-5.5-pro`, `openai/gpt-5.6-luna`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-sol`, `openai/gpt-6-luna`, `openai/gpt-6-sol`, `openai/gpt-6.1-sol`, `openai/gpt-6-astra`.

Anthropic (aparecen en el catálogo; según la política del workspace, con el endpoint `messages`): `anthropic/claude-haiku-4-5`, `anthropic/claude-sonnet-5`, `anthropic/claude-opus-5`, `anthropic/claude-opus-5-5`, `anthropic/claude-fable-5-1`.
