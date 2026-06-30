import { useEffect, useRef, useState } from 'react'
import MapSpinner from '../../shared/MapSpinner'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const C_AP = '#d94040'      // relocalizado dentro de un area protegida
const C_OUT = '#5b9ea6'     // relocalizado fuera de area protegida

const KEY_AP_NAMES = [
  'Parque Nacional y Reserva Nacional Kawésqar',
  'Reserva Nacional Las Guaitecas',
  'Parque Nacional Laguna San Rafael',
  'Parque Nacional Alberto de Agostini',
  "Parque Nacional Bernardo O'Higgins",
]

const esc = (v) => (v == null ? '' : String(v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])))

function popupHTML(p) {
  const ap = p.in_ap
    ? `<div style="margin-top:6px;padding:6px 8px;background:#fdecec;border-left:3px solid ${C_AP};border-radius:4px">
         <div style="font-weight:700;color:#b71c1c;font-size:12px">Dentro de area protegida</div>
         <div style="font-size:12px;color:#1b3a4b">${esc(p.ap_nombre)}${p.ap_tipo ? ` &middot; ${esc(p.ap_tipo)}` : ''}${p.ap_anio ? ` (creada ${esc(p.ap_anio)})` : ''}</div>
       </div>`
    : `<div style="margin-top:6px;padding:6px 8px;background:#eef5f5;border-left:3px solid ${C_OUT};border-radius:4px">
         <div style="font-weight:700;color:#1b5e5e;font-size:12px">Fuera de area protegida</div>
       </div>`
  return `<div style="font-family:system-ui,sans-serif;max-width:240px;line-height:1.35">
    <div style="font-weight:700;color:#1b3a4b;font-size:13px">${esc(p.titular)}</div>
    <div style="font-size:11px;color:#1b3a4b;opacity:.7">${esc(p.grupo)}</div>
    <div style="font-size:11px;color:#1b3a4b;opacity:.7;margin-top:2px">${esc(p.comuna)}${p.region ? ` &middot; ${esc(p.region.replace('REGIÓN DE ', '').replace('REGIÓN DEL ', ''))}` : ''}</div>
    ${ap}
    ${p.fecha_solicitud ? `<div style="font-size:11px;color:#1b3a4b;margin-top:6px"><b>Solicitud de relocalizacion:</b> ${esc(p.fecha_solicitud)}</div>` : ''}
    ${p.descripcion ? `<div style="font-size:11px;color:#1b3a4b;margin-top:4px">${esc(p.descripcion)}</div>` : ''}
    ${p.expediente ? `<div style="font-size:10px;color:#1b3a4b;opacity:.55;margin-top:4px">Exp. ${esc(p.expediente)}${p.codigo ? ` &middot; centro ${esc(p.codigo)}` : ''}</div>` : ''}
  </div>`
}

export default function MapaRelocalizacionesAP() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ ap: true, out: true, snaspe: true })
  const [counts, setCounts] = useState({ ap: 0, out: 0 })

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-73.5, -46.0],
      zoom: 5,
      attributionControl: false,
      cooperativeGestures: true,
      locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa', 'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scroll para acercar', 'CooperativeGesturesHandler.MacHelpText': 'Usa Cmd + scroll para acercar' },
    })
    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current.scrollZoom.disable()

    mapRef.current.on('load', async () => {
      const [relocResp, snaspeResp] = await Promise.all([
        fetch(BASE + 'data/relocalizaciones_ap.geojson').then(r => r.json()),
        fetch(BASE + 'data/snaspe_terrestre.topojson').then(r => r.json()),
      ])

      const feats = relocResp.features
      setCounts({
        ap: feats.filter(f => f.properties.in_ap).length,
        out: feats.filter(f => !f.properties.in_ap).length,
      })

      const snaspeGeo = feature(snaspeResp, snaspeResp.objects.snaspe)
      const allLayers = mapRef.current.getStyle().layers
      const firstSym = allLayers.find(l => l.type === 'symbol')
      const B = firstSym ? firstSym.id : undefined

      // ── SNASPE terrestre (contexto: areas protegidas) ──
      mapRef.current.addSource('snaspe', { type: 'geojson', data: snaspeGeo })
      mapRef.current.addLayer({ id: 'snaspe-fill', type: 'fill', source: 'snaspe', paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.2 } }, B)
      mapRef.current.addLayer({ id: 'snaspe-outline', type: 'line', source: 'snaspe', paint: { 'line-color': '#2e7d32', 'line-width': 1.5, 'line-dasharray': [3, 2] } }, B)

      const labelFeatures = []
      for (const f of snaspeGeo.features) {
        if (KEY_AP_NAMES.includes(f.properties.NOMBRE)) {
          const coords = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0]
          let cx = 0, cy = 0
          for (const c of coords) { cx += c[0]; cy += c[1] }
          cx /= coords.length; cy /= coords.length
          const shortName = f.properties.NOMBRE.replace('Parque Nacional y Reserva Nacional ', 'RN ').replace('Parque Nacional ', 'PN ').replace('Reserva Nacional ', 'RN ')
          labelFeatures.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [cx, cy] }, properties: { name: shortName } })
        }
      }
      mapRef.current.addSource('ap-labels', { type: 'geojson', data: { type: 'FeatureCollection', features: labelFeatures } })
      mapRef.current.addLayer({
        id: 'ap-labels', type: 'symbol', source: 'ap-labels', minzoom: 5,
        layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 13, 12, 16], 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-padding': 2, 'text-allow-overlap': true, 'text-ignore-placement': true, 'text-anchor': 'center' },
        paint: { 'text-color': '#1b5e20', 'text-halo-color': 'rgba(255,255,255,0.95)', 'text-halo-width': 2 },
      })

      // ── Centros relocalizados ──
      mapRef.current.addSource('reloc', { type: 'geojson', data: relocResp })
      mapRef.current.addLayer({
        id: 'reloc-points', type: 'circle', source: 'reloc',
        paint: {
          'circle-color': ['case', ['get', 'in_ap'], C_AP, C_OUT],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 5, 9, 8, 12, 12],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      })

      // ── Place labels (mismos que el mapa base) ──
      mapRef.current.addLayer({ id: 'labels-regions', type: 'symbol', source: 'carto', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['state', 'province']]], minzoom: 4, maxzoom: 10, layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.15, 'text-padding': 8 }, paint: { 'text-color': '#1b3a4b', 'text-opacity': 0.45, 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })
      mapRef.current.addLayer({ id: 'labels-cities', type: 'symbol', source: 'carto', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]], minzoom: 6, layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 10, 14, 14, 16], 'text-font': ['Open Sans Bold'], 'text-padding': 4 }, paint: { 'text-color': '#1b3a4b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })
      mapRef.current.addLayer({ id: 'labels-water', type: 'symbol', source: 'carto', 'source-layer': 'water_name', minzoom: 7, layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-font': ['Open Sans Italic'], 'text-padding': 6 }, paint: { 'text-color': '#4a7a8a', 'text-opacity': 0.6, 'text-halo-color': '#ffffff', 'text-halo-width': 1 } })

      // ── Interaccion: popup al click ──
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '260px' })
      mapRef.current.on('click', 'reloc-points', (e) => {
        const f = e.features[0]
        popup.setLngLat(f.geometry.coordinates.slice()).setHTML(popupHTML(f.properties)).addTo(mapRef.current)
      })
      mapRef.current.on('mouseenter', 'reloc-points', () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'reloc-points', () => { mapRef.current.getCanvas().style.cursor = '' })

      // ── Encuadre a los datos ──
      const b = new maplibregl.LngLatBounds()
      feats.forEach(f => b.extend(f.geometry.coordinates))
      mapRef.current.fitBounds(b, { padding: 60, maxZoom: 7, duration: 0 })

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const toggleLayer = (id) => {
    const next = !visible[id]
    setVisible(v => ({ ...v, [id]: next }))
    if (!mapRef.current || !loaded) return
    const vis = next ? 'visible' : 'none'
    if (id === 'snaspe') {
      mapRef.current.setLayoutProperty('snaspe-fill', 'visibility', vis)
      mapRef.current.setLayoutProperty('snaspe-outline', 'visibility', vis)
      mapRef.current.setLayoutProperty('ap-labels', 'visibility', vis)
    } else {
      // ap / out -> filtro combinado sobre reloc-points
      const ap = id === 'ap' ? next : visible.ap
      const out = id === 'out' ? next : visible.out
      let filter
      if (ap && out) filter = null
      else if (ap) filter = ['get', 'in_ap']
      else if (out) filter = ['!', ['get', 'in_ap']]
      else filter = ['==', ['get', 'in_ap'], '__none__']
      mapRef.current.setFilter('reloc-points', filter)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      <div className='absolute top-3 left-3 bg-white/85 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 space-y-1.5'>
        <p className='text-[10px] font-bold uppercase tracking-wider text-[#1b3a4b]/50 mb-1'>Relocalizaciones</p>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input type='checkbox' checked={visible.ap} onChange={() => toggleLayer('ap')} className='rounded' style={{ accentColor: C_AP }} />
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: C_AP }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Dentro de área protegida ({counts.ap})</span>
        </label>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input type='checkbox' checked={visible.out} onChange={() => toggleLayer('out')} className='rounded' style={{ accentColor: C_OUT }} />
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: C_OUT }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Fuera de área protegida ({counts.out})</span>
        </label>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input type='checkbox' checked={visible.snaspe} onChange={() => toggleLayer('snaspe')} className='rounded accent-[#4caf50]' />
          <span className='w-2.5 h-2.5 rounded shrink-0' style={{ background: 'rgba(76,175,80,0.3)', border: '1.5px dashed #2e7d32' }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Áreas protegidas terrestres</span>
        </label>
      </div>

      <MapSpinner show={!loaded} />
    </div>
  )
}
