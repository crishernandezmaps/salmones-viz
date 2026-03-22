import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const WARNING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="%23ff8c00" stroke="%23fff" stroke-width="1.5"/><text x="12" y="19" text-anchor="middle" font-size="14" font-weight="bold" fill="%23fff">!</text></svg>`
const WARNING_IMG = 'data:image/svg+xml;charset=utf-8,' + WARNING_SVG

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

  const { centro, concesion, ampName, isConflict } = selected

  return (
    <div
      className='h-full overflow-y-auto'
      style={{
        background: isConflict ? '#fff3e0' : '#fff',
        color: isConflict ? '#4a2800' : '#1b3a4b',
      }}
    >
      {/* Header */}
      <div
        className='sticky top-0 z-10 px-4 py-3 flex items-center justify-between'
        style={{
          background: isConflict ? '#ff8c00' : '#3a9e9e',
          color: '#fff',
        }}
      >
        <div>
          <p className='text-xs opacity-80'>Centro de cultivo</p>
          <p className='text-lg font-bold'>{centro.N_CODIGOCE?.replace('.0', '')}</p>
        </div>
        <button onClick={onClose} className='w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-sm'>✕</button>
      </div>

      {/* Conflict warning */}
      {isConflict && (
        <div className='px-4 py-2 flex items-center gap-2' style={{ background: '#ffe0b2' }}>
          <span className='text-lg'>⚠</span>
          <div>
            <p className='text-xs font-bold' style={{ color: '#e65100' }}>DENTRO DE ÁREA PROTEGIDA</p>
            {ampName && <p className='text-xs opacity-70'>{ampName}</p>}
          </div>
        </div>
      )}

      {/* Centro info */}
      <div className='px-4 py-2' style={{ color: isConflict ? '#4a2800' : '#1b3a4b' }}>
        <p className='text-xs font-bold uppercase tracking-wider opacity-40 mb-1 mt-2'>Ubicación</p>
        <FichaRow label='Comuna' value={centro.COMUNA} />
        <FichaRow label='Región' value={centro.REGION} />
        <FichaRow label='Fecha resolución' value={centro.F_RESOLSSF} />
        <FichaRow label='Fecha fin' value={centro['FECHA FIN']} />

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
      </div>
    </div>
  )
}

export default function MapaConflicto() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const concesionesRef = useRef([])
  const ampGeoRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ centros: true, amp: true })
  const [conflictCount, setConflictCount] = useState(0)
  const [selected, setSelected] = useState(null)

  const handleCentroClick = useCallback((props) => {
    const code = String(parseInt(props.N_CODIGOCE))
    const concMap = concesionesRef.current
    const concesion = concMap[code] || null
    const isConflict = props._conflict === true || props._conflict === 'true'

    // Find which AMP it's in
    let ampName = null
    if (isConflict && ampGeoRef.current) {
      const coords = [parseFloat(props._lng), parseFloat(props._lat)]
      const pt = point(coords)
      for (const amp of ampGeoRef.current) {
        try {
          if (booleanPointInPolygon(pt, amp)) {
            ampName = amp.properties.NOMBRE
            break
          }
        } catch (e) {}
      }
    }

    setSelected({ centro: props, concesion, ampName, isConflict })
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
      // Load all data
      const [ampResp, centrosResp, concResp] = await Promise.all([
        fetch(BASE + 'data/amp_nacional.topojson').then(r => r.json()),
        fetch(BASE + 'data/centros_salmoneros.geojson').then(r => r.json()),
        fetch(BASE + 'data/concesiones_excel.json').then(r => r.json()),
      ])

      const ampGeo = feature(ampResp, ampResp.objects.amp)
      ampGeoRef.current = ampGeo.features.filter(f =>
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      )

      // Build concesiones lookup
      const concMap = {}
      concResp.forEach(c => {
        const code = c['Codigo Centro'] || c['Código Centro']
        if (code) concMap[String(parseInt(code))] = c
      })
      concesionesRef.current = concMap

      // Detect conflicts + store coords in properties for later lookup
      let conflicts = 0
      for (const centro of centrosResp.features) {
        centro.properties._lng = centro.geometry.coordinates[0]
        centro.properties._lat = centro.geometry.coordinates[1]
        const pt = point(centro.geometry.coordinates)
        let inside = false
        for (const amp of ampGeoRef.current) {
          try {
            if (booleanPointInPolygon(pt, amp)) { inside = true; break }
          } catch (e) {}
        }
        centro.properties._conflict = inside
        if (inside) conflicts++
      }
      setConflictCount(conflicts)

      const normalFeatures = centrosResp.features.filter(f => !f.properties._conflict)
      const conflictFeatures = centrosResp.features.filter(f => f.properties._conflict)

      // AMP layers
      mapRef.current.addSource('amp', { type: 'geojson', data: ampGeo })
      mapRef.current.addLayer({ id: 'amp-fill', type: 'fill', source: 'amp', paint: { 'fill-color': '#3a9e9e', 'fill-opacity': 0.3 } })
      mapRef.current.addLayer({ id: 'amp-outline', type: 'line', source: 'amp', paint: { 'line-color': '#2a7a7a', 'line-width': 1.5 } })

      // Normal centros
      mapRef.current.addSource('centros', { type: 'geojson', data: { type: 'FeatureCollection', features: normalFeatures } })
      mapRef.current.addLayer({
        id: 'centros-heat', type: 'heatmap', source: 'centros',
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
      mapRef.current.addLayer({
        id: 'centros-pts', type: 'circle', source: 'centros',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 4, 12, 7],
          'circle-color': '#d94040',
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.8],
          'circle-stroke-width': 0,
        },
      })

      // Conflict icons
      const img = new Image(24, 24)
      img.onload = () => {
        mapRef.current.addImage('warning-icon', img)
        mapRef.current.addSource('conflicts', { type: 'geojson', data: { type: 'FeatureCollection', features: conflictFeatures } })
        mapRef.current.addLayer({
          id: 'conflicts-icon', type: 'symbol', source: 'conflicts',
          layout: { 'icon-image': 'warning-icon', 'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.4, 8, 0.7, 12, 1], 'icon-allow-overlap': true },
        })
      }
      img.src = WARNING_IMG

      // Click → ficha panel (no popup)
      mapRef.current.on('click', 'centros-pts', (e) => handleCentroClick(e.features[0].properties))
      mapRef.current.on('click', 'conflicts-icon', (e) => handleCentroClick(e.features[0].properties))

      ;['centros-pts', 'conflicts-icon', 'amp-fill'].forEach(id => {
        mapRef.current.on('mouseenter', id, () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
        mapRef.current.on('mouseleave', id, () => { mapRef.current.getCanvas().style.cursor = '' })
      })

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
        mapRef.current.setLayoutProperty('centros-pts', 'visibility', vis)
        if (mapRef.current.getLayer('conflicts-icon')) mapRef.current.setLayoutProperty('conflicts-icon', 'visibility', vis)
      } else {
        mapRef.current.setLayoutProperty(id + '-fill', 'visibility', vis)
        mapRef.current.setLayoutProperty(id + '-outline', 'visibility', vis)
      }
    }
  }

  const layersDef = [
    { id: 'centros', label: 'Centros Salmoneros (1.346)', color: '#d94040' },
    { id: 'amp', label: 'Áreas Marinas Protegidas (32)', color: '#3a9e9e' },
  ]

  return (
    <div className='flex h-full w-full' style={{ position: 'relative' }}>
      {/* Map — left side on desktop, full on mobile */}
      <div className={selected ? 'w-full md:w-3/5 relative' : 'w-full relative'}>
        <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {/* Layer toggle */}
        <div className='absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 text-sm space-y-2'>
          {layersDef.map(layer => (
            <label key={layer.id} className='flex items-center gap-2 cursor-pointer'>
              <input type='checkbox' checked={visible[layer.id]} onChange={() => toggleLayer(layer.id)} className='rounded accent-[#3a9e9e]' />
              <span className='w-3 h-3 rounded-full inline-block' style={{ backgroundColor: layer.color }} />
              <span className='text-[#1b3a4b]/80 text-xs sm:text-sm'>{layer.label}</span>
            </label>
          ))}
          {conflictCount > 0 && (
            <div className='pt-1.5 border-t border-[#1b3a4b]/10 flex items-center gap-1.5'>
              <span style={{ color: '#ff8c00', fontSize: 14 }}>⚠</span>
              <span className='text-[#1b3a4b]/70 text-xs'>
                <strong style={{ color: '#ff8c00' }}>{conflictCount}</strong> en áreas protegidas
              </span>
            </div>
          )}
        </div>

        {!loaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-[#f0f4f3] z-20'>
            <p className='text-[#1b3a4b]/40'>Cargando capas...</p>
          </div>
        )}
      </div>

      {/* Ficha panel — right side on desktop, bottom sheet on mobile */}
      {selected && (
        <div className='absolute bottom-0 left-0 right-0 h-[45%] md:relative md:h-auto md:w-2/5 z-20 shadow-lg md:shadow-none border-t md:border-t-0 md:border-l border-[#1b3a4b]/10'>
          <FichaPanel selected={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
