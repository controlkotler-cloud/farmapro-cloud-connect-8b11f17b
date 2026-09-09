#!/usr/bin/env bash
# Migración de los vídeos del portal de Google Drive a Bunny Stream.
#
# Uso:  BUNNY_LIBRARY_ID=123456 BUNNY_API_KEY=xxxx ./subir-videos.sh [descargar|subir|todo]
#   descargar → baja los 12 mp4 de Drive a $DIR y comprueba el tamaño byte a byte
#   subir     → crea cada vídeo en la librería de Bunny y sube el fichero (PUT)
#   todo      → ambas cosas (por defecto)
# Es idempotente: no vuelve a bajar ni a subir lo que ya está (mapa en $MAP).
# Salida: $MAP (drive_id → guid de Bunny) y $OUT/urls.txt con la URL de embed de cada uno.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TSV="$HERE/videos.tsv"
DIR="${VIDEOS_DIR:-$HOME/Downloads/bunny-portal}"
OUT="$HERE/out"; MAP="$OUT/mapa.tsv"
mkdir -p "$DIR" "$OUT"; touch "$MAP"
ACTION="${1:-todo}"
UA="Mozilla/5.0 audit"

descargar() {
  while IFS=$'\t' read -r id slot title bytes dest; do
    [[ "$id" == \#* || -z "$id" ]] && continue
    f="$DIR/$slot.mp4"
    if [[ -f "$f" && "$(stat -f%z "$f")" == "$bytes" ]]; then echo "[ok] $slot ya descargado"; continue; fi
    echo "[dl] $slot ($bytes B)…"
    curl -sSL -A "$UA" -o "$f" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"
    got="$(stat -f%z "$f")"
    if [[ "$got" != "$bytes" ]]; then echo "ERROR: $slot bajó $got B, esperados $bytes" >&2; file "$f" >&2; exit 1; fi
    echo "[ok] $slot"
  done < "$TSV"
}

subir() {
  : "${BUNNY_LIBRARY_ID:?falta BUNNY_LIBRARY_ID}" "${BUNNY_API_KEY:?falta BUNNY_API_KEY}"
  API="https://video.bunnycdn.com/library/$BUNNY_LIBRARY_ID/videos"
  while IFS=$'\t' read -r id slot title bytes dest; do
    [[ "$id" == \#* || -z "$id" ]] && continue
    f="$DIR/$slot.mp4"
    [[ -f "$f" && "$(stat -f%z "$f")" == "$bytes" ]] || { echo "ERROR: falta $f íntegro (ejecuta 'descargar')" >&2; exit 1; }
    if grep -q "^$id	" "$MAP"; then echo "[ok] $slot ya subido: $(grep "^$id	" "$MAP" | cut -f3)"; continue; fi
    guid="$(curl -sS -X POST "$API" -H "AccessKey: $BUNNY_API_KEY" -H "Content-Type: application/json" \
      --data "$(python3 -c 'import json,sys;print(json.dumps({"title":sys.argv[1]}))' "$title")" | python3 -c 'import json,sys;print(json.load(sys.stdin)["guid"])')"
    echo "[up] $slot → $guid ($bytes B)…"
    code="$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$API/$guid" -H "AccessKey: $BUNNY_API_KEY" -T "$f")"
    [[ "$code" == "200" ]] || { echo "ERROR: PUT $slot devolvió $code" >&2; exit 1; }
    printf '%s\t%s\t%s\t%s\n' "$id" "$slot" "$guid" "$dest" >> "$MAP"
    echo "[ok] $slot subido"
  done < "$TSV"
  : > "$OUT/urls.txt"
  while IFS=$'\t' read -r id slot guid dest; do
    printf '%s\t%s\thttps://iframe.mediadelivery.net/embed/%s/%s\n' "$slot" "$dest" "$BUNNY_LIBRARY_ID" "$guid" >> "$OUT/urls.txt"
  done < "$MAP"
  echo; echo "URLs de embed en $OUT/urls.txt:"; cat "$OUT/urls.txt"
}

case "$ACTION" in
  descargar) descargar ;;
  subir) subir ;;
  todo) descargar; subir ;;
  *) echo "acción desconocida: $ACTION" >&2; exit 2 ;;
esac
