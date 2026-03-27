import { useEffect, useRef, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'

const YEAR_MIN = 1985
const YEAR_MAX = 2025

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const REGIONS = [
  { id: 'los-lagos', label: 'Los Lagos', center: [-72.8, -42.8], zoom: 6.5, filter: 'LOS LAGOS' },
  { id: 'aysen', label: 'Aysén', center: [-73.5, -45.5], zoom: 6, filter: 'AYSÉN' },
  { id: 'magallanes', label: 'Magallanes', center: [-73.0, -53.0], zoom: 6, filter: 'MAGALLANES' },
]

function RegionMap({ region, visibleCentros, centrosWithYear, currentYear, globalMaxVal }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const sourcesReady = useRef(false)

  const regionCentros = useMemo(() => {
    return visibleCentros.filter(f => (f.properties.REGION || '').toUpperCase().includes(region.filter))
  }, [visibleCentros, region.filter])

  const allRegionCentros = useMemo(() => {
    return centrosWithYear.filter(f => (f.properties.REGION || '').toUpperCase().includes(region.filter))
  }, [centrosWithYear, region.filter])

  const count = regionCentros.length

  const chartData = useMemo(() => {
    const years = []
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      years.push({
        year: y,
        total: allRegionCentros.filter(f => f.year <= y).length,
      })
    }
    return years
  }, [allRegionCentros])

  // Growth as multiplier from first year with at least 10 concessions
  const growthLabel = useMemo(() => {
    const base = chartData.find(d => d.total >= 10)
    if (!base) return null
    const current = chartData.find(d => d.year === currentYear)?.total || 0
    if (current <= base.total) return null
    const mult = current / base.total
    return { mult: Math.round(mult * 10) / 10, fromYear: base.year }
  }, [chartData, currentYear])

  // Detect all "elbows" — years where new concessions per year jump significantly
  // Uses year-over-year new concessions and finds spikes
  const elbowYears = useMemo(() => {
    if (chartData.length < 3) return []
    // Calculate new concessions per year
    const newPerYear = chartData.map((d, i) => ({
      year: d.year,
      added: i === 0 ? d.total : d.total - chartData[i - 1].total,
    }))
    // Calculate acceleration (change in additions)
    const accels = []
    for (let i = 1; i < newPerYear.length; i++) {
      const jump = newPerYear[i].added - newPerYear[i - 1].added
      if (jump > 0) accels.push({ year: newPerYear[i].year, jump })
    }
    if (accels.length === 0) return []
    // Find mean of positive jumps, threshold at 2x mean
    const mean = accels.reduce((s, a) => s + a.jump, 0) / accels.length
    const threshold = Math.max(mean * 1.5, 3) // at least 3 to avoid noise
    const candidates = accels.filter(a => a.jump >= threshold).sort((a, b) => b.jump - a.jump)
    // Keep only elbows with at least 4-year gap
    const result = []
    for (const c of candidates) {
      if (result.every(r => Math.abs(r - c.year) >= 4)) {
        result.push(c.year)
      }
    }
    return result.sort((a, b) => a - b)
  }, [chartData])

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
    mapRef.current.scrollZoom.disable()
    if (window.innerWidth < 768) {
      mapRef.current.dragPan.disable()
      mapRef.current.touchZoomRotate.disable()
    }
    mapRef.current.on('load', () => {
      const firstSym = mapRef.current.getStyle().layers.find(l => l.type === 'symbol')
      containerRef.current._beforeId = firstSym ? firstSym.id : undefined
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
        properties: f.properties,
      })),
    })

    const allData = mkGJ(regionCentros)

    if (sourcesReady.current) {
      mapRef.current.getSource('all').setData(allData)
      return
    }

    const BEFORE = containerRef.current._beforeId

    mapRef.current.addSource('all', { type: 'geojson', data: allData })

    mapRef.current.addLayer({
      id: 'heat', type: 'heatmap', source: 'all',
      paint: {
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.5, 12, 2],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 8, 22, 12, 30],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)', 0.1, 'rgba(58,120,130,0.2)', 0.25, 'rgba(40,100,120,0.4)',
          0.4, 'rgba(30,90,110,0.55)', 0.55, 'rgba(80,140,140,0.65)', 0.7, 'rgba(120,80,150,0.7)',
          0.85, 'rgba(40,110,120,0.8)', 1, 'rgba(25,80,100,0.9)',
        ],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0.45, 13, 0],
      },
    }, BEFORE)

    mapRef.current.addLayer({
      id: 'pts', type: 'circle', source: 'all',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 5, 14, 8],
        'circle-color': '#3a9e9e',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.8],
        'circle-stroke-width': 0,
      },
    }, BEFORE)

    // Labels using 'name' (not 'name_en' which is empty for Chile)
    if (!mapRef.current.getLayer('labels-regions')) {
      mapRef.current.addLayer({
        id: 'labels-regions', type: 'symbol', source: 'carto', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['state', 'province']]],
        minzoom: 4, maxzoom: 10,
        layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-font': ['Open Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.15, 'text-padding': 8 },
        paint: { 'text-color': '#1b3a4b', 'text-opacity': 0.4, 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
      mapRef.current.addLayer({
        id: 'labels-cities', type: 'symbol', source: 'carto', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        minzoom: 6,
        layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 10, 13], 'text-font': ['Open Sans Bold'], 'text-padding': 4 },
        paint: { 'text-color': '#1b3a4b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
      mapRef.current.addLayer({
        id: 'labels-places', type: 'symbol', source: 'carto', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['village', 'hamlet', 'suburb', 'island']]],
        minzoom: 9,
        layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-font': ['Open Sans Regular'], 'text-padding': 4 },
        paint: { 'text-color': '#1b3a4b', 'text-opacity': 0.7, 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
    }

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '220px' })
    mapRef.current.on('click', 'pts', (e) => {
      const p = e.features[0].properties
      popup.setLngLat(e.lngLat).setHTML(
        '<div style="font-size:12px;line-height:1.5;color:#1a202c"><b>Centro ' + (p.N_CODIGOCE || '') +
        '</b><br>Comuna: ' + (p.COMUNA || '') + '<br>Fecha: ' + (p.F_RESOLSSF || '') + '</div>'
      ).addTo(mapRef.current)
    })
    mapRef.current.on('mouseenter', 'pts', () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
    mapRef.current.on('mouseleave', 'pts', () => { mapRef.current.getCanvas().style.cursor = '' })

    sourcesReady.current = true
  }, [regionCentros])

  // SVG chart dimensions
  const CW = 240
  const CH = 80
  const cp = { t: 5, r: 5, b: 14, l: 28 }
  const pw = CW - cp.l - cp.r
  const ph = CH - cp.t - cp.b

  const mkLine = (data) =>
    data.map(d => {
      const x = cp.l + ((d.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
      const y = cp.t + ph - (d.total / maxVal) * ph
      return `${x},${y}`
    }).join(' ')

  // X-axis labels: skip static labels that are too close to an elbow
  const visibleElbows = elbowYears.filter(y => y <= currentYear)
  const staticLabels = [1985, 2005, 2025].filter(y =>
    visibleElbows.every(ey => Math.abs(ey - y) >= 4)
  )

  return (
    <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden' }} className='border-b-2 md:border-b-0 md:border-r border-[#3a9e9e]/20'>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Region label — top left */}
      <div className='absolute top-2 left-2 bg-white/70 backdrop-blur-sm rounded px-2 py-1 z-10'>
        <div className='flex items-center gap-1.5'>
          <p className='text-[#1b3a4b] font-bold text-xs'>{region.label}</p>
          <span className='text-[#1b3a4b] font-bold text-xs md:hidden'>{count}</span>
        </div>
      </div>

      {/* Mobile: multiplier — top right, large */}
      {growthLabel && (
        <div className='absolute top-2 right-2 bg-white/70 backdrop-blur-sm rounded px-2 py-1 z-10 md:hidden'>
          <span className='text-base font-bold' style={{ color: '#3a9e9e' }}>×{growthLabel.mult}</span>
        </div>
      )}

      {/* Mobile: sparkline — bottom 25%, no background */}
      <div className='absolute bottom-0 left-0 right-0 z-10 md:hidden' style={{ height: '25%' }}>
        <svg width='100%' height='100%' viewBox={`0 0 ${CW} 50`} preserveAspectRatio='none'>
          <polyline fill='none' stroke='rgba(217,64,64,0.6)' strokeWidth='2.5'
            points={slicedData.map(d => {
              const x = (d.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * CW
              const y = 44 - (d.total / maxVal) * 38
              return `${x},${y}`
            }).join(' ')}
          />
          {/* Pulsing circles at elbow years */}
          {visibleElbows.map(ey => {
            const ed = slicedData.find(d => d.year === ey)
            if (!ed) return null
            const cx = (ey - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * CW
            const cy = 44 - (ed.total / maxVal) * 38
            return (
              <g key={ey}>
                <circle cx={cx} cy={cy} r='6' fill='none' stroke='rgba(217,64,64,0.4)' strokeWidth='1.5'>
                  <animate attributeName='r' values='3;8;3' dur='2s' repeatCount='indefinite' />
                  <animate attributeName='opacity' values='0.8;0.2;0.8' dur='2s' repeatCount='indefinite' />
                </circle>
                <circle cx={cx} cy={cy} r='2.5' fill='#d94040' />
                <text x={cx} y={cy - 8} fill='#d94040' fontSize='5' fontWeight='700' textAnchor='middle'>{ey}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Desktop: Line chart + count — bottom overlay */}
      <div className='absolute bottom-2 left-2 right-2 bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1.5 z-10 hidden md:block'>
        <div className='flex items-center justify-between mb-1'>
          <div className='flex gap-2 text-[10px] items-center'>
            <span className='w-1.5 h-1.5 rounded-full' style={{ background: '#3a9e9e' }} />
            <span className='text-[#1b3a4b]/60'>Concesión de Salmones</span>
          </div>
          <div className='flex items-center gap-2'>
            {growthLabel && (
              <span className='text-[10px] font-bold' style={{ color: '#3a9e9e' }}>
                ×{growthLabel.mult}
              </span>
            )}
            <span className='text-[#1b3a4b] font-bold text-xs'>{count}</span>
          </div>
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
          {visibleElbows.map(ey => {
            const ex = cp.l + ((ey - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
            return (
              <g key={ey}>
                <line x1={ex} y1={cp.t} x2={ex} y2={cp.t + ph} stroke='#d94040' strokeWidth='0.8' strokeDasharray='2,2' />
                <text x={ex} y={CH - 2} fill='#d94040' fontSize='6' fontWeight='700' textAnchor='middle'>{ey}</text>
              </g>
            )
          })}
          <polyline fill='none' stroke='#3a9e9e' strokeWidth='1.5' points={mkLine(slicedData)} />
          {slicedData.length > 0 && (() => {
            const last = slicedData[slicedData.length - 1]
            const x = cp.l + ((last.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
            const y = cp.t + ph - (last.total / maxVal) * ph
            return <circle cx={x} cy={y} r='2.5' fill='#3a9e9e' />
          })()}
          {staticLabels.map(y => (
            <text key={y} x={cp.l + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw} y={CH - 2} fill='rgba(27,58,75,0.35)' fontSize='7' textAnchor='middle'>{y}</text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export default function MapaTimelineDatos() {
  const [centros, setCentros] = useState([])
  const [currentYear, setCurrentYear] = useState(YEAR_MIN)
  const [playing, setPlaying] = useState(false)
  const animRef = useRef(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/centros_salmoneros.geojson')
      .then(r => r.json())
      .then(data => setCentros(data.features))
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

  const visibleCentros = useMemo(() => centrosWithYear.filter(f => f.year <= currentYear), [centrosWithYear, currentYear])

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
      years.push({ year: y, total: centrosWithYear.filter(f => f.year <= y).length })
    }
    return years
  }, [centrosWithYear])
  const maxCount = useMemo(() => Math.max(...chartData.map(d => d.total), 1), [chartData])

  // Global max across all regions for consistent Y scale
  const globalMaxVal = useMemo(() => {
    let max = 1
    REGIONS.forEach(region => {
      const rc = centrosWithYear.filter(f => (f.properties.REGION || '').toUpperCase().includes(region.filter))
      for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
        const count = rc.filter(f => f.year <= y).length
        if (count > max) max = count
      }
    })
    return max
  }, [centrosWithYear])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#f0f4f3' }}>
      {/* Three region columns — horizontal on desktop, vertical on mobile */}
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', overflow: 'hidden' }} className='flex-col md:flex-row'>
        {REGIONS.map(region => (
          <RegionMap
            key={region.id}
            region={region}
            visibleCentros={visibleCentros}
            centrosWithYear={centrosWithYear}
            currentYear={currentYear}
            globalMaxVal={globalMaxVal}
          />
        ))}
      </div>

      {/* Timeline — full width */}
      <div className='border-t border-[#5b9ea6]/20 px-2 sm:px-4 py-1.5 sm:py-1' style={{ background: '#f0f4f3', flexShrink: 0 }}>
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
