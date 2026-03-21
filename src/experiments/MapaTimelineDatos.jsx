import { useEffect, useRef, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'

const YEAR_MIN = 1985
const YEAR_MAX = 2025

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const REGIONS = [
  { id: 'los-lagos', label: 'Los Lagos', center: [-72.8, -42.8], zoom: 6.5, filter: 'LOS LAGOS' },
  { id: 'aysen', label: 'Aysén', center: [-73.5, -45.5], zoom: 6, filter: 'AYSÉN' },
  { id: 'magallanes', label: 'Magallanes', center: [-73.0, -52.0], zoom: 6, filter: 'MAGALLANES' },
]

function RegionMap({ region, visibleCentros, classifiedCentros, currentYear, globalMaxVal }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const sourcesReady = useRef(false)

  const regionCentros = useMemo(() => {
    return visibleCentros.filter(f => (f.properties.REGION || '').toUpperCase().includes(region.filter))
  }, [visibleCentros, region.filter])

  const allRegionCentros = useMemo(() => {
    return classifiedCentros.filter(f => (f.properties.REGION || '').toUpperCase().includes(region.filter))
  }, [classifiedCentros, region.filter])

  const counts = useMemo(() => {
    let salmonOtros = 0, soloSalmon = 0
    regionCentros.forEach(f => {
      if (f.tipo === 'salmon_y_otros') salmonOtros++
      else soloSalmon++
    })
    return { salmonOtros, soloSalmon, total: salmonOtros + soloSalmon }
  }, [regionCentros])

  // Line chart data for this region
  const chartData = useMemo(() => {
    const years = []
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      const filtered = allRegionCentros.filter(f => f.year <= y)
      years.push({
        year: y,
        salmonOtros: filtered.filter(f => f.tipo === 'salmon_y_otros').length,
        soloSalmon: filtered.filter(f => f.tipo === 'solo_salmon').length,
      })
    }
    return years
  }, [allRegionCentros])

  const maxVal = globalMaxVal
  const slicedData = useMemo(() => chartData.filter(d => d.year <= currentYear), [chartData, currentYear])

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: region.center,
      zoom: region.zoom,
      pitch: window.innerWidth < 768 ? 65 : 50,
      maxPitch: 75,
      attributionControl: false,
    })
    // No zoom controls
    mapRef.current.scrollZoom.disable()
    if (window.innerWidth < 768) {
      mapRef.current.dragPan.disable()
      mapRef.current.touchZoomRotate.disable()
    }
    mapRef.current.on('load', () => {
      // Hide region/state labels from base map
      const style = mapRef.current.getStyle()
      style.layers.forEach(layer => {
        if (layer.id.includes('place') && (layer.id.includes('state') || layer.id.includes('region') || layer.id.includes('province'))) {
          mapRef.current.setLayoutProperty(layer.id, 'visibility', 'none')
        }
      })
      containerRef.current._mapLoaded = true
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !containerRef.current._mapLoaded) return

    const mkGJ = (feats) => ({
      type: 'FeatureCollection',
      features: feats.map(f => ({
        type: 'Feature', geometry: f.geometry,
        properties: { ...f.properties, tipo: f.tipo, weight: f.tipo === 'salmon_y_otros' ? 1.5 : 1 },
      })),
    })

    const allData = mkGJ(regionCentros)
    const otrosData = mkGJ(regionCentros.filter(f => f.tipo === 'salmon_y_otros'))
    const soloData = mkGJ(regionCentros.filter(f => f.tipo === 'solo_salmon'))

    if (sourcesReady.current) {
      mapRef.current.getSource('all').setData(allData)
      mapRef.current.getSource('otros').setData(otrosData)
      mapRef.current.getSource('solo').setData(soloData)
      return
    }

    mapRef.current.addSource('all', { type: 'geojson', data: allData })
    mapRef.current.addSource('otros', { type: 'geojson', data: otrosData })
    mapRef.current.addSource('solo', { type: 'geojson', data: soloData })

    mapRef.current.addLayer({
      id: 'heat', type: 'heatmap', source: 'all',
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.5, 12, 2],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 8, 22, 12, 30],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)', 0.1, 'rgba(91,158,166,0.15)', 0.25, 'rgba(86,145,165,0.3)',
          0.4, 'rgba(126,200,200,0.45)', 0.55, 'rgba(160,210,200,0.55)', 0.7, 'rgba(196,161,212,0.6)',
          0.85, 'rgba(180,220,210,0.75)', 1, 'rgba(126,200,200,0.9)',
        ],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0.45, 13, 0],
      },
    })

    mapRef.current.addLayer({
      id: 'pts-solo', type: 'circle', source: 'solo',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 5, 14, 8],
        'circle-color': '#7ec8c8',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.8],
        'circle-stroke-width': 0,
      },
    })

    mapRef.current.addLayer({
      id: 'pts-otros', type: 'circle', source: 'otros',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 10, 6, 14, 10],
        'circle-color': '#c4a1d4',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.9],
        'circle-stroke-width': 0,
      },
    })

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '220px' })
    const handleClick = (e) => {
      const p = e.features[0].properties
      popup.setLngLat(e.lngLat).setHTML(
        '<div style="font-size:12px;line-height:1.5;color:#1a202c"><b>Centro ' + (p.N_CODIGOCE || '') +
        '</b><br>Comuna: ' + (p.COMUNA || '') + '<br>Fecha: ' + (p.F_RESOLSSF || '') + '</div>'
      ).addTo(mapRef.current)
    }
    mapRef.current.on('click', 'pts-otros', handleClick)
    mapRef.current.on('click', 'pts-solo', handleClick)
    ;['pts-otros', 'pts-solo'].forEach(id => {
      mapRef.current.on('mouseenter', id, () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', id, () => { mapRef.current.getCanvas().style.cursor = '' })
    })

    sourcesReady.current = true
  }, [regionCentros])

  // SVG chart dimensions
  const CW = 240
  const CH = 80
  const cp = { t: 5, r: 5, b: 14, l: 28 }
  const pw = CW - cp.l - cp.r
  const ph = CH - cp.t - cp.b

  const mkLine = (data, key) =>
    data.map(d => {
      const x = cp.l + ((d.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
      const y = cp.t + ph - (d[key] / maxVal) * ph
      return `${x},${y}`
    }).join(' ')

  return (
    <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden' }} className='border-b md:border-b-0 md:border-r border-[#1b3a4b]/10'>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Region label — top left */}
      <div className='absolute top-2 left-2 bg-white/70 backdrop-blur-sm rounded px-2 py-1 z-10'>
        <p className='text-[#1b3a4b] font-bold text-xs'>{region.label}</p>
      </div>

      {/* Line chart + counts — bottom overlay */}
      <div className='absolute bottom-2 left-2 right-2 bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1.5 z-10'>
        <div className='flex items-center justify-between mb-1'>
          <div className='flex gap-3 text-[10px]'>
            <span className='text-[#1b3a4b]/50'>Concesiones</span>
            <div className='flex items-center gap-1'>
              <span className='w-1.5 h-1.5 rounded-full' style={{ background: '#9b6bb0' }} />
              <span className='text-[#1b3a4b]/60'>Salmón + Otros</span>
              <span style={{ color: '#9b6bb0' }} className='font-bold'>{counts.salmonOtros}</span>
            </div>
            <div className='flex items-center gap-1'>
              <span className='w-1.5 h-1.5 rounded-full' style={{ background: '#3a9e9e' }} />
              <span className='text-[#1b3a4b]/60'>Salmón</span>
              <span style={{ color: '#3a9e9e' }} className='font-bold'>{counts.soloSalmon}</span>
            </div>
          </div>
          <span className='text-[#1b3a4b] font-bold text-xs'>{counts.total}</span>
        </div>
        <svg width='100%' viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio='xMidYMid meet'>
          {[0, 0.5, 1].map(f => (
            <line key={f} x1={cp.l} y1={cp.t + (1 - f) * ph} x2={CW - cp.r} y2={cp.t + (1 - f) * ph} stroke='rgba(27,58,75,0.12)' strokeWidth='0.5' />
          ))}
          {[0, 1].map(f => (
            <text key={f} x={cp.l - 3} y={cp.t + (1 - f) * ph + 3} fill='rgba(27,58,75,0.4)' fontSize='8' textAnchor='end'>
              {Math.round(maxVal * f)}
            </text>
          ))}
          <polyline fill='none' stroke='#3a9e9e' strokeWidth='1.5' points={mkLine(slicedData, 'soloSalmon')} />
          <polyline fill='none' stroke='#9b6bb0' strokeWidth='1.5' points={mkLine(slicedData, 'salmonOtros')} />
          {slicedData.length > 0 && (() => {
            const last = slicedData[slicedData.length - 1]
            const x = cp.l + ((last.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
            const ys = cp.t + ph - (last.soloSalmon / maxVal) * ph
            const yo = cp.t + ph - (last.salmonOtros / maxVal) * ph
            return (<><circle cx={x} cy={ys} r='2.5' fill='#3a9e9e' /><circle cx={x} cy={yo} r='2.5' fill='#9b6bb0' /></>)
          })()}
          {[1985, 2005, 2025].map(y => (
            <text key={y} x={cp.l + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw} y={CH - 2} fill='rgba(27,58,75,0.35)' fontSize='7' textAnchor='middle'>{y}</text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export default function MapaTimelineDatos() {
  const [centros, setCentros] = useState([])
  const [concesionesData, setConcesionesData] = useState([])
  const [currentYear, setCurrentYear] = useState(YEAR_MIN)
  const [playing, setPlaying] = useState(false)
  const animRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch(import.meta.env.BASE_URL + 'data/centros_salmoneros.geojson').then(r => r.json()),
      fetch(import.meta.env.BASE_URL + 'data/concesiones_excel.json').then(r => r.json()),
    ]).then(([centrosGeo, concExcel]) => {
      setCentros(centrosGeo.features)
      setConcesionesData(concExcel)
    })
  }, [])

  const centrosWithYear = useMemo(() => {
    return centros.map(f => {
      const dateStr = f.properties.F_RESOLSSF
      let year = null
      if (dateStr) {
        const parts = dateStr.split('-')
        if (parts.length === 3) {
          const y = parts[2].length === 4 ? parseInt(parts[2]) : parseInt(parts[0])
          if (y >= 1980 && y <= 2030) year = y
        }
      }
      return { ...f, year }
    }).filter(f => f.year !== null)
  }, [centros])

  const classifiedCentros = useMemo(() => {
    const concMap = {}
    concesionesData.forEach(c => {
      const code = c['Codigo Centro'] || c['Código Centro']
      if (code) concMap[String(parseInt(code))] = c
    })
    return centrosWithYear.map(f => {
      const code = String(parseInt(f.properties.N_CODIGOCE))
      const conc = concMap[code]
      let tipo = 'solo_salmon'
      if (conc) {
        const grupo = (conc['Grupo Especie'] || '').toUpperCase()
        if (grupo.includes(',')) tipo = 'salmon_y_otros'
      }
      return { ...f, tipo }
    })
  }, [centrosWithYear, concesionesData])

  const visibleCentros = useMemo(() => classifiedCentros.filter(f => f.year <= currentYear), [classifiedCentros, currentYear])

  // Animation
  useEffect(() => {
    if (playing) {
      animRef.current = setInterval(() => {
        setCurrentYear(y => {
          if (y >= YEAR_MAX) { setPlaying(false); return YEAR_MAX }
          return y + 1
        })
      }, 400)
    }
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [playing])

  // Global chart for timeline bar
  const chartData = useMemo(() => {
    const years = []
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      const filtered = classifiedCentros.filter(f => f.year <= y)
      years.push({ year: y, total: filtered.length })
    }
    return years
  }, [classifiedCentros])
  const maxCount = useMemo(() => Math.max(...chartData.map(d => d.total), 1), [chartData])

  // Global max across all regions for consistent Y scale
  const globalMaxVal = useMemo(() => {
    let max = 1
    REGIONS.forEach(region => {
      const regionCentros = classifiedCentros.filter(f => (f.properties.REGION || '').toUpperCase().includes(region.filter))
      for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
        const filtered = regionCentros.filter(f => f.year <= y)
        const so = filtered.filter(f => f.tipo === 'salmon_y_otros').length
        const ss = filtered.filter(f => f.tipo === 'solo_salmon').length
        if (so > max) max = so
        if (ss > max) max = ss
      }
    })
    return max
  }, [classifiedCentros])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#f0f4f3' }}>
      {/* Three region columns — horizontal on desktop, vertical on mobile */}
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', overflow: 'hidden' }} className='flex-col md:flex-row'>
        {REGIONS.map(region => (
          <RegionMap
            key={region.id}
            region={region}
            visibleCentros={visibleCentros}
            classifiedCentros={classifiedCentros}
            currentYear={currentYear}
            globalMaxVal={globalMaxVal}
          />
        ))}
      </div>

      {/* Timeline — full width */}
      <div className='border-t border-[#5b9ea6]/20 px-3 sm:px-4 py-2 sm:py-1' style={{ background: '#f0f4f3', flexShrink: 0 }}>
        <div className='max-w-5xl mx-auto'>
          <div className='h-6 flex items-end gap-px mb-1 hidden sm:flex'>
            {chartData.map(d => {
              const h = (d.total / maxCount) * 100
              const isActive = d.year <= currentYear
              const isCurrent = d.year === currentYear
              return (
                <div key={d.year} className='flex-1 flex flex-col justify-end cursor-pointer' onClick={() => { setCurrentYear(d.year); setPlaying(false) }}>
                  <div
                    style={{ height: h + '%' }}
                    className={'w-full rounded-t-sm transition-all duration-150 ' + (isCurrent ? 'ring-1 ring-[#1b3a4b]/40 ' : '') + (isActive ? 'bg-gradient-to-t from-[#3a9e9e] to-[#7ec8c8]' : 'bg-[#1b3a4b]/10')}
                  />
                </div>
              )
            })}
          </div>
          <div className='flex items-center gap-2 sm:gap-3'>
            <button
              onClick={() => { if (currentYear >= YEAR_MAX) setCurrentYear(YEAR_MIN); setPlaying(!playing) }}
              className='w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-white transition-colors text-sm hover:opacity-80'
              style={{ background: '#3a9e9e' }}
            >
              {playing ? '\u23F8' : '\u25B6'}
            </button>
            <input type='range' min={YEAR_MIN} max={YEAR_MAX} value={currentYear}
              onChange={e => { setCurrentYear(parseInt(e.target.value)); setPlaying(false) }}
              className='flex-1 accent-[#3a9e9e]'
            />
            <span className='text-lg font-bold text-[#1b3a4b] w-12 text-right'>{currentYear}</span>
          </div>
          <div className='flex justify-between text-[10px] text-[#1b3a4b]/35 mt-0 px-10 hidden sm:flex'>
            {[1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].map(y => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
