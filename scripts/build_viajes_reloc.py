#!/usr/bin/env python3
"""Genera public/data/viajes_reloc.json: viajes de relocalizacion origen -> destino.

Fuente: "MAPA - RELOCALIZACIONES.xlsx" hoja "ok - Reloc" (equipo UDP; misma base
que relocalizaciones.json, pero conserva la columna "Coordenadas Geograficas" =
vertices del SECTOR DE DESTINO solicitado, que el JSON no trae).
Origen: coordenada oficial SERNAPESCA de cada centro (centros_salmoneros.geojson).
Destino: centroide de los vertices DMS de la solicitud.

Uso: python3 scripts/build_viajes_reloc.py  (desde la raiz del repo; el xlsx debe
estar en public/data/ o material/)
"""
import zipfile, re, json, os
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET

XLSX_CANDIDATES = ['public/data/MAPA - RELOCALIZACIONES.xlsx', 'material/MAPA - RELOCALIZACIONES.xlsx']
XLSX = next(p for p in XLSX_CANDIDATES if os.path.exists(p))
M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

z = zipfile.ZipFile(XLSX)
ss = []
root = ET.fromstring(z.read('xl/sharedStrings.xml'))
for si in root.findall(M + 'si'):
    ss.append(''.join(t.text or '' for t in si.iter(M + 't')))

root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
rows = []
for row in root.iter(M + 'row'):
    vals = {}
    for c in row.iter(M + 'c'):
        col = ''.join(ch for ch in c.get('r') if ch.isalpha())
        v = c.find(M + 'v')
        if v is None:
            continue
        val = v.text
        if c.get('t') == 's':
            val = ss[int(val)]
        vals[col] = val
    rows.append(vals)
data = rows[1:]  # fila 0 = encabezados


def parse_dms(s):
    lat = re.findall(r"S\s*(\d+)\s*[°º]\s*(\d+)\s*['´’]?\s*([\d.]+)", s)
    lon = re.findall(r"W\s*(\d+)\s*[°º]\s*(\d+)\s*['´’]?\s*([\d.]+)", s)
    pts = []
    for (a, b, c), (d, e, f) in zip(lat, lon):
        pts.append([-(float(d) + float(e) / 60 + float(f) / 3600),
                    -(float(a) + float(b) / 60 + float(c) / 3600)])
    return pts


def parse_fecha(v):
    if not v:
        return None
    v = str(v).strip()
    try:  # serial excel
        return (datetime(1899, 12, 30) + timedelta(days=float(v))).strftime('%Y-%m-%d')
    except ValueError:
        pass
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{2,4})', v)  # M/D/YY
    if m:
        mo, d, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        return f'{y:04d}-{mo:02d}-{d:02d}'
    return v


centros_geo = json.load(open('public/data/centros_salmoneros.geojson'))
coord = {}
for f in centros_geo['features']:
    c = str(f['properties'].get('N_CODIGOCE', '')).replace('.0', '')
    if c:
        coord[c] = [round(f['geometry']['coordinates'][0], 6), round(f['geometry']['coordinates'][1], 6)]

viajes = []
sin_destino = 0
origenes_sin_coord = 0
for i, r in enumerate(data):
    if not r.get('C'):
        continue
    pts = parse_dms(r.get('R', ''))
    if not pts:
        sin_destino += 1
        continue
    destino = [round(sum(p[0] for p in pts) / len(pts), 6), round(sum(p[1] for p in pts) / len(pts), 6)]
    centros = [str(r.get(k)) for k in 'HIJKL' if r.get(k)]
    origenes = [{'codigo': c, 'coord': coord[c]} for c in centros if c in coord]
    origenes_sin_coord += len(centros) - len(origenes)
    tipo = (r.get('T') or '').strip()
    viajes.append({
        'id': i,
        'titular': (r.get('A') or '').strip(),
        'holding': (r.get('B') or '').strip(),
        'n_pert': r.get('C'),
        'fecha': parse_fecha(r.get('E')),
        'superficie_ha': r.get('F'),
        'comuna': (r.get('M') or '').strip(),
        'region': (r.get('N') or '').strip(),
        'tipo': tipo,
        'estado': (r.get('V') or '').strip(),
        'fusion': bool(re.search(r'FUSI', tipo, re.I)) or len(centros) > 1,
        'centros': centros,
        'origenes': origenes,
        'destino': destino,
    })

con_arco = [v for v in viajes if v['origenes']]
meta = {
    'solicitudes_xlsx': len(data),
    'con_destino': len(viajes),
    'sin_destino': sin_destino,
    'con_arco': len(con_arco),
    'arcos': sum(len(v['origenes']) for v in con_arco),
    'origenes_sin_coord': origenes_sin_coord,
    'generado': 'scripts/build_viajes_reloc.py',
    'fuente': 'MAPA - RELOCALIZACIONES.xlsx (hoja ok - Reloc) + centros_salmoneros.geojson',
}
json.dump({'meta': meta, 'viajes': viajes}, open('public/data/viajes_reloc.json', 'w'), ensure_ascii=False)
print(meta)
