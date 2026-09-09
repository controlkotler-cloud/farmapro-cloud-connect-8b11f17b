#!/usr/bin/env python3
"""Lee out/mapa.tsv (drive_id, slot, guid, destino) y escribe:
  out/update-video-urls.sql  → UPDATE del JSONB courses.course_modules (8 píldoras), idempotente
  out/constantes.txt         → las 4 constantes de código a sustituir (fichero + URL nueva)
Uso: BUNNY_LIBRARY_ID=123456 python3 generar-cambios.py
"""
import os, sys, pathlib
lib = os.environ.get("BUNNY_LIBRARY_ID") or sys.exit("falta BUNNY_LIBRARY_ID")
here = pathlib.Path(__file__).parent
rows = [l.rstrip("\n").split("\t") for l in (here/"out/mapa.tsv").read_text().splitlines() if l.strip()]
sql, consts = [], []
for drive_id, slot, guid, dest in rows:
    url = f"https://iframe.mediadelivery.net/embed/{lib}/{guid}"
    kind, target = dest.split(":", 1)
    if kind == "jsonb":
        sql.append(f"""-- {slot}: {target}
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = '{target}' THEN jsonb_set(m, '{{video_url}}', to_jsonb('{url}'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{{"id":"{target}"}}]'::jsonb;""")
    else:
        consts.append(f"{slot}\t{target}\t{url}")
(here/"out/update-video-urls.sql").write_text(
    "-- Generado por generar-cambios.py. Comprobar antes con:\n"
    "-- SELECT m->>'id', m->>'video_url' FROM courses c, jsonb_array_elements(c.course_modules) m WHERE m ? 'video_url';\nBEGIN;\n"
    + "\n".join(sql) + "\nCOMMIT;\n")
(here/"out/constantes.txt").write_text("\n".join(consts) + "\n")
print(f"{len(sql)} UPDATE en out/update-video-urls.sql, {len(consts)} constantes en out/constantes.txt")
