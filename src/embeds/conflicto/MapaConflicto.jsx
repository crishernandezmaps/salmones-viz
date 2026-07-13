import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import MapSpinner from '../../shared/MapSpinner'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

/* ── Detecta viewport movil de forma reactiva (orientacion / resize del iframe) ── */
function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [bp])
  return m
}

/* ── SVG icon factory ── */
function makeSVG(fill, stroke, symbol) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">` +
    (symbol === 'triangle'
      ? `<polygon points="14,2 26,26 2,26" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : symbol === 'diamond'
        ? `<polygon points="14,1 27,14 14,27 1,14" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
        : symbol === 'square'
          ? `<rect x="3" y="3" width="22" height="22" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
          : `<circle cx="14" cy="14" r="11" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`) +
    (symbol === 'triangle'
      ? `<text x="14" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">!</text>`
      : '') +
    `</svg>`
  )
}

const ICONS = {
  normal:            { svg: makeSVG('#5b9ea6', '#fff', 'circle') },
  denuncia:          { svg: makeSVG('#5b9ea6', '#ffd600', 'circle') },
  sobreproduccion:   { svg: makeSVG('#b71c1c', '#ffd600', 'diamond') },
}

function getCategory(hasDenuncia) {
  if (hasDenuncia) return 'denuncia'
  return 'normal'
}

/* ── Inset map with trapezoid connector ── */
function InsetWithConnector({ mapRef, lng, lat }) {
  const containerRef = useRef(null)
  const [pointPos, setPointPos] = useState(null)
  const INSET_W = 220
  const INSET_H = 170
  const INSET_MARGIN_RIGHT = 12

  useEffect(() => {
    const updatePos = () => {
      if (!mapRef.current || !containerRef.current) return
      const px = mapRef.current.project([lng, lat])
      const rect = containerRef.current.getBoundingClientRect()
      if (px.x >= 0 && px.x <= rect.width && px.y >= 0 && px.y <= rect.height) {
        setPointPos({ x: px.x, y: px.y, cw: rect.width, ch: rect.height })
      } else {
        setPointPos(null)
      }
    }
    updatePos()
    mapRef.current?.on('move', updatePos)
    return () => { mapRef.current?.off('move', updatePos) }
  }, [mapRef, lng, lat])

  const insetRight = INSET_MARGIN_RIGHT

  return (
    <div ref={containerRef} className='absolute inset-0 z-10 pointer-events-none'>
      {pointPos && (
        <svg className='absolute inset-0 w-full h-full' style={{ zIndex: 5 }}>
          <defs>
            <linearGradient id='connGrad' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0%' stopColor='rgba(217,64,64,0.15)' />
              <stop offset='100%' stopColor='rgba(217,64,64,0.08)' />
            </linearGradient>
          </defs>
          {(() => {
            const insetY = (pointPos.ch - INSET_H) / 2
            return (
              <>
                <polygon
                  points={`
                    ${pointPos.x},${pointPos.y}
                    ${pointPos.cw - insetRight - INSET_W},${insetY}
                    ${pointPos.cw - insetRight},${insetY}
                    ${pointPos.cw - insetRight},${insetY + INSET_H}
                    ${pointPos.cw - insetRight - INSET_W},${insetY + INSET_H}
                  `}
                  fill='url(#connGrad)'
                />
                <line x1={pointPos.x} y1={pointPos.y} x2={pointPos.cw - insetRight - INSET_W} y2={insetY}
                  stroke='rgba(217,64,64,0.35)' strokeWidth='1' strokeDasharray='4,3' />
                <line x1={pointPos.x} y1={pointPos.y} x2={pointPos.cw - insetRight - INSET_W} y2={insetY + INSET_H}
                  stroke='rgba(217,64,64,0.35)' strokeWidth='1' strokeDasharray='4,3' />
              </>
            )
          })()}
          <circle cx={pointPos.x} cy={pointPos.y} r='4' fill='#d94040' />
          <circle cx={pointPos.x} cy={pointPos.y} r='10' fill='none' stroke='rgba(217,64,64,0.4)' strokeWidth='1.5'>
            <animate attributeName='r' values='6;14;6' dur='2s' repeatCount='indefinite' />
            <animate attributeName='opacity' values='0.6;0.1;0.6' dur='2s' repeatCount='indefinite' />
          </circle>
        </svg>
      )}
      <div
        className='absolute pointer-events-auto rounded-lg overflow-hidden shadow-lg'
        style={{
          width: INSET_W, height: INSET_H,
          right: INSET_MARGIN_RIGHT, top: '50%', transform: 'translateY(-50%)',
          border: '2px solid rgba(217,64,64,0.4)', zIndex: 6,
        }}
      >
        <MiniMap lng={lng} lat={lat} />
      </div>
    </div>
  )
}

function FichaRow({ label, value }) {
  if (!value) return null
  return (
    <div className='py-1.5 border-b border-current/10'>
      <p className='text-[10px] uppercase tracking-wider opacity-50 mb-0.5'>{label}</p>
      <p className='text-sm font-medium'>{value}</p>
    </div>
  )
}

function MiniMap({ lng, lat }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  useEffect(() => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    mapRef.current = new maplibregl.Map({
      container: ref.current, style: MAP_STYLE,
      center: [lng, lat], zoom: 12, attributionControl: false, interactive: false,
    })
    mapRef.current.on('load', () => {
      mapRef.current.addSource('pin', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} },
      })
      mapRef.current.addLayer({ id: 'pin-pulse', type: 'circle', source: 'pin', paint: { 'circle-radius': 18, 'circle-color': '#d94040', 'circle-opacity': 0.2 } })
      mapRef.current.addLayer({ id: 'pin-dot', type: 'circle', source: 'pin', paint: { 'circle-radius': 6, 'circle-color': '#d94040', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } })
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [lng, lat])
  return <div ref={ref} className='w-full h-full' />
}

/* ── Ficha Panel ── */
function FichaPanel({ selected, ranking, rankIndex, onNavigate, onClose }) {
  if (!selected) {
    return (
      <div className='h-full flex items-center justify-center p-6'>
        <p className='text-[#1b3a4b]/30 text-sm text-center'>
          Haz click en un punto del mapa para ver la ficha completa
        </p>
      </div>
    )
  }

  const { centro, concesion, denuncias, hasDenuncia, sobreproduccion } = selected
  const hasSobreprod = sobreproduccion && sobreproduccion.length > 0
  const sp = hasSobreprod ? sobreproduccion[0] : null
  const headerBg = hasSobreprod ? '#b71c1c' : '#3a9e9e'
  const inRanking = rankIndex >= 0
  const regionShort = (r) => !r ? '' : String(r).replace(/^REGI[ÓO]N DE\s+/i, '').replace(/\s+DEL GENERAL.*$/i, '').trim()

  return (
    <div
      className='h-full flex flex-col overflow-hidden md:overflow-y-auto'
      style={{ background: hasSobreprod ? '#fff5f5' : '#fff', color: hasSobreprod ? '#4a1010' : '#1b3a4b' }}
    >
      {/* Paginacion por CENTRO (primer elemento; el nombre de la empresa va abajo, en el cuerpo) */}
      {ranking.length > 0 && (
        <div className='shrink-0 flex items-center justify-between px-4 py-2 border-b border-current/10' style={{ background: 'rgba(183,28,28,0.06)' }}>
          <button onClick={() => onNavigate(Math.max(0, rankIndex - 1))} disabled={rankIndex <= 0}
            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold disabled:opacity-20' style={{ color: headerBg, borderColor: headerBg }}>
            &#8592; Anterior
          </button>
          <span className='text-[10px] opacity-50 uppercase tracking-wider'>
            {inRanking ? `Centro ${rankIndex + 1} de ${ranking.length}` : 'Centros sancionados'}
          </span>
          <button onClick={() => onNavigate(Math.min(ranking.length - 1, rankIndex + 1))} disabled={rankIndex >= ranking.length - 1}
            className='sv-next inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm disabled:opacity-20' style={{ background: headerBg }}>
            Siguiente <span className='sv-next__arrow'>&#8594;</span>
          </button>
        </div>
      )}

      {/* Cuerpo — MOVIL: 2 columnas + fuente menor para evitar scroll. ESCRITORIO (md): 1 columna. */}
      <div className='px-3 py-2 flex-1 min-h-0 overflow-y-auto columns-2 gap-4 text-[11px] leading-snug md:columns-1 md:px-4 md:py-3 md:text-sm'>
        {sp ? (
          <>
            {/* nombre + grupo empresarial (pais) — abre el cuerpo, en rojo */}
            <p className='break-inside-avoid mb-2 font-bold leading-tight' style={{ color: '#b71c1c' }}>{sp.grupo_empresarial}</p>
            <p className='break-inside-avoid mb-2 text-sm md:text-base font-bold'>Centro {sp.codigo_centro}</p>

            {sp.area_protegida && (
              <p className='break-inside-avoid mb-2'>
                <span className='font-semibold'>{sp.area_protegida}</span><br />
                <span className='opacity-70'>{[sp.comuna, regionShort(sp.region)].filter(Boolean).join(' · ')}</span>
              </p>
            )}

            {sp.n_tramite_reloca && (
              <p className='break-inside-avoid mb-2'><span className='opacity-60'>Tr&aacute;mite relocalizaci&oacute;n:</span> <span className='font-semibold'>{sp.n_tramite_reloca}</span></p>
            )}

            {sp.descripcion && <p className='break-inside-avoid mb-2'>{sp.descripcion}</p>}

            {(sp.expediente || sp.estado) && (
              <p className='break-inside-avoid mb-2'>
                {sp.expediente && <span>Expediente SNIFA <span className='font-semibold'>{sp.expediente}</span>. </span>}
                {sp.estado && <span className='font-bold' style={{ color: '#b71c1c' }}>{sp.estado}</span>}
              </p>
            )}
          </>
        ) : (
          <p className='opacity-60'>Centro salmonero sin proceso por sobreproducci&oacute;n registrado.</p>
        )}

        {sp && (
          <p className='break-inside-avoid text-[9px] md:text-[10px] opacity-40 pt-2 border-t border-current/10'>
            {[sp.comuna, sp.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function MapaConflicto() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dataRef = useRef({ concMap: {}, denMap: {}, centrosByCode: {}, spMap: {} })
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ centros: true, amp: true, snaspe: true, sobreproduccion: true })
  const [stats, setStats] = useState({ sobreproduccion: 0 })
  const [selected, setSelected] = useState(null)
  const [ranking, setRanking] = useState([])
  const [rankIndex, setRankIndex] = useState(0)
  const isMobile = useIsMobile()
  const [legendOpen, setLegendOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)

  const rankingRef = useRef([])
  const selMarkerRef = useRef(null)

  const selectByCode = useCallback((code, zoomOverride) => {
    const { concMap, denMap, centrosByCode, spMap } = dataRef.current
    const props = centrosByCode[code]
    if (!props) return
    const concesion = concMap[code] || null
    const denuncias = denMap[code] || []
    const sobreproduccion = spMap[code] || []
    const hasDenuncia = denuncias.length > 0

    setSelected({ centro: props, concesion, denuncias, hasDenuncia, sobreproduccion })

    if (mapRef.current && props._lng && props._lat) {
      const lng = parseFloat(props._lng)
      const lat = parseFloat(props._lat)
      const m = window.innerWidth < 768
      // En movil la ficha ocupa la mitad inferior: bajamos el centro para que el
      // punto quede en la franja superior visible. En escritorio lo corremos a la
      // derecha (el mapa ocupa 3/5 y la ficha va a la derecha).
      mapRef.current.flyTo({
        center: m ? [lng, lat - 0.10] : [lng + 0.15, lat + 0.1],
        zoom: zoomOverride != null ? zoomOverride : (m ? 8.2 : 9), duration: 1200,
      })
    }
  }, [])

  const handleNavigate = useCallback((idx) => {
    const r = rankingRef.current
    if (idx < 0 || idx >= r.length) return
    setRankIndex(idx)
    selectByCode(r[idx].code)
  }, [selectByCode])

  const handleCentroClick = useCallback((props) => {
    const code = String(parseInt(props.N_CODIGOCE))
    selectByCode(code)
    // paginacion por CENTRO: ubicar el indice del centro en el ranking (36 centros)
    const ri = rankingRef.current.findIndex(r => r.code === code)
    setRankIndex(ri)
  }, [selectByCode])

  // Marcador del punto SELECCIONADO: anillo pulsante de alto contraste que "lazo"
  // el centro elegido para distinguirlo entre los muchos puntos del mapa.
  useEffect(() => {
    if (!mapRef.current) return
    const c = selected && selected.centro
    if (c && c._lng && c._lat) {
      const lngLat = [parseFloat(c._lng), parseFloat(c._lat)]
      if (!selMarkerRef.current) {
        const el = document.createElement('div')
        el.className = 'conf-selmarker'
        el.style.width = '42px'
        el.style.height = '42px'
        el.innerHTML = '<div class="conf-selmarker__pulse"></div><div class="conf-selmarker__ring"></div>'
        selMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(lngLat).addTo(mapRef.current)
      } else {
        selMarkerRef.current.setLngLat(lngLat)
      }
    } else if (selMarkerRef.current) {
      selMarkerRef.current.remove()
      selMarkerRef.current = null
    }
  }, [selected])

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current, style: MAP_STYLE,
      center: [-73.2, -43.5], zoom: 7, attributionControl: false,
      cooperativeGestures: true,
      locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa', 'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scroll para acercar', 'CooperativeGesturesHandler.MacHelpText': 'Usa Cmd + scroll para acercar' },
    })
    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current.scrollZoom.disable()  // la rueda scrollea la pagina, no hace zoom
    // En movil la interaccion se controla con el gate toca-para-activar (pointer-events) en
    // el wrapper: en modo scroll el mapa no recibe gestos; al activar, gestos normales.

    mapRef.current.on('load', async () => {
      const [ampResp, snaspeResp, centrosResp, concResp, denResp, spResp] = await Promise.all([
        fetch(BASE + 'data/amp_nacional.topojson').then(r => r.json()),
        fetch(BASE + 'data/snaspe_terrestre.topojson').then(r => r.json()),
        fetch(BASE + 'data/centros_salmoneros.geojson').then(r => r.json()),
        fetch(BASE + 'data/concesiones_excel.json').then(r => r.json()),
        fetch(BASE + 'data/denuncias.json').then(r => r.json()),
        fetch(BASE + 'data/sobreproduccion.json').then(r => r.json()),
      ])

      const ampGeo = feature(ampResp, ampResp.objects.amp)

      const snaspeGeo = feature(snaspeResp, snaspeResp.objects.snaspe)

      // Concesiones lookup
      const concMap = {}
      concResp.forEach(c => {
        const code = c['Codigo Centro'] || c['Codigo Centro']
        if (code) concMap[String(parseInt(code))] = c
      })

      // Old denuncias lookup
      const denMap = {}
      denResp.forEach(d => {
        const code = String(parseInt(d['Codigo de Centro']))
        if (!denMap[code]) denMap[code] = []
        denMap[code].push(d)
      })

      // Sobreproduccion lookup (by codigo_centro)
      const spMap = {}
      const spCodes = new Set()
      spResp.forEach(sp => {
        if (!sp.codigo_centro) return
        const code = String(sp.codigo_centro)
        if (!spMap[code]) spMap[code] = []
        spMap[code].push(sp)
        spCodes.add(code)
      })

      // Ranking por CENTRO (los 36 sancionados). Se recorre uno por uno con Anterior/Siguiente.
      // Orden: por region, luego titular, luego codigo -> agrupa visualmente por zona/empresa.
      const centroRanking = spResp
        .filter(sp => sp.codigo_centro)
        .slice()
        .sort((a, b) =>
          String(a.region || '').localeCompare(String(b.region || '')) ||
          String(a.titular || '').localeCompare(String(b.titular || '')) ||
          String(a.codigo_centro).localeCompare(String(b.codigo_centro)))
        .map(sp => ({ code: String(sp.codigo_centro), titular: sp.titular }))
      rankingRef.current = centroRanking
      setRanking(centroRanking)

      // Classify centros
      const buckets = { normal: [], denuncia: [] }
      const centrosByCode = {}
      const spFeatures = []

      for (const centro of centrosResp.features) {
        centro.properties._lng = centro.geometry.coordinates[0]
        centro.properties._lat = centro.geometry.coordinates[1]
        const code = String(parseInt(centro.properties.N_CODIGOCE))
        centrosByCode[code] = centro.properties

        const hasDen = !!denMap[code]
        buckets[getCategory(hasDen)].push(centro)

        // Collect features for sobreproduccion layer
        if (spCodes.has(code)) {
          spFeatures.push({ ...centro, properties: { ...centro.properties, _layer: 'sobreproduccion' } })
        }
      }

      // Add sobreproduccion points that have their own coords but are NOT in centros_salmoneros
      spResp.forEach(sp => {
        if (!sp.codigo_centro || !sp.lat || !sp.lng) return
        const code = String(sp.codigo_centro)
        if (!centrosByCode[code]) {
          const props = { N_CODIGOCE: String(sp.codigo_centro), _lng: sp.lng, _lat: sp.lat, _conflict: false, _layer: 'sobreproduccion' }
          centrosByCode[code] = props
          spFeatures.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [sp.lng, sp.lat] }, properties: props })
        }
      })

      setStats({ sobreproduccion: spCodes.size })
      dataRef.current = { concMap, denMap, centrosByCode, spMap }

      // Insert data layers BEFORE first label so CARTO labels render on top
      const allLayers = mapRef.current.getStyle().layers
      const firstSym = allLayers.find(l => l.type === 'symbol')
      const B = firstSym ? firstSym.id : undefined
      console.log('[MapaConflicto] beforeId =', B, '| layers:', allLayers.length, '| symbols:', allLayers.filter(l => l.type === 'symbol').length)

      // ── SNASPE terrestre layers ──
      mapRef.current.addSource('snaspe', { type: 'geojson', data: snaspeGeo })
      mapRef.current.addLayer({ id: 'snaspe-fill', type: 'fill', source: 'snaspe', paint: { 'fill-color': '#4caf50', 'fill-opacity': 0.18 } }, B)
      mapRef.current.addLayer({ id: 'snaspe-outline', type: 'line', source: 'snaspe', paint: { 'line-color': '#2e7d32', 'line-width': 1.5, 'line-dasharray': [3, 2] } }, B)

      // ── SNASPE + AMP labels for key protected areas ──
      const KEY_AP_NAMES = [
        'Parque Nacional y Reserva Nacional Kawésqar',
        'Reserva Nacional Las Guaitecas',
        'Parque Nacional Laguna San Rafael',
        'Parque Nacional Alberto de Agostini',
        "Parque Nacional Bernardo O'Higgins",
        'Parque Nacional Isla Magdalena',
      ]
      const labelFeatures = []
      for (const f of snaspeGeo.features) {
        if (KEY_AP_NAMES.includes(f.properties.NOMBRE)) {
          // Compute centroid for label placement
          const coords = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0]
          let cx = 0, cy = 0
          for (const c of coords) { cx += c[0]; cy += c[1] }
          cx /= coords.length; cy /= coords.length
          // Short display name
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

      // ── AMP layers ──
      mapRef.current.addSource('amp', { type: 'geojson', data: ampGeo })
      mapRef.current.addLayer({ id: 'amp-fill', type: 'fill', source: 'amp', paint: { 'fill-color': '#3a9e9e', 'fill-opacity': 0.3 } }, B)
      mapRef.current.addLayer({ id: 'amp-outline', type: 'line', source: 'amp', paint: { 'line-color': '#2a7a7a', 'line-width': 1.5 } }, B)


      // ── Heatmap ──
      mapRef.current.addSource('all-centros', { type: 'geojson', data: centrosResp })
      mapRef.current.addLayer({
        id: 'centros-heat', type: 'heatmap', source: 'all-centros',
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.5, 12, 2],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 8, 22, 12, 30],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.1, 'rgba(217,64,64,0.15)', 0.3, 'rgba(217,64,64,0.35)',
            0.5, 'rgba(200,50,50,0.5)', 0.7, 'rgba(180,40,40,0.65)',
            0.9, 'rgba(160,30,30,0.8)', 1, 'rgba(140,20,20,0.9)'],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0.4, 13, 0],
        },
      }, B)

      // ── Circle layers — all before labels ──
      const CIRCLE_STYLE = {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 8, 5, 12, 8],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 12, 2],
      }
      const COLORS = {
        normal:            { fill: '#5b9ea6', stroke: '#ffffff' },
        denuncia:          { fill: '#5b9ea6', stroke: '#ffd600' },
      }

      for (const [cat, feats] of Object.entries(buckets)) {
        mapRef.current.addSource('src-' + cat, { type: 'geojson', data: { type: 'FeatureCollection', features: feats } })
        mapRef.current.addLayer({
          id: 'layer-' + cat, type: 'circle', source: 'src-' + cat,
          paint: { ...CIRCLE_STYLE, 'circle-color': COLORS[cat].fill, 'circle-stroke-color': COLORS[cat].stroke },
        }, B)
        mapRef.current.on('click', 'layer-' + cat, (e) => handleCentroClick(e.features[0].properties))
        mapRef.current.on('mouseenter', 'layer-' + cat, () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
        mapRef.current.on('mouseleave', 'layer-' + cat, () => { mapRef.current.getCanvas().style.cursor = '' })
      }

      // Sobreproduccion layer
      mapRef.current.addSource('src-sobreproduccion', { type: 'geojson', data: { type: 'FeatureCollection', features: spFeatures } })
      mapRef.current.addLayer({
        id: 'layer-sobreproduccion', type: 'circle', source: 'src-sobreproduccion',
        paint: { ...CIRCLE_STYLE, 'circle-color': '#b71c1c', 'circle-stroke-color': '#ffd600',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 8, 7, 12, 10] },
      }, B)
      mapRef.current.on('click', 'layer-sobreproduccion', (e) => handleCentroClick(e.features[0].properties))
      mapRef.current.on('mouseenter', 'layer-sobreproduccion', () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'layer-sobreproduccion', () => { mapRef.current.getCanvas().style.cursor = '' })

      // Labels using 'name' (not 'name_en' which is empty for Chile)
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
        id: 'labels-places', type: 'symbol', source: 'carto', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['village', 'hamlet', 'suburb', 'island']]],
        minzoom: 9,
        layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 14, 13], 'text-font': ['Open Sans Regular'], 'text-padding': 4 },
        paint: { 'text-color': '#1b3a4b', 'text-opacity': 0.7, 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
      mapRef.current.addLayer({
        id: 'labels-water', type: 'symbol', source: 'carto', 'source-layer': 'water_name',
        minzoom: 7,
        layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-font': ['Open Sans Italic'], 'text-padding': 6 },
        paint: { 'text-color': '#4a7a8a', 'text-opacity': 0.6, 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
      })

      // Auto-seleccion del primer centro sancionado al cargar (movil y escritorio):
      // el usuario ve un ejemplo ya desplegado de inmediato (ficha + punto marcado).
      if (centroRanking.length > 0) {
        selectByCode(centroRanking[0].code, window.innerWidth < 768 ? 6.2 : 7)  // parte mas alejado
        setRankIndex(0)
      }

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleLayer = (id) => {
    const next = !visible[id]
    setVisible(v => ({ ...v, [id]: next }))
    if (mapRef.current && loaded) {
      const vis = next ? 'visible' : 'none'
      if (id === 'centros') {
        mapRef.current.setLayoutProperty('centros-heat', 'visibility', vis)
        for (const cat of ['normal', 'denuncia']) {
          if (mapRef.current.getLayer('layer-' + cat)) mapRef.current.setLayoutProperty('layer-' + cat, 'visibility', vis)
        }
      } else if (id === 'snaspe') {
        mapRef.current.setLayoutProperty('snaspe-fill', 'visibility', vis)
        mapRef.current.setLayoutProperty('snaspe-outline', 'visibility', vis)
      } else if (id === 'amp') {
        mapRef.current.setLayoutProperty('amp-fill', 'visibility', vis)
        mapRef.current.setLayoutProperty('amp-outline', 'visibility', vis)
      } else if (id === 'sobreproduccion') {
        if (mapRef.current.getLayer('layer-sobreproduccion')) mapRef.current.setLayoutProperty('layer-sobreproduccion', 'visibility', vis)
      }
    }
  }

  const currentRankIndex = useMemo(() => {
    if (!selected || !selected.sobreproduccion || selected.sobreproduccion.length === 0) return -1
    const code = String(selected.sobreproduccion[0].codigo_centro)
    return ranking.findIndex(r => r.code === code)
  }, [selected, ranking])

  return (
    <div className='flex h-full w-full' style={{ position: 'relative' }}>
      <style>{`
        .conf-selmarker { position:relative; pointer-events:none; }
        .conf-selmarker__ring { position:absolute; inset:0; border:3px solid #1b3a4b; border-radius:50%;
          box-shadow:0 0 0 2px rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.55); }
        .conf-selmarker__pulse { position:absolute; inset:0; border-radius:50%; background:rgba(27,58,75,0.22);
          animation:confSelPulse 1.6s ease-out infinite; }
        @keyframes confSelPulse { 0%{transform:scale(0.5);opacity:0.75} 100%{transform:scale(1.95);opacity:0} }
      `}</style>
      <MapSpinner show={!loaded} />
      <div className={selected ? 'w-full md:w-3/5 relative' : 'w-full relative'}>
        <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {/* Legend — colapsable (en movil arranca cerrada para no tapar el mapa) */}
        <div className='absolute top-3 left-3 z-10'>
          <button
            onClick={() => setLegendOpen(o => !o)}
            className='flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1b3a4b]/70'
          >
            <span className='inline-block w-3 h-3 rounded-sm' style={{ background: 'linear-gradient(135deg,#5b9ea6,#b71c1c)' }} />
            Capas
            <span className='text-[#1b3a4b]/40 text-[9px]'>{legendOpen ? '▾' : '▸'}</span>
          </button>
          <div className={(legendOpen ? 'block' : 'hidden') + ' mt-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 text-sm space-y-1.5 max-w-[80vw] md:max-w-none'}>
          <div className='flex items-center gap-2'>
            <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: '#5b9ea6' }} />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Centros salmoneros</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-2.5 h-2.5 rounded shrink-0' style={{ background: 'rgba(58,158,158,0.4)', border: '1.5px solid #2a7a7a' }} />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Áreas marinas protegidas</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-2.5 h-2.5 rounded shrink-0' style={{ background: 'rgba(76,175,80,0.3)', border: '1.5px dashed #2e7d32' }} />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Áreas protegidas terrestres</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-3.5 h-3.5 rounded-full shrink-0' style={{ background: '#b71c1c', border: '2px solid #ffd600' }} />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Centros sancionados por sobreproducción ({stats.sobreproduccion})</span>
          </div>
          </div>
        </div>

        {/* Mini map inset — solo escritorio (en movil estorba el mapa pequeño) */}
        {!isMobile && selected && selected.centro._lng && (
          <InsetWithConnector
            key={selected.centro.N_CODIGOCE}
            mapRef={mapRef}
            lng={parseFloat(selected.centro._lng)}
            lat={parseFloat(selected.centro._lat)}
          />
        )}

        {!loaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-[#f0f4f3] z-20'>
            <p className='text-[#1b3a4b]/40'>Cargando capas...</p>
          </div>
        )}
      </div>

      {/* Ficha panel */}
      <div className={
        selected
          ? 'absolute bottom-0 left-0 right-0 h-[30%] md:relative md:h-auto md:w-2/5 z-20 shadow-lg md:shadow-none border-t md:border-t-0 md:border-l border-[#1b3a4b]/10'
          : 'hidden md:block md:relative md:w-2/5 border-l border-[#1b3a4b]/10'
      }>
        <FichaPanel
          selected={selected}
          ranking={ranking}
          rankIndex={currentRankIndex}
          onNavigate={handleNavigate}
          onClose={() => { setSelected(null); setRankIndex(-1) }}
        />
      </div>
    </div>
  )
}
