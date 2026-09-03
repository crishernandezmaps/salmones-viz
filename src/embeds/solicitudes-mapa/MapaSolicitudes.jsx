import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import MapSpinner from '../../shared/MapSpinner'
import { MAP_STYLE } from '../../shared/constants'

const BASE = import.meta.env.BASE_URL

const C_FUSION = '#c65a1e'   // centro en al menos una solicitud con fusion
const C_SIMPLE = '#3a9e9e'   // centro solo en solicitudes individuales

const esc = (v) => (v == null ? '' : String(v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])))

const fmtFecha = (f) => {
  if (!f) return 'sin fecha'
  const [y, m] = f.split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${meses[parseInt(m, 10) - 1]} ${y}`
}

function popupHTML(p) {
  const sols = JSON.parse(p.solicitudes)
  const items = sols.map(s => `
    <div style="margin-top:6px;padding:6px 8px;background:${s.fusion ? '#fdf1e7' : '#eef5f5'};border-left:3px solid ${s.fusion ? C_FUSION : C_SIMPLE};border-radius:4px">
      <div style="font-size:11px;font-weight:700;color:#1b3a4b">${fmtFecha(s.fecha)} &middot; ${esc(s.tipo)}</div>
      ${s.co_centros.length ? `<div style="font-size:10px;color:#1b3a4b;opacity:.7">Junto a centro${s.co_centros.length > 1 ? 's' : ''} ${s.co_centros.map(esc).join(', ')}</div>` : ''}
      <div style="font-size:10px;color:#1b3a4b;opacity:.7;margin-top:2px">${esc(s.estado)}</div>
    </div>`).join('')
  return `<div style="font-family:system-ui,sans-serif;max-width:250px;line-height:1.35">
    <div style="font-weight:700;color:#1b3a4b;font-size:13px">${esc(p.holding)}</div>
    <div style="font-size:11px;color:#1b3a4b;opacity:.7">Centro ${esc(p.codigo)} &middot; ${p.n_solicitudes} solicitud${p.n_solicitudes > 1 ? 'es' : ''} de relocalizaci&oacute;n</div>
    ${items}
  </div>`
}

export default function MapaSolicitudes() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ fusion: true, simple: true })
  const [counts, setCounts] = useState({ fusion: 0, simple: 0, total: 0, sinCoord: 0 })

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-73.5, -45.0],
      zoom: 5,
      attributionControl: false,
      cooperativeGestures: true,
      locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa', 'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scroll para acercar', 'CooperativeGesturesHandler.MacHelpText': 'Usa Cmd + scroll para acercar' },
    })
    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current.scrollZoom.disable()

    mapRef.current.on('load', async () => {
      const data = await fetch(BASE + 'data/solicitudes_reloc.geojson').then(r => r.json())

      setCounts({
        fusion: data.features.filter(f => f.properties.any_fusion).length,
        simple: data.features.filter(f => !f.properties.any_fusion).length,
        total: data.meta?.solicitudes_total ?? 0,
        sinCoord: data.meta?.menciones_sin_coordenada ?? 0,
      })

      mapRef.current.addSource('solicitudes', { type: 'geojson', data })
      mapRef.current.addLayer({
        id: 'solicitudes-points', type: 'circle', source: 'solicitudes',
        paint: {
          'circle-color': ['case', ['get', 'any_fusion'], C_FUSION, C_SIMPLE],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3.5, 6, 5.5, 9, 8, 12, 12],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.88,
        },
      })

      // Labels de contexto (mismos del mapa base CARTO)
      mapRef.current.addLayer({ id: 'labels-regions', type: 'symbol', source: 'carto', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['state', 'province']]], minzoom: 4, maxzoom: 10, layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.15, 'text-padding': 8 }, paint: { 'text-color': '#1b3a4b', 'text-opacity': 0.45, 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })
      mapRef.current.addLayer({ id: 'labels-cities', type: 'symbol', source: 'carto', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]], minzoom: 6, layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 10, 14, 14, 16], 'text-font': ['Open Sans Bold'], 'text-padding': 4 }, paint: { 'text-color': '#1b3a4b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })

      // Interaccion
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '270px' })
      mapRef.current.on('click', 'solicitudes-points', (e) => {
        const f = e.features[0]
        popup.setLngLat(f.geometry.coordinates.slice()).setHTML(popupHTML(f.properties)).addTo(mapRef.current)
      })
      mapRef.current.on('mouseenter', 'solicitudes-points', () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'solicitudes-points', () => { mapRef.current.getCanvas().style.cursor = '' })

      // Encuadre
      const b = new maplibregl.LngLatBounds()
      data.features.forEach(f => b.extend(f.geometry.coordinates))
      mapRef.current.fitBounds(b, { padding: 60, maxZoom: 7, duration: 0 })

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const toggle = (key) => {
    const next = { ...visible, [key]: !visible[key] }
    setVisible(next)
    if (!mapRef.current || !loaded) return
    let filter
    if (next.fusion && next.simple) filter = null
    else if (next.fusion) filter = ['get', 'any_fusion']
    else if (next.simple) filter = ['!', ['get', 'any_fusion']]
    else filter = ['==', ['get', 'codigo'], '__none__']
    mapRef.current.setFilter('solicitudes-points', filter)
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      <div className='absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 max-w-[280px]'>
        <p className='text-[11px] font-bold uppercase tracking-wider text-[#1b3a4b] leading-tight'>Centros con solicitudes de relocalización</p>
        <p className='text-[10px] text-[#1b3a4b]/60 mt-0.5 mb-2'>{counts.total} solicitudes ingresadas a Subpesca entre 2010 y 2025</p>
        <label className='flex items-center gap-2 cursor-pointer mb-1.5'>
          <input type='checkbox' checked={visible.fusion} onChange={() => toggle('fusion')} className='rounded' style={{ accentColor: C_FUSION }} />
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: C_FUSION }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>En solicitudes que fusionan centros ({counts.fusion})</span>
        </label>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input type='checkbox' checked={visible.simple} onChange={() => toggle('simple')} className='rounded' style={{ accentColor: C_SIMPLE }} />
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: C_SIMPLE }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>En solicitudes individuales ({counts.simple})</span>
        </label>
        <p className='text-[9px] text-[#1b3a4b]/45 mt-2 leading-tight'>
          Se muestra el centro de ORIGEN de cada solicitud (las solicitudes en trámite no informan coordenada de destino).
          {counts.sinCoord > 0 ? ` ${counts.sinCoord} menciones sin coordenada oficial no se muestran.` : ''}
        </p>
      </div>

      <MapSpinner show={!loaded} />
    </div>
  )
}
