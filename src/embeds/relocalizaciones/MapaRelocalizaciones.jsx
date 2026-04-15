import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const KEY_AP_NAMES = [
  'Parque Nacional y Reserva Nacional Kawésqar',
  'Reserva Nacional Las Guaitecas',
  'Parque Nacional Laguna San Rafael',
  'Parque Nacional Alberto de Agostini',
  "Parque Nacional Bernardo O'Higgins",
]

export default function MapaCapas() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ centros: true, snaspe: true })
  const [centroCount, setCentroCount] = useState(0)

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
      const [centrosResp, snaspeResp] = await Promise.all([
        fetch(BASE + 'data/centros_salmoneros.geojson').then(r => r.json()),
        fetch(BASE + 'data/snaspe_terrestre.topojson').then(r => r.json()),
      ])

      setCentroCount(centrosResp.features.length)

      const snaspeGeo = feature(snaspeResp, snaspeResp.objects.snaspe)

      const allLayers = mapRef.current.getStyle().layers
      const firstSym = allLayers.find(l => l.type === 'symbol')
      const B = firstSym ? firstSym.id : undefined

      // ── SNASPE terrestre ──
      mapRef.current.addSource('snaspe', { type: 'geojson', data: snaspeGeo })
      mapRef.current.addLayer({
        id: 'snaspe-fill', type: 'fill', source: 'snaspe',
        paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.2 },
      }, B)
      mapRef.current.addLayer({
        id: 'snaspe-outline', type: 'line', source: 'snaspe',
        paint: { 'line-color': '#2e7d32', 'line-width': 1.5, 'line-dasharray': [3, 2] },
      }, B)

      // ── SNASPE labels for key protected areas ──
      const labelFeatures = []
      for (const f of snaspeGeo.features) {
        if (KEY_AP_NAMES.includes(f.properties.NOMBRE)) {
          const coords = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0]
          let cx = 0, cy = 0
          for (const c of coords) { cx += c[0]; cy += c[1] }
          cx /= coords.length; cy /= coords.length
          const shortName = f.properties.NOMBRE
            .replace('Parque Nacional y Reserva Nacional ', 'RN ')
            .replace('Parque Nacional ', 'PN ')
            .replace('Reserva Nacional ', 'RN ')
          labelFeatures.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [cx, cy] },
            properties: { name: shortName },
          })
        }
      }
      mapRef.current.addSource('ap-labels', { type: 'geojson', data: { type: 'FeatureCollection', features: labelFeatures } })
      mapRef.current.addLayer({
        id: 'ap-labels', type: 'symbol', source: 'ap-labels',
        minzoom: 5,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 13, 12, 16],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-padding': 2,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#1b5e20',
          'text-halo-color': 'rgba(255,255,255,0.95)',
          'text-halo-width': 2,
        },
      })

      // ── Centros salmoneros ──
      mapRef.current.addSource('centros', { type: 'geojson', data: centrosResp })
      mapRef.current.addLayer({
        id: 'centros-heat', type: 'heatmap', source: 'centros',
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.5, 12, 2],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 8, 22, 12, 30],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.1, 'rgba(91,158,166,0.15)', 0.3, 'rgba(91,158,166,0.35)',
            0.5, 'rgba(58,158,158,0.5)', 0.7, 'rgba(58,158,158,0.65)',
            0.9, 'rgba(42,122,122,0.8)', 1, 'rgba(27,90,90,0.9)'],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0.4, 13, 0],
        },
      }, B)
      mapRef.current.addLayer({
        id: 'centros-points', type: 'circle', source: 'centros',
        paint: {
          'circle-color': '#5b9ea6',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 9, 6, 12, 9],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 12, 2],
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.85,
        },
      }, B)

      // ── Place labels ──
      mapRef.current.addLayer({
        id: 'labels-regions', type: 'symbol', source: 'carto', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['state', 'province']]],
        minzoom: 4, maxzoom: 10,
        layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.15, 'text-padding': 8 },
        paint: { 'text-color': '#1b3a4b', 'text-opacity': 0.45, 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
      mapRef.current.addLayer({
        id: 'labels-cities', type: 'symbol', source: 'carto', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        minzoom: 6,
        layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 10, 14, 14, 16], 'text-font': ['Open Sans Bold'], 'text-padding': 4 },
        paint: { 'text-color': '#1b3a4b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
      mapRef.current.addLayer({
        id: 'labels-water', type: 'symbol', source: 'carto', 'source-layer': 'water_name',
        minzoom: 7,
        layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-font': ['Open Sans Italic'], 'text-padding': 6 },
        paint: { 'text-color': '#4a7a8a', 'text-opacity': 0.6, 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
      })

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const toggleLayer = (id) => {
    const next = !visible[id]
    setVisible(v => ({ ...v, [id]: next }))
    if (!mapRef.current || !loaded) return
    const vis = next ? 'visible' : 'none'
    if (id === 'centros') {
      mapRef.current.setLayoutProperty('centros-heat', 'visibility', vis)
      mapRef.current.setLayoutProperty('centros-points', 'visibility', vis)
    } else if (id === 'snaspe') {
      mapRef.current.setLayoutProperty('snaspe-fill', 'visibility', vis)
      mapRef.current.setLayoutProperty('snaspe-outline', 'visibility', vis)
      mapRef.current.setLayoutProperty('ap-labels', 'visibility', vis)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Leyenda */}
      <div className='absolute top-3 left-3 bg-white/85 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 space-y-1.5'>
        <p className='text-[10px] font-bold uppercase tracking-wider text-[#1b3a4b]/50 mb-1'>Capas</p>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input type='checkbox' checked={visible.centros} onChange={() => toggleLayer('centros')} className='rounded accent-[#5b9ea6]' />
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: '#5b9ea6' }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Centros salmoneros ({centroCount})</span>
        </label>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input type='checkbox' checked={visible.snaspe} onChange={() => toggleLayer('snaspe')} className='rounded accent-[#4caf50]' />
          <span className='w-2.5 h-2.5 rounded shrink-0' style={{ background: 'rgba(76,175,80,0.3)', border: '1.5px dashed #2e7d32' }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Áreas protegidas terrestres</span>
        </label>
      </div>

      {!loaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-[#f0f4f3] z-20'>
          <p className='text-[#1b3a4b]/40'>Cargando...</p>
        </div>
      )}
    </div>
  )
}
