# Esto NO son descargables: son lápidas

Los 69 ficheros de esta carpeta son avisos de una página que dicen "este archivo ya no está
aquí, entra en el portal". No contienen material de farmapro y no deben sustituirse por el
material real nunca más.

## Por qué existen (16-09-2026)

Los descargables del portal vivían aquí y se servían como estáticos: el CDN los entregaba
antes de que existieran React, la sesión y RLS, así que cualquiera con la URL exacta se los
bajaba sin cuenta. Se movieron al bucket privado `recursos-portal` y se borró esta carpeta
del repo (commit `4076adb`).

**No bastó.** El hosting de Lovable no borra ficheros al desplegar: solo añade y sobrescribe.
Tras el deploy, 66 de los 69 seguían bajándose enteros de `portal.farmapro.es/recursos/`, con
el md5 idéntico al del git. Los únicos 3 que daban 404 eran los que entraron al repo después
del último deploy y por tanto nunca llegaron a subirse. Comprobado con cache-buster (una URL
que nadie ha pedido jamás también devolvía 200) y con control negativo (un nombre inventado
devuelve 404, así que no hay ningún fallback que dé 200 a todo).

La única vía que controlamos nosotros es **sobrescribir cada nombre**. Eso es esta carpeta.

## Reglas

- Si se retira un descargable en el futuro, no se borra: **se sustituye por su lápida**.
  Generador: `scripts/lapidas-recursos.py`.
- Un descargable nuevo NUNCA va aquí. Va al bucket `recursos-portal` y se entrega firmado
  desde `src/lib/descargas.ts`.
