import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

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
  normal:            { svg: makeSVG('#d94040', '#fff', 'circle') },
  denuncia:          { svg: makeSVG('#d94040', '#ffd600', 'circle') },
  conflict:          { svg: makeSVG('#ff8c00', '#fff', 'triangle') },
  conflict_denuncia: { svg: makeSVG('#ff8c00', '#ffd600', 'triangle') },
  sobreproduccion:   { svg: makeSVG('#b71c1c', '#ffd600', 'diamond') },
  relocalizacion:    { svg: makeSVG('#1565c0', '#fff', 'square') },
}

function getCategory(isConflict, hasDenuncia) {
  if (isConflict && hasDenuncia) return 'conflict_denuncia'
  if (isConflict) return 'conflict'
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
function FichaPanel({ selected, ranking, rankIndex, onNavigate }) {
  if (!selected) {
    return (
      <div className='h-full flex items-center justify-center p-6'>
        <p className='text-[#1b3a4b]/30 text-sm text-center'>
          Haz click en un punto del mapa para ver la ficha completa
        </p>
      </div>
    )
  }

  const { centro, concesion, denuncias, ampName, isConflict, hasDenuncia, sobreproduccion, relocalizaciones } = selected
  const hasSobreprod = sobreproduccion && sobreproduccion.length > 0
  const hasReloc = relocalizaciones && relocalizaciones.length > 0

  const headerBg = isConflict && hasDenuncia ? '#c62828'
    : isConflict ? '#ff8c00'
    : hasSobreprod ? '#b71c1c'
    : hasDenuncia ? '#d94040'
    : hasReloc ? '#1565c0'
    : '#3a9e9e'

  const inRanking = rankIndex >= 0

  return (
    <div
      className='h-full overflow-y-auto'
      style={{
        background: isConflict ? '#fff3e0' : (hasSobreprod || hasDenuncia) ? '#fff5f5' : hasReloc ? '#e8f0fe' : '#fff',
        color: isConflict ? '#4a2800' : (hasSobreprod || hasDenuncia) ? '#4a1010' : '#1b3a4b',
      }}
    >
      {/* Header */}
      <div className='sticky top-0 z-10 px-4 py-3 flex items-center justify-between' style={{ background: headerBg, color: '#fff' }}>
        <div>
          <p className='text-xs opacity-80'>Comuna: {centro.COMUNA || '—'}</p>
          <p className='text-xs opacity-80'>Holding: {hasSobreprod ? sobreproduccion[0].titular : hasReloc ? relocalizaciones[0].holding : concesion?.Holding || concesion?.['Holding (columna manual)'] || concesion?.['nombre titular'] || '—'}</p>
        </div>
      </div>

      {/* Pagination — by holding */}
      {ranking.length > 0 && (
        <div className='flex items-center justify-between px-4 py-2 border-b border-current/10' style={{ background: inRanking ? 'rgba(217,64,64,0.08)' : 'rgba(27,58,75,0.04)' }}>
          <button onClick={() => onNavigate(Math.max(0, rankIndex - 1))} disabled={rankIndex <= 0}
            className='px-2 py-1 rounded text-xs font-bold disabled:opacity-20' style={{ color: headerBg }}>
            &#8592; Anterior
          </button>
          <span className='text-[10px] opacity-50 uppercase tracking-wider'>
            {inRanking ? `Holding ${rankIndex + 1} de ${ranking.length}` : 'Holdings sancionados'}
          </span>
          <button onClick={() => onNavigate(Math.min(ranking.length - 1, rankIndex + 1))} disabled={rankIndex >= ranking.length - 1}
            className='px-2 py-1 rounded text-xs font-bold disabled:opacity-20' style={{ color: headerBg }}>
            Siguiente &#8594;
          </button>
        </div>
      )}

      {/* Alerts */}
      {isConflict && (
        <div className='px-4 py-2 flex items-center gap-2' style={{ background: '#ffe0b2' }}>
          <span className='text-lg'>&#9888;</span>
          <div>
            <p className='text-xs font-bold' style={{ color: '#e65100' }}>DENTRO DE AREA PROTEGIDA</p>
            {ampName && <p className='text-xs opacity-70'>{ampName}</p>}
          </div>
        </div>
      )}

      <div className='px-4 py-2'>
        {/* ── SOBREPRODUCCION vertical timeline ── */}
        {hasSobreprod && (() => {
          const allCycles = []
          sobreproduccion.forEach(sp => {
            sp.excesos.forEach((ex, ei) => {
              if (ex.fecha_inicio) allCycles.push({ ...ex, expediente: sp.expediente, estado: sp.estado_procedimiento })
            })
          })
          allCycles.sort((a, b) => (a.fecha_inicio || '').localeCompare(b.fecha_inicio || ''))
          const maxPct = Math.max(...allCycles.map(c => c.exceso_pct), 1)

          return (
            <>
              <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-3 mt-2'>Proc. sancionatorio por sobreproduccion</p>
              <div className='relative ml-3'>
                {/* Vertical line */}
                <div className='absolute left-[7px] top-0 bottom-0 w-[2px]' style={{ background: 'rgba(217,64,64,0.2)' }} />

                {allCycles.map((c, ci) => {
                  const radius = 6 + (c.exceso_pct / maxPct) * 10
                  const intensity = 0.4 + (c.exceso_pct / maxPct) * 0.6
                  return (
                    <div key={ci} className='relative pl-7 pb-5'>
                      {/* Node */}
                      <div className='absolute left-0 top-1 flex items-center justify-center'
                        style={{ width: radius * 2, height: radius * 2, marginLeft: 8 - radius, borderRadius: '50%', background: `rgba(217,64,64,${intensity})`, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(217,64,64,0.3)' }}>
                        {radius > 10 && <span className='text-[8px] font-bold text-white'>!</span>}
                      </div>
                      {/* Content */}
                      <div>
                        <p className='text-[10px] opacity-40'>{c.fecha_inicio}{c.fecha_fin ? ` \u2014 ${c.fecha_fin}` : ''}</p>
                        <div className='flex items-center gap-2 mt-0.5'>
                          <p className='text-xs font-bold'>{c.expediente}</p>
                          <span className='text-[11px] font-bold px-2 py-0.5 rounded shrink-0' style={{ background: `rgba(217,64,64,${intensity})`, color: '#fff' }}>+{c.exceso_pct}%</span>
                        </div>
                      </div>
                      <span className='text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-1' style={{ background: '#b71c1c', color: '#fff' }}>{c.estado}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )
        })()}

        {/* ── Old denuncias (legacy data, shown if no sobreproduccion match) ── */}
        {!hasSobreprod && denuncias && denuncias.length > 0 && (
          <>
            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-2'>Sobreproduccion</p>
            {denuncias.map((d, i) => {
              const auth = parseFloat(d['Produccion autorizada (Ton)']) || 0
              const real = parseFloat(d['Produccion ciclo (Ton)']) || 0
              const pct = auth > 0 ? Math.round(((real - auth) / auth) * 100) : 0
              return (
                <div key={i} className='py-2 border-b border-current/10'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-xs font-bold'>Denuncia {i + 1}</span>
                    <span className='text-[10px] font-bold px-1.5 py-0.5 rounded' style={{ background: '#d94040', color: '#fff' }}>+{pct}% exceso</span>
                  </div>
                  <FichaRow label='Fecha denuncia' value={d['Fecha Denuncia']?.split('T')[0]} />
                  <FichaRow label='Produccion autorizada' value={auth.toLocaleString() + ' ton'} />
                  <FichaRow label='Produccion real' value={real.toLocaleString() + ' ton'} />
                  <FichaRow label='Exceso' value={(real - auth).toLocaleString() + ' ton'} />
                  <FichaRow label='Ciclo' value={(d['Inicio Ciclo Productivo']?.split('T')[0] || '') + ' \u2192 ' + (d['Termino de Ciclo Productivo']?.split('T')[0] || '')} />
                </div>
              )
            })}
          </>
        )}

        {/* ── RELOCALIZACIONES section ── */}
        {hasReloc && (
          <>
            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Solicitud de relocalizacion</p>
            {relocalizaciones.map((r, ri) => (
              <div key={ri} className='py-2 border-b border-current/10'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-xs font-bold'>{r.holding}</span>
                </div>
                <FichaRow label='Centros' value={r.centros.join(', ')} />
                <FichaRow label='Fecha solicitud' value={r.fecha_ingreso} />
                <FichaRow label='Tipo' value={r.tipo_relocalizacion} />
                <FichaRow label='Estado tramite' value={r.estado_tramite} />
                {r.invocacion_preferencia && r.invocacion_preferencia !== 'NO' && (
                  <FichaRow label='Preferencia' value={r.invocacion_preferencia} />
                )}
                <FichaRow label='Superficie' value={r.superficie_ha ? r.superficie_ha + ' ha' : null} />
              </div>
            ))}
          </>
        )}

        {/* ── Location ── */}
        <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Ubicacion</p>
        <FichaRow label='Comuna' value={centro.COMUNA} />
        <FichaRow label='Region' value={centro.REGION} />
        <FichaRow label='Fecha resolucion' value={centro.F_RESOLSSF} />

        {/* ── Concession details ── */}
        {concesion && (
          <>
            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Concesionario</p>
            <FichaRow label='Titular' value={concesion['nombre titular'] || concesion.Titular} />
            <FichaRow label='RUT' value={concesion['rut titular']} />

            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Concesion</p>
            <FichaRow label='Toponimio' value={concesion.Toponimio} />
            <FichaRow label='Especies' value={concesion.Especies} />
            <FichaRow label='Grupo especie' value={concesion['Grupo Especie']} />
            <FichaRow label='Superficie' value={concesion.superficieTotal ? concesion.superficieTotal + ' ha' : null} />
            <FichaRow label='Barrio' value={concesion.barrio} />
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function MapaConflicto() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dataRef = useRef({ concMap: {}, denMap: {}, ampPolygons: [], centrosByCode: {}, spMap: {}, relocMap: {} })
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ centros: true, amp: true, sobreproduccion: true, relocalizacion: true })
  const [stats, setStats] = useState({ conflict: 0, denuncia: 0, both: 0, sobreproduccion: 0, relocalizacion: 0 })
  const [selected, setSelected] = useState(null)
  const [ranking, setRanking] = useState([])
  const [rankIndex, setRankIndex] = useState(0)

  const rankingRef = useRef([])

  const selectByCode = useCallback((code) => {
    const { concMap, denMap, ampPolygons, centrosByCode, spMap, relocMap } = dataRef.current
    const props = centrosByCode[code]
    if (!props) return
    const concesion = concMap[code] || null
    const denuncias = denMap[code] || []
    const sobreproduccion = spMap[code] || []
    const relocalizaciones = relocMap[code] || []
    const isConflict = props._conflict === true || props._conflict === 'true'
    const hasDenuncia = denuncias.length > 0

    let ampName = null
    if (isConflict) {
      const coords = [parseFloat(props._lng), parseFloat(props._lat)]
      const pt = point(coords)
      for (const amp of ampPolygons) {
        try { if (booleanPointInPolygon(pt, amp)) { ampName = amp.properties.NOMBRE; break } } catch (e) {}
      }
    }
    setSelected({ centro: props, concesion, denuncias, ampName, isConflict, hasDenuncia, sobreproduccion, relocalizaciones })

    if (mapRef.current && props._lng && props._lat) {
      const lng = parseFloat(props._lng)
      const lat = parseFloat(props._lat)
      mapRef.current.flyTo({ center: [lng + 0.15, lat + 0.1], zoom: 9, duration: 1200 })
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
    // Find holding that contains this code
    const { spMap } = dataRef.current
    const sp = spMap[code]
    if (sp && sp.length > 0) {
      const holding = sp[0].titular
      const ri = rankingRef.current.findIndex(r => r.holding === holding)
      setRankIndex(ri >= 0 ? ri : -1)
    } else {
      setRankIndex(-1)
    }
  }, [selectByCode])

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current, style: MAP_STYLE,
      center: [-73.2, -43.5], zoom: 7, attributionControl: false,
    })
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.scrollZoom.disable()

    mapRef.current.on('load', async () => {
      const [ampResp, centrosResp, concResp, denResp, spResp, relocResp] = await Promise.all([
        fetch(BASE + 'data/amp_nacional.topojson').then(r => r.json()),
        fetch(BASE + 'data/centros_salmoneros.geojson').then(r => r.json()),
        fetch(BASE + 'data/concesiones_excel.json').then(r => r.json()),
        fetch(BASE + 'data/denuncias.json').then(r => r.json()),
        fetch(BASE + 'data/sobreproduccion.json').then(r => r.json()),
        fetch(BASE + 'data/relocalizaciones.json').then(r => r.json()),
      ])

      const ampGeo = feature(ampResp, ampResp.objects.amp)
      const ampPolygons = ampGeo.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')

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

      // Relocalizaciones lookup (by each centro code)
      const relocMap = {}
      const relocCodes = new Set()
      relocResp.forEach(r => {
        for (const c of r.centros) {
          const code = String(parseInt(c))
          if (!relocMap[code]) relocMap[code] = []
          relocMap[code].push(r)
          relocCodes.add(code)
        }
      })

      // Build ranking by HOLDING — sorted by number of sanction processes (most to least)
      const holdingMap = {}
      spResp.forEach(sp => {
        if (!sp.codigo_centro || !sp.titular) return
        const holding = sp.titular
        if (!holdingMap[holding]) holdingMap[holding] = { holding, codes: new Set(), procesos: 0 }
        holdingMap[holding].codes.add(String(sp.codigo_centro))
        holdingMap[holding].procesos++
      })
      // For each holding, pick the first centro code as representative
      const holdingRanking = Object.values(holdingMap)
        .sort((a, b) => b.procesos - a.procesos)
        .map(h => ({ holding: h.holding, code: [...h.codes][0], procesos: h.procesos, centros: h.codes.size }))
      rankingRef.current = holdingRanking
      setRanking(holdingRanking)

      // Classify centros
      let sConflict = 0, sDenuncia = 0, sBoth = 0
      const buckets = { normal: [], denuncia: [], conflict: [], conflict_denuncia: [] }
      const centrosByCode = {}
      const spFeatures = []
      const relocFeatures = []

      for (const centro of centrosResp.features) {
        centro.properties._lng = centro.geometry.coordinates[0]
        centro.properties._lat = centro.geometry.coordinates[1]
        const code = String(parseInt(centro.properties.N_CODIGOCE))
        centrosByCode[code] = centro.properties

        const pt = point(centro.geometry.coordinates)
        let inside = false
        for (const amp of ampPolygons) {
          try { if (booleanPointInPolygon(pt, amp)) { inside = true; break } } catch (e) {}
        }
        centro.properties._conflict = inside
        const hasDen = !!denMap[code]
        buckets[getCategory(inside, hasDen)].push(centro)
        if (inside && hasDen) sBoth++
        else if (inside) sConflict++
        else if (hasDen) sDenuncia++

        // Collect features for new layers
        if (spCodes.has(code)) {
          spFeatures.push({ ...centro, properties: { ...centro.properties, _layer: 'sobreproduccion' } })
        }
        if (relocCodes.has(code)) {
          relocFeatures.push({ ...centro, properties: { ...centro.properties, _layer: 'relocalizacion' } })
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

      setStats({ conflict: sConflict, denuncia: sDenuncia, both: sBoth, sobreproduccion: spCodes.size, relocalizacion: relocCodes.size })
      dataRef.current = { concMap, denMap, ampPolygons, centrosByCode, spMap, relocMap }

      // Insert data layers BEFORE first label so CARTO labels render on top
      const allLayers = mapRef.current.getStyle().layers
      const firstSym = allLayers.find(l => l.type === 'symbol')
      const B = firstSym ? firstSym.id : undefined
      console.log('[MapaConflicto] beforeId =', B, '| layers:', allLayers.length, '| symbols:', allLayers.filter(l => l.type === 'symbol').length)

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
        normal:            { fill: '#d94040', stroke: '#ffffff' },
        denuncia:          { fill: '#d94040', stroke: '#ffd600' },
        conflict:          { fill: '#ff8c00', stroke: '#ffffff' },
        conflict_denuncia: { fill: '#ff8c00', stroke: '#ffd600' },
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

      // Relocalizacion layer
      mapRef.current.addSource('src-relocalizacion', { type: 'geojson', data: { type: 'FeatureCollection', features: relocFeatures } })
      mapRef.current.addLayer({
        id: 'layer-relocalizacion', type: 'circle', source: 'src-relocalizacion',
        paint: { ...CIRCLE_STYLE, 'circle-color': '#1565c0', 'circle-stroke-color': '#ffffff',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 8, 7, 12, 10] },
      }, B)
      mapRef.current.on('click', 'layer-relocalizacion', (e) => handleCentroClick(e.features[0].properties))
      mapRef.current.on('mouseenter', 'layer-relocalizacion', () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'layer-relocalizacion', () => { mapRef.current.getCanvas().style.cursor = '' })

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

      // Select first in ranking
      if (holdingRanking.length > 0) {
        selectByCode(holdingRanking[0].code)
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
        for (const cat of ['normal', 'denuncia', 'conflict', 'conflict_denuncia']) {
          if (mapRef.current.getLayer('layer-' + cat)) mapRef.current.setLayoutProperty('layer-' + cat, 'visibility', vis)
        }
      } else if (id === 'amp') {
        mapRef.current.setLayoutProperty('amp-fill', 'visibility', vis)
        mapRef.current.setLayoutProperty('amp-outline', 'visibility', vis)
      } else if (id === 'sobreproduccion') {
        if (mapRef.current.getLayer('layer-sobreproduccion')) mapRef.current.setLayoutProperty('layer-sobreproduccion', 'visibility', vis)
      } else if (id === 'relocalizacion') {
        if (mapRef.current.getLayer('layer-relocalizacion')) mapRef.current.setLayoutProperty('layer-relocalizacion', 'visibility', vis)
      }
    }
  }

  const currentRankIndex = useMemo(() => {
    if (!selected || !selected.sobreproduccion || selected.sobreproduccion.length === 0) return -1
    const holding = selected.sobreproduccion[0].titular
    return ranking.findIndex(r => r.holding === holding)
  }, [selected, ranking])

  return (
    <div className='flex h-full w-full' style={{ position: 'relative' }}>
      <div className={selected ? 'w-full md:w-3/5 relative' : 'w-full relative'}>
        <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {/* Legend */}
        <div className='absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 text-sm space-y-1.5'>
          <p className='text-[10px] font-bold uppercase tracking-wider text-[#1b3a4b]/50 mb-1'>Capas</p>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible.centros} onChange={() => toggleLayer('centros')} className='rounded accent-[#d94040]' />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Centros salmoneros</span>
          </label>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible.amp} onChange={() => toggleLayer('amp')} className='rounded accent-[#3a9e9e]' />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Areas marinas protegidas</span>
          </label>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible.sobreproduccion} onChange={() => toggleLayer('sobreproduccion')} className='rounded accent-[#b71c1c]' />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Sobreproduccion ({stats.sobreproduccion})</span>
          </label>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible.relocalizacion} onChange={() => toggleLayer('relocalizacion')} className='rounded accent-[#1565c0]' />
            <span className='text-[#1b3a4b]/80 text-xs font-medium'>Relocalizaciones ({stats.relocalizacion})</span>
          </label>

          <div className='pt-1.5 border-t border-[#1b3a4b]/10 space-y-1'>
            <div className='flex items-center gap-1.5'>
              <span className='w-3 h-3 rounded-full inline-block' style={{ background: '#d94040', border: '1.5px solid #fff' }} />
              <span className='text-[#1b3a4b]/60 text-[10px]'>Centro sin denuncia</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='w-3 h-3 rounded-full inline-block' style={{ background: '#ff8c00', border: '1.5px solid #fff' }} />
              <span className='text-[#1b3a4b]/60 text-[10px]'>En zona protegida ({stats.conflict})</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='w-3.5 h-3.5 rounded-full inline-block' style={{ background: '#b71c1c', border: '2px solid #ffd600' }} />
              <span className='text-[#1b3a4b]/60 text-[10px]'>Proc. sancionatorio ({stats.sobreproduccion})</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='w-3.5 h-3.5 rounded-full inline-block' style={{ background: '#1565c0', border: '2px solid #fff' }} />
              <span className='text-[#1b3a4b]/60 text-[10px]'>Solicitud relocalizacion ({stats.relocalizacion})</span>
            </div>
          </div>
        </div>

        {/* Mini map inset */}
        {selected && selected.centro._lng && (
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
          ? 'absolute bottom-0 left-0 right-0 h-[50%] md:relative md:h-auto md:w-2/5 z-20 shadow-lg md:shadow-none border-t md:border-t-0 md:border-l border-[#1b3a4b]/10'
          : 'hidden md:block md:relative md:w-2/5 border-l border-[#1b3a4b]/10'
      }>
        <FichaPanel
          selected={selected}
          ranking={ranking}
          rankIndex={currentRankIndex}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  )
}
