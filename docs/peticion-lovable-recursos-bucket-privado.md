# Petición a Lovable — bucket privado de recursos (15-09-2026)

Copiar y pegar TAL CUAL en el chat de Lovable del proyecto **farmapro-portal**
(Farmapro Cloud Connect). Es **un solo mensaje**: está cerrado a propósito para
que no haga falta corregirlo después.

**Antes de pegarlo:** el commit `e691960` tiene que estar pusheado y
sincronizado. Si no, el agente no verá el fichero de la edge function.

---

Necesito dos cosas, y NO quiero que toques nada más del código ni de la base de datos.

**1) Bucket privado con los ficheros de los recursos**

Crea un bucket de Storage llamado exactamente `recursos-portal`, **privado** (no público).

Copia dentro **todos** los ficheros que hay en el repo en `public/recursos/` (son 69 ficheros, unos 59 MB en total: pdf, xlsx y docx). Cada fichero debe quedar en la raíz del bucket **con exactamente el mismo nombre que tiene ahora**, sin carpetas y sin renombrar nada. Por ejemplo `public/recursos/impulso-n28-cuenta-resultados-bolsillo.xlsx` tiene que quedar como `impulso-n28-cuenta-resultados-bolsillo.xlsx` dentro de `recursos-portal`.

**No borres** los ficheros de `public/recursos/` del repo. Se borran después, en otro paso, cuando haya verificado que todo funciona.

Cuando termines, dime **cuántos ficheros has subido y el tamaño total**, y confirma que el bucket es privado. Si algún fichero falla, dime cuál: prefiero saberlo a que quede a medias.

**2) Desplegar la edge function nueva**

En el repo está `supabase/functions/descarga-abierta/index.ts`, ya escrita. Despliégala **sin cambiar el código**. En `supabase/config.toml` ya está declarada con `verify_jwt = false`, que es correcto y es a propósito: esta función sirve la descarga gratuita de la quincena a gente sin cuenta, y ella misma valida en servidor que la ventana siga abierta.

Necesita `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, que ya existen en el proyecto.

No hace falta que toques ninguna otra función.

**Lo que NO tienes que hacer:** no crees políticas de Storage (las pongo yo por SQL), no modifiques `resources`, no cambies `src/`, y no ejecutes "Try to fix all" si algo te parece raro: dímelo y ya está.

---

## Verificación al volver (la hago yo, queda anotada para no fiarme de un "listo")

Un HTTP 200 no prueba que el fichero esté bien: el 07-09-2026 el agente subió la
CADENA del path en vez del fichero y los objetos devolvían 200 con 52 bytes. Así
que se compara tamaño real contra el local, fichero a fichero:

```bash
cd /Users/francescfernandez/farmapro/farmapro-portal && ls -l public/recursos | awk '{print $5, $9}' | sort -k2
```

Y en SQL, que el bucket existe y está privado:

```sql
SELECT id, public FROM storage.buckets WHERE id = 'recursos-portal';
SELECT count(*) AS objetos, pg_size_pretty(sum((metadata->>'size')::bigint)) AS peso
FROM storage.objects WHERE bucket_id = 'recursos-portal';
```

Debe dar **69 objetos** y un peso cercano a **59 MB**. Si sale mucho menos, la
subida es falsa aunque el agente diga que fue bien.
