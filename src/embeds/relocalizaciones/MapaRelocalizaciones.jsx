import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const REGION_COLORS = {
  'LOS LAGOS':   { fill: '#e07b39', label: 'Los Lagos' },
  'AYSÉN':       { fill: '#d94040', label: 'Aysén' },
  'MAGALLANES':  { fill: '#1565c0', label: 'Magallanes' },
}

function getRegionKey(regionStr) {
  const r = (regionStr || '').toUpperCase()
  if (r.includes('LAGOS')) return 'LOS LAGOS'
  if (r.includes('AYS')) return 'AYSÉN'
  if (r.includes('MAGALLANES')) return 'MAGALLANES'
  return null
}

export default function MapaRelocalizaciones() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-73.0, -46.5],
      zoom: 5.5,
      attributionControl: false,
    })
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.scrollZoom.disable()

    mapRef.current.on('load', async () => {
      const [centrosResp, relocResp, snaspeResp] = await Promise.all([
        fetch(BASE + 'data/centros_salmoneros.geojson').then(r => r.json()),
        fetch(BASE + 'data/relocalizaciones.json').then(r => r.json()),
        fetch(BASE + 'data/snaspe_terrestre.topojson').then(r => r.json()),
      ])

      // Build set of centro codes involved in relocalizaciones
      const relocCodes = new Set()
      relocResp.forEach(r => {
        r.centros.forEach(c => relocCodes.add(String(parseInt(c))))
      })

      // Classify centros by region, only those with relocalizacion
      const byRegion = { 'LOS LAGOS': [], 'AYSÉN': [], 'MAGALLANES': [] }
      const regionCounts = {}

      centrosResp.features.forEach(f => {
        const code = String(parseInt(f.properties.N_CODIGOCE))
        if (!relocCodes.has(code)) return
        const key = getRegionKey(f.properties.REGION)
        if (!key) return
        byRegion[key].push(f)
        regionCounts[key] = (regionCounts[key] || 0) + 1
      })

      setCounts(regionCounts)

      const allLayers = mapRef.current.getStyle().layers
      const firstSym = allLayers.find(l => l.type === 'symbol')
      const B = firstSym ? firstSym.id : undefined

      // ── SNASPE terrestre ──
      const snaspeGeo = feature(snaspeResp, snaspeResp.objects.snaspe)
      mapRef.current.addSource('snaspe', { type: 'geojson', data: snaspeGeo })
      mapRef.current.addLayer({
        id: 'snaspe-fill', type: 'fill', source: 'snaspe',
        paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.2 },
      }, B)
      mapRef.current.addLayer({
        id: 'snaspe-outline', type: 'line', source: 'snaspe',
        paint: { 'line-color': '#2e7d32', 'line-width': 1.2, 'line-dasharray': [3, 2] },
      }, B)

      // ── Centros por región ──
      for (const [key, feats] of Object.entries(byRegion)) {
        const color = REGION_COLORS[key]?.fill || '#888'
        const src = `centros-${key.replace(/\s/g, '-').toLowerCase()}`
        mapRef.current.addSource(src, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: feats },
        })
        mapRef.current.addLayer({
          id: `layer-${src}`, type: 'circle', source: src,
          paint: {
            'circle-color': color,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 9, 7, 12, 10],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.85,
          },
        }, B)
      }

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Leyenda */}
      <div className='absolute top-3 left-3 bg-white/85 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 space-y-1.5'>
        <p className='text-[10px] font-bold uppercase tracking-wider text-[#1b3a4b]/50 mb-1'>Solicitudes de relocalización</p>
        {Object.entries(REGION_COLORS).map(([key, { fill, label }]) => (
          <div key={key} className='flex items-center gap-2'>
            <span className='w-3 h-3 rounded-full shrink-0' style={{ background: fill, border: '1.5px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>{label}</span>
            {counts[key] !== undefined && (
              <span className='text-[#1b3a4b]/40 text-[10px]'>({counts[key]})</span>
            )}
          </div>
        ))}
        <div className='pt-1.5 border-t border-[#1b3a4b]/10 flex items-center gap-2'>
          <span className='w-3 h-3 rounded shrink-0' style={{ background: 'rgba(76,175,80,0.25)', border: '1.5px dashed #2e7d32' }} />
          <span className='text-[#1b3a4b]/60 text-[10px]'>Área protegida terrestre</span>
        </div>
      </div>

      {!loaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-[#f0f4f3] z-20'>
          <p className='text-[#1b3a4b]/40'>Cargando...</p>
        </div>
      )}
    </div>
  )
}
