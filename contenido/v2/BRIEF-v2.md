# Brief: versión 2 (ampliada) de las 8 píldoras del portal farmapro

Fecha: 09-09-2026. Motivo: Francesc ha probado las píldoras y el vídeo de Laura promete
"diez minutos" y "montar el sistema", el portal marca 8 minutos, y el contenido actual se
lee en 2 minutos (1.600 a 2.500 caracteres). Hay que ampliar cada píldora hasta que sea de
verdad una lección de 8 minutos de lectura, sin cambiar lo que ya está bien.

## Objetivo de longitud

Cuerpo de la píldora (sin contar el bloque `## Quiz`): entre **1.400 y 1.700 palabras**.
Ni menos (no cumple la promesa) ni más (deja de ser una píldora).

## Fuentes (léelas enteras antes de escribir)

1. La píldora actual (`contenido/pildora-0N-*.md`): TODO lo que dice se conserva. Los 5
   pasos del método siguen siendo los mismos 5 pasos, con los mismos nombres y en el mismo
   orden. El bloque "Hazlo hoy (10 minutos)" se conserva (puede pulirse, no cambiarse de
   idea). Las preguntas del `## Quiz` se copian VERBATIM al final del nuevo fichero, y el
   texto nuevo tiene que seguir respondiendo a todas ellas de forma inequívoca.
2. La newsletter de origen íntegra (`impulso/01-newsletters/textos-completos/N..md`): de
   ahí sale la ampliación: ejemplos, matices, errores típicos, cifras con su fuente. No
   inventes cifras: si una cifra no está en la newsletter ni tiene fuente, o la etiquetas
   "estimación sectorial" o no la usas.
3. La frase de la intro en vídeo (te la doy en el encargo): el contenido debe cumplir
   exactamente lo que Laura promete ahí.

## Estructura obligatoria del fichero de salida

Mismo frontmatter que la píldora actual (cambia `estado: v2_ampliada` y añade
`version: 2`). Después, en este orden y con estos títulos exactos (nivel `##`):

1. `# Título` (el mismo título)
2. `## El problema`  — ampliado: qué pasa, cómo se nota en el día a día, qué cuesta (2-3 párrafos)
3. `## Por qué pasa` — nuevo: la causa de fondo, sin culpar al titular (1-2 párrafos)
4. `## El método en 5 pasos` — los mismos 5 pasos. Cada paso empieza con su nombre en
   negrita en una línea (`**Paso 1. Nombre**`) y lleva 2-3 párrafos: qué hacer, cómo
   hacerlo en una farmacia real, un ejemplo concreto y el error que más se repite.
   Nada de listas numeradas de una línea: eso es lo que ya había.
5. `## Errores frecuentes` — nuevo: 3-4 errores, cada uno con su corrección (lista con guiones)
6. `## Hazlo hoy (10 minutos)` — el mismo ejercicio, pulido
7. `## Cómo saber que funciona` — nuevo: 3 señales o indicadores a 30 días, medibles
8. `## Para seguir` — UN párrafo: nombra el descargable por su título y dice que está
   **justo debajo, en "Recursos descargables"** (ya no "en Recursos": ahora va enlazado
   dentro de la propia píldora). Si la píldora tiene varios descargables, nómbralos todos.
9. `## Quiz` — copiado verbatim de la píldora actual.

## Voz y estilo (no negociable)

- Firma editorial Laura Domínguez, especialista en farmacias. Tutea al titular ("tú",
  "tu farmacia", "tu equipo"). Castellano de España, nunca neutro.
- **Prohibida la raya larga (—)**: usa coma, dos puntos, punto o paréntesis.
- farmapro siempre en minúsculas. Sin emojis. Sin tono corporativo ni vocabulario de IA
  ("es imperativo", "holístico", "pilar fundamental", "ecosistema", "desbloquea",
  "potencia", "clave para el éxito"). Frases cortas. Ejemplos de mostrador, no teoría.
- Audiencia profesional (titular de farmacia). Nunca prometer resultados sanitarios ni
  aconsejar sobre medicamentos concretos; en dermocosmética, la recomendación se basa en la
  necesidad real del paciente y se deriva al dermatólogo cuando toca.
- Sin enlaces externos, sin HTML. Solo markdown: `##`, párrafos, `**negrita**`, listas con `-`.

## Entrega

Escribe el fichero en `contenido/v2/pildora-0N-<mismo-nombre>.md` y termina con un informe
de menos de 120 palabras: palabras del cuerpo (sin quiz), qué añadiste, y confirmación de
que las respuestas del quiz siguen en el texto.
