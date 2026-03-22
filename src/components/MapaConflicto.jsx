import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

// 4 icon types as SVG data URLs
function makeSVG(fill, stroke, symbol) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">` +
    (symbol === 'triangle'
      ? `<polygon points="14,2 26,26 2,26" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : `<circle cx="14" cy="14" r="11" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`) +
    (symbol === 'triangle'
      ? `<text x="14" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">!</text>`
      : '') +
    `</svg>`
  )
}

const ICONS = {
  normal:           { svg: makeSVG('#d94040', '#fff', 'circle'),   label: 'Sin denuncia' },
  denuncia:         { svg: makeSVG('#d94040', '#ffd600', 'circle'), label: 'Con denuncia' },
  conflict:         { svg: makeSVG('#ff8c00', '#fff', 'triangle'), label: 'En zona protegida' },
  conflict_denuncia:{ svg: makeSVG('#ff8c00', '#ffd600', 'triangle'), label: 'Zona protegida + denuncia' },
}

// Category for each centro
function getCategory(isConflict, hasDenuncia) {
  if (isConflict && hasDenuncia) return 'conflict_denuncia'
  if (isConflict) return 'conflict'
  if (hasDenuncia) return 'denuncia'
  return 'normal'
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

function FichaPanel({ selected, onClose }) {
  if (!selected) {
    return (
      <div className='h-full flex items-center justify-center p-6'>
        <p className='text-[#1b3a4b]/30 text-sm text-center'>
          Haz click en un punto del mapa para ver la ficha completa del centro
        </p>
      </div>
    )
  }

  const { centro, concesion, denuncias, ampName, isConflict, hasDenuncia } = selected
  const isCritical = isConflict || hasDenuncia

  const headerBg = isConflict && hasDenuncia ? '#c62828'
    : isConflict ? '#ff8c00'
    : hasDenuncia ? '#d94040'
    : '#3a9e9e'

  return (
    <div
      className='h-full overflow-y-auto'
      style={{
        background: isConflict ? '#fff3e0' : hasDenuncia ? '#fff5f5' : '#fff',
        color: isConflict ? '#4a2800' : hasDenuncia ? '#4a1010' : '#1b3a4b',
      }}
    >
      {/* Header */}
      <div className='sticky top-0 z-10 px-4 py-3 flex items-center justify-between' style={{ background: headerBg, color: '#fff' }}>
        <div>
          <p className='text-xs opacity-80'>Centro de cultivo</p>
          <p className='text-lg font-bold'>{centro.N_CODIGOCE?.replace('.0', '')}</p>
        </div>
        <button onClick={onClose} className='w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-sm'>✕</button>
      </div>

      {/* Alerts */}
      {isConflict && (
        <div className='px-4 py-2 flex items-center gap-2' style={{ background: '#ffe0b2' }}>
          <span className='text-lg'>⚠</span>
          <div>
            <p className='text-xs font-bold' style={{ color: '#e65100' }}>DENTRO DE ÁREA PROTEGIDA</p>
            {ampName && <p className='text-xs opacity-70'>{ampName}</p>}
          </div>
        </div>
      )}
      {hasDenuncia && (
        <div className='px-4 py-2 flex items-center gap-2' style={{ background: isConflict ? '#ffccbc' : '#ffcdd2' }}>
          <span className='text-lg'>🔴</span>
          <div>
            <p className='text-xs font-bold' style={{ color: '#b71c1c' }}>DENUNCIA POR SOBREPRODUCCIÓN</p>
            <p className='text-xs opacity-70'>{denuncias.length} denuncia{denuncias.length > 1 ? 's' : ''} registrada{denuncias.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <div className='px-4 py-2'>
        {/* Ubicación */}
        <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-2'>Ubicación</p>
        <FichaRow label='Comuna' value={centro.COMUNA} />
        <FichaRow label='Región' value={centro.REGION} />
        <FichaRow label='Fecha resolución' value={centro.F_RESOLSSF} />
        <FichaRow label='Fecha fin' value={centro['FECHA FIN']} />

        {/* Concesionario */}
        {concesion && (
          <>
            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Concesionario</p>
            <FichaRow label='Titular' value={concesion['nombre titular'] || concesion.Titular} />
            <FichaRow label='RUT' value={concesion['rut titular']} />
            <FichaRow label='Holding' value={concesion.Holding || concesion['Holding (columna manual)']} />

            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Concesión</p>
            <FichaRow label='Toponimio' value={concesion.Toponimio} />
            <FichaRow label='Especies' value={concesion.Especies} />
            <FichaRow label='Grupo especie' value={concesion['Grupo Especie']} />
            <FichaRow label='Superficie' value={concesion.superficieTotal ? concesion.superficieTotal + ' ha' : null} />
            <FichaRow label='Tipo porción' value={concesion['Tipo Porcion']} />
            <FichaRow label='Barrio' value={concesion.barrio} />
            <FichaRow label='Tipo barrio' value={concesion['Tipo Barrio']} />

            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Resoluciones</p>
            <FichaRow label='N° Resolución SSP' value={concesion['Numero\nResSSP']?.replace('.0', '')} />
            <FichaRow label='Fecha SSP' value={concesion['Fecha ResSSP']?.split('T')[0]} />
            <FichaRow label='Estado' value={concesion['Estado Resolucion SSP']} />
            <FichaRow label='N° Resolución SSFFAA' value={concesion['Numero\nResSSFFAA']?.replace('.0', '')} />
            <FichaRow label='Fecha SSFFAA' value={concesion['Fecha ResSSFFAA']?.split('T')[0]} />
            <FichaRow label='Resultado SSFFAA' value={concesion['Resultado\nResolucion\nSSFFAA']} />
          </>
        )}

        {/* Denuncias */}
        {denuncias && denuncias.length > 0 && (
          <>
            <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-4'>Denuncias por sobreproducción</p>
            {denuncias.map((d, i) => {
              const auth = parseFloat(d['Producción autorizada (Ton)']) || 0
              const real = parseFloat(d['Producción ciclo (Ton)']) || 0
              const pct = auth > 0 ? Math.round(((real - auth) / auth) * 100) : 0
              return (
                <div key={i} className='py-2 border-b border-current/10'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-xs font-bold'>Denuncia {i + 1}</span>
                    <span className='text-[10px] font-bold px-1.5 py-0.5 rounded' style={{ background: '#d94040', color: '#fff' }}>+{pct}% exceso</span>
                  </div>
                  <FichaRow label='Fecha denuncia' value={d['Fecha Denuncia']?.split('T')[0]} />
                  <FichaRow label='Producción autorizada' value={auth.toLocaleString() + ' ton'} />
                  <FichaRow label='Producción real' value={real.toLocaleString() + ' ton'} />
                  <FichaRow label='Exceso' value={(real - auth).toLocaleString() + ' ton'} />
                  <FichaRow label='Ciclo' value={(d['Inicio Ciclo Productivo']?.split('T')[0] || '') + ' → ' + (d['Término de Ciclo Productivo']?.split('T')[0] || '')} />
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default function MapaConflicto() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dataRef = useRef({ concMap: {}, denMap: {}, ampPolygons: [] })
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ centros: true, amp: true })
  const [stats, setStats] = useState({ conflict: 0, denuncia: 0, both: 0 })
  const [selected, setSelected] = useState(null)

  const handleCentroClick = useCallback((props) => {
    const code = String(parseInt(props.N_CODIGOCE))
    const { concMap, denMap, ampPolygons } = dataRef.current
    const concesion = concMap[code] || null
    const denuncias = denMap[code] || []
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

    setSelected({ centro: props, concesion, denuncias, ampName, isConflict, hasDenuncia })
  }, [])

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-73.2, -43.5],
      zoom: 7,
      attributionControl: false,
    })
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.scrollZoom.disable()

    mapRef.current.on('load', async () => {
      const [ampResp, centrosResp, concResp, denResp] = await Promise.all([
        fetch(BASE + 'data/amp_nacional.topojson').then(r => r.json()),
        fetch(BASE + 'data/centros_salmoneros.geojson').then(r => r.json()),
        fetch(BASE + 'data/concesiones_excel.json').then(r => r.json()),
        fetch(BASE + 'data/denuncias.json').then(r => r.json()),
      ])

      const ampGeo = feature(ampResp, ampResp.objects.amp)
      const ampPolygons = ampGeo.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')

      // Build lookups
      const concMap = {}
      concResp.forEach(c => {
        const code = c['Codigo Centro'] || c['Código Centro']
        if (code) concMap[String(parseInt(code))] = c
      })
      const denMap = {}
      denResp.forEach(d => {
        const code = String(parseInt(d['Código de Centro']))
        if (!denMap[code]) denMap[code] = []
        denMap[code].push(d)
      })
      dataRef.current = { concMap, denMap, ampPolygons }

      // Classify each centro
      let sConflict = 0, sDenuncia = 0, sBoth = 0
      const buckets = { normal: [], denuncia: [], conflict: [], conflict_denuncia: [] }

      for (const centro of centrosResp.features) {
        centro.properties._lng = centro.geometry.coordinates[0]
        centro.properties._lat = centro.geometry.coordinates[1]
        const code = String(parseInt(centro.properties.N_CODIGOCE))

        // Check AMP
        const pt = point(centro.geometry.coordinates)
        let inside = false
        for (const amp of ampPolygons) {
          try { if (booleanPointInPolygon(pt, amp)) { inside = true; break } } catch (e) {}
        }
        centro.properties._conflict = inside

        const hasDen = !!denMap[code]
        const cat = getCategory(inside, hasDen)
        buckets[cat].push(centro)

        if (inside && hasDen) sBoth++
        else if (inside) sConflict++
        else if (hasDen) sDenuncia++
      }
      setStats({ conflict: sConflict, denuncia: sDenuncia, both: sBoth })

      // AMP layers
      mapRef.current.addSource('amp', { type: 'geojson', data: ampGeo })
      mapRef.current.addLayer({ id: 'amp-fill', type: 'fill', source: 'amp', paint: { 'fill-color': '#3a9e9e', 'fill-opacity': 0.3 } })
      mapRef.current.addLayer({ id: 'amp-outline', type: 'line', source: 'amp', paint: { 'line-color': '#2a7a7a', 'line-width': 1.5 } })

      // Heatmap for all centros
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
      })

      // Load 4 icon images then add symbol layers
      const iconEntries = Object.entries(ICONS)
      let loadedIcons = 0
      for (const [key, { svg }] of iconEntries) {
        const img = new Image(28, 28)
        img.onload = () => {
          mapRef.current.addImage('icon-' + key, img)
          loadedIcons++
          if (loadedIcons === iconEntries.length) {
            // Add all 4 symbol layers
            for (const [cat, feats] of Object.entries(buckets)) {
              mapRef.current.addSource('src-' + cat, { type: 'geojson', data: { type: 'FeatureCollection', features: feats } })
              mapRef.current.addLayer({
                id: 'layer-' + cat, type: 'symbol', source: 'src-' + cat,
                layout: {
                  'icon-image': 'icon-' + cat,
                  'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.35, 8, 0.6, 12, 0.9],
                  'icon-allow-overlap': true,
                },
              })
              mapRef.current.on('click', 'layer-' + cat, (e) => handleCentroClick(e.features[0].properties))
              mapRef.current.on('mouseenter', 'layer-' + cat, () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
              mapRef.current.on('mouseleave', 'layer-' + cat, () => { mapRef.current.getCanvas().style.cursor = '' })
            }
          }
        }
        img.src = svg
      }

      mapRef.current.on('mouseenter', 'amp-fill', () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'amp-fill', () => { mapRef.current.getCanvas().style.cursor = '' })

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [handleCentroClick])

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
      } else {
        mapRef.current.setLayoutProperty(id + '-fill', 'visibility', vis)
        mapRef.current.setLayoutProperty(id + '-outline', 'visibility', vis)
      }
    }
  }

  return (
    <div className='flex h-full w-full' style={{ position: 'relative' }}>
      <div className={selected ? 'w-full md:w-3/5 relative' : 'w-full relative'}>
        <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {/* Legend */}
        <div className='absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 text-sm space-y-1.5'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible.centros} onChange={() => toggleLayer('centros')} className='rounded accent-[#3a9e9e]' />
            <span className='text-[#1b3a4b]/80 text-xs sm:text-sm font-medium'>Centros Salmoneros</span>
          </label>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible.amp} onChange={() => toggleLayer('amp')} className='rounded accent-[#3a9e9e]' />
            <span className='text-[#1b3a4b]/80 text-xs sm:text-sm font-medium'>Áreas Marinas Protegidas</span>
          </label>

          <div className='pt-1.5 border-t border-[#1b3a4b]/10 space-y-1'>
            <div className='flex items-center gap-1.5'>
              <span className='w-3 h-3 rounded-full inline-block' style={{ background: '#d94040' }} />
              <span className='text-[#1b3a4b]/60 text-[10px]'>Sin denuncia</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='w-3 h-3 rounded-full inline-block border-2' style={{ background: '#d94040', borderColor: '#ffd600' }} />
              <span className='text-[#1b3a4b]/60 text-[10px]'>Con denuncia ({stats.denuncia})</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-[10px]'>🔶</span>
              <span className='text-[#1b3a4b]/60 text-[10px]'>En zona protegida ({stats.conflict})</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-[10px]'>🔶</span>
              <span className='text-[10px]' style={{ color: '#c62828', fontWeight: 700 }}>Zona protegida + denuncia ({stats.both})</span>
            </div>
          </div>
        </div>

        {!loaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-[#f0f4f3] z-20'>
            <p className='text-[#1b3a4b]/40'>Cargando capas...</p>
          </div>
        )}
      </div>

      {selected && (
        <div className='absolute bottom-0 left-0 right-0 h-[45%] md:relative md:h-auto md:w-2/5 z-20 shadow-lg md:shadow-none border-t md:border-t-0 md:border-l border-[#1b3a4b]/10'>
          <FichaPanel selected={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
