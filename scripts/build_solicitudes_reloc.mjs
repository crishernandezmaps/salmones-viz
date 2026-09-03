// Genera public/data/solicitudes_reloc.geojson:
// un punto por CENTRO DE ORIGEN involucrado en solicitudes de relocalizacion
// (relocalizaciones.json, Subpesca), con coordenada oficial de SERNAPESCA
// (centros_salmoneros.geojson). Las solicitudes en tramite no traen coordenada
// de destino, por eso se mapea el origen.
//
// Uso: node scripts/build_solicitudes_reloc.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const reloc = JSON.parse(readFileSync('public/data/relocalizaciones.json'))
const centros = JSON.parse(readFileSync('public/data/centros_salmoneros.geojson'))

// indice codigo -> coordenada (N_CODIGOCE viene como "110955.0")
const coord = {}
for (const f of centros.features) {
  const c = String(f.properties.N_CODIGOCE || '').replace(/\.0$/, '')
  if (c) coord[c] = f.geometry.coordinates
}

// una solicitud "incluye fusion" si el tipo lo declara o si involucra mas de un centro
const esFusion = (r) =>
  /FUSI/i.test(r.tipo_relocalizacion || '') || (Array.isArray(r.centros) && r.centros.length > 1)

// agrupar solicitudes por centro
const porCentro = new Map()
let mencionesSinCoord = 0
for (const r of reloc) {
  for (const c of (r.centros || []).map(String)) {
    if (!coord[c]) { mencionesSinCoord++; continue }
    if (!porCentro.has(c)) porCentro.set(c, [])
    porCentro.get(c).push({
      titular: r.titular,
      holding: r.holding,
      fecha: r.fecha_ingreso,
      tipo: r.tipo_relocalizacion,
      estado: r.estado_tramite,
      fusion: esFusion(r),
      co_centros: (r.centros || []).map(String).filter(x => x !== c),
    })
  }
}

const features = [...porCentro.entries()].map(([codigo, solicitudes]) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: coord[codigo] },
  properties: {
    codigo,
    n_solicitudes: solicitudes.length,
    any_fusion: solicitudes.some(s => s.fusion),
    holding: [...new Set(solicitudes.map(s => s.holding || s.titular))].join(' / '),
    solicitudes: JSON.stringify(solicitudes),
  },
}))

const meta = {
  solicitudes_total: reloc.length,
  centros_mapeados: features.length,
  menciones_sin_coordenada: mencionesSinCoord,
  generado: 'scripts/build_solicitudes_reloc.mjs',
}

writeFileSync(
  'public/data/solicitudes_reloc.geojson',
  JSON.stringify({ type: 'FeatureCollection', meta, features })
)
console.log(meta)
console.log('centros con fusion:', features.filter(f => f.properties.any_fusion).length,
  '| sin fusion:', features.filter(f => !f.properties.any_fusion).length)
