#!/usr/bin/env python3
"""Estado de codificación de la librería (status 4 = listo, 5 = error)."""
import json, os, pathlib, urllib.request
env = dict(l.split("=", 1) for l in (pathlib.Path(__file__).parent / ".env").read_text().split("\n") if "=" in l)
req = urllib.request.Request(f"https://video.bunnycdn.com/library/{env['BUNNY_LIBRARY_ID']}/videos?page=1&itemsPerPage=50&orderBy=date", headers={"AccessKey": env["BUNNY_API_KEY"]})
S = {0:"created",1:"uploaded",2:"processing",3:"transcoding",4:"FINISHED",5:"ERROR",6:"upload-failed",7:"jit-segmenting",8:"jit-playlists"}
for v in json.load(urllib.request.urlopen(req))["items"]:
    print(f"{S.get(v['status'], v['status']):12} {v['encodeProgress']:3}%  {v['length']:5}s  {v.get('availableResolutions') or '-':18} {v['title']}")
