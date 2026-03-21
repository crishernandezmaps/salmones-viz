import { useEffect, useRef, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'

const YEAR_MIN = 1985
const YEAR_MAX = 2025

export default function MapaTimeline() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [centros, setCentros] = useState([])
  const [concesionesData, setConcesionesData] = useState([])
  const [currentYear, setCurrentYear] = useState(YEAR_MIN)
  const [playing, setPlaying] = useState(false)
  const animRef = useRef(null)
  const sourcesReady = useRef(false)

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

  const visibleCentros = useMemo(() => {
    return classifiedCentros.filter(f => f.year <= currentYear)
  }, [classifiedCentros, currentYear])

  const counts = useMemo(() => {
    let salmonOtros = 0, soloSalmon = 0
    visibleCentros.forEach(f => {
      if (f.tipo === 'salmon_y_otros') salmonOtros++
      else soloSalmon++
    })
    return { salmonOtros, soloSalmon }
  }, [visibleCentros])

  useEffect(() => {
    if (map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-72.0, -43.0],
      zoom: 5,
      pitch: 0,
      bearing: 0,
      maxPitch: 60,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.on('load', () => setLoaded(true))
    return () => { if (map.current) { map.current.remove(); map.current = null } }
  }, [])

  useEffect(() => {
    if (!map.current || !loaded) return

    const mkGeoJSON = (feats) => ({
      type: 'FeatureCollection',
      features: feats.map(f => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { ...f.properties, tipo: f.tipo, weight: f.tipo === 'salmon_y_otros' ? 1.5 : 1 },
      })),
    })

    const allData = mkGeoJSON(visibleCentros)
    const salmonOtrosData = mkGeoJSON(visibleCentros.filter(f => f.tipo === 'salmon_y_otros'))
    const soloSalmonData = mkGeoJSON(visibleCentros.filter(f => f.tipo === 'solo_salmon'))

    if (sourcesReady.current) {
      map.current.getSource('all-centros').setData(allData)
      map.current.getSource('centros-salmon-otros').setData(salmonOtrosData)
      map.current.getSource('centros-solo-salmon').setData(soloSalmonData)
      return
    }

    map.current.addSource('all-centros', { type: 'geojson', data: allData })
    map.current.addSource('centros-salmon-otros', { type: 'geojson', data: salmonOtrosData })
    map.current.addSource('centros-solo-salmon', { type: 'geojson', data: soloSalmonData })

    // HEATMAP - visible at low zoom, fades at high zoom
    map.current.addLayer({
      id: 'heat',
      type: 'heatmap',
      source: 'all-centros',
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.6,
          8, 1.5,
          12, 2,
        ],
        'heatmap-radius': [
          'interpolate', ['linear'], ['zoom'],
          4, 14,
          8, 22,
          12, 30,
        ],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,   'rgba(0,0,0,0)',
          0.1, 'rgba(255,255,178,0.3)',
          0.25,'rgba(254,178,76,0.5)',
          0.4, 'rgba(253,141,60,0.6)',
          0.55,'rgba(252,78,42,0.7)',
          0.7, 'rgba(227,26,28,0.8)',
          0.85,'rgba(189,0,38,0.85)',
          1,   'rgba(128,0,38,0.9)',
        ],
        'heatmap-opacity': [
          'interpolate', ['linear'], ['zoom'],
          7, 0.85,
          10, 0.45,
          13, 0,
        ],
      },
    })

    // CIRCLES - fade in at higher zoom
    map.current.addLayer({
      id: 'pts-solo-salmon',
      type: 'circle',
      source: 'centros-solo-salmon',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 5, 14, 8],
        'circle-color': '#fca5a5',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.8],
        'circle-stroke-width': 0,
      },
    })

    map.current.addLayer({
      id: 'pts-salmon-otros',
      type: 'circle',
      source: 'centros-salmon-otros',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 10, 6, 14, 10],
        'circle-color': '#dc2626',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.9],
        'circle-stroke-width': 0,
      },
    })

    // Popup
    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
    const handleClick = (e) => {
      const props = e.features[0].properties
      popup.setLngLat(e.lngLat).setHTML(
        '<div style="font-size:13px;line-height:1.6;color:#1a202c">' +
        '<b>Centro ' + (props.N_CODIGOCE || '') + '</b><br>' +
        '<b>Comuna:</b> ' + (props.COMUNA || '') + '<br>' +
        '<b>Region:</b> ' + (props.REGION || '') + '<br>' +
        '<b>Fecha:</b> ' + (props.F_RESOLSSF || '') +
        '</div>'
      ).addTo(map.current)
    }
    map.current.on('click', 'pts-salmon-otros', handleClick)
    map.current.on('click', 'pts-solo-salmon', handleClick)
    ;['pts-salmon-otros', 'pts-solo-salmon'].forEach(id => {
      map.current.on('mouseenter', id, () => { map.current.getCanvas().style.cursor = 'pointer' })
      map.current.on('mouseleave', id, () => { map.current.getCanvas().style.cursor = '' })
    })

    sourcesReady.current = true
  }, [visibleCentros, loaded])

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

  // Chart data
  const chartData = useMemo(() => {
    const years = []
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      const filtered = classifiedCentros.filter(f => f.year <= y)
      years.push({
        year: y,
        salmonOtros: filtered.filter(f => f.tipo === 'salmon_y_otros').length,
        soloSalmon: filtered.filter(f => f.tipo === 'solo_salmon').length,
      })
    }
    return years
  }, [classifiedCentros])

  const maxCount = useMemo(() => Math.max(...chartData.map(d => d.soloSalmon + d.salmonOtros), 1), [chartData])

  // Line chart data up to currentYear
  const maxSingle = useMemo(() => Math.max(...chartData.map(d => Math.max(d.soloSalmon, d.salmonOtros)), 1), [chartData])
  const lineChartSlice = useMemo(() => chartData.filter(d => d.year <= currentYear), [chartData, currentYear])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {!loaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-900 z-20'>
            <p className='text-gray-400'>Cargando mapa...</p>
          </div>
        )}

        {/* Legend */}
        <div className='absolute top-3 left-3 bg-black/70 backdrop-blur rounded-lg shadow-lg p-3 z-10 text-sm'>
          <div className='flex items-center gap-2 mb-1.5'>
            <span className='w-3 h-3 rounded-full inline-block bg-red-600' />
            <span className='text-white/80'>Salmon y otros</span>
            <span className='font-bold text-red-500 ml-auto pl-3'>{counts.salmonOtros}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-3 h-3 rounded-full inline-block bg-red-300' />
            <span className='text-white/80'>Solo salmon</span>
            <span className='font-bold text-red-300 ml-auto pl-3'>{counts.soloSalmon}</span>
          </div>
          <div className='border-t border-white/10 mt-2 pt-2 flex items-center gap-2'>
            <span className='text-white/50 text-xs'>Total</span>
            <span className='font-bold text-white ml-auto'>{counts.salmonOtros + counts.soloSalmon}</span>
          </div>
        </div>

        {/* Year badge */}
        <div className='absolute top-3 right-14 bg-black/70 backdrop-blur rounded-lg shadow-lg px-4 py-2 z-10'>
          <span className='text-3xl font-bold text-white'>{currentYear}</span>
        </div>

        {/* Line chart */}
        {chartData.length > 0 && (
          <div className='absolute bottom-4 left-3 bg-black/70 backdrop-blur rounded-lg shadow-lg p-3 z-10' style={{ width: 280, height: 160 }}>
            <p className='text-white/50 text-xs uppercase tracking-wide mb-1'>Concesiones acumuladas</p>
            <svg width='256' height='120' viewBox='0 0 256 120'>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1='30' y1={10 + (1 - f) * 100} x2='256' y2={10 + (1 - f) * 100} stroke='rgba(255,255,255,0.07)' strokeWidth='1' />
              ))}

              {/* Y axis labels */}
              {[0, 0.5, 1].map(f => (
                <text key={f} x='26' y={10 + (1 - f) * 100 + 3} fill='rgba(255,255,255,0.3)' fontSize='9' textAnchor='end'>
                  {Math.round(maxSingle * f)}
                </text>
              ))}

              {/* Solo salmon line */}
              <polyline
                fill='none'
                stroke='#fca5a5'
                strokeWidth='2'
                points={lineChartSlice.map((d, i) => {
                  const x = 30 + ((d.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 226
                  const y = 110 - (d.soloSalmon / maxSingle) * 100
                  return `${x},${y}`
                }).join(' ')}
              />

              {/* Salmon y otros line */}
              <polyline
                fill='none'
                stroke='#dc2626'
                strokeWidth='2'
                points={lineChartSlice.map((d, i) => {
                  const x = 30 + ((d.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 226
                  const y = 110 - (d.salmonOtros / maxSingle) * 100
                  return `${x},${y}`
                }).join(' ')}
              />

              {/* Current value dots */}
              {lineChartSlice.length > 0 && (() => {
                const last = lineChartSlice[lineChartSlice.length - 1]
                const x = 30 + ((last.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 226
                const ySolo = 110 - (last.soloSalmon / maxSingle) * 100
                const yOtros = 110 - (last.salmonOtros / maxSingle) * 100
                return (
                  <>
                    <circle cx={x} cy={ySolo} r='3' fill='#fca5a5' />
                    <circle cx={x} cy={yOtros} r='3' fill='#dc2626' />
                  </>
                )
              })()}

              {/* X axis labels */}
              {[1985, 1995, 2005, 2015, 2025].map(y => (
                <text key={y} x={30 + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 226} y='120' fill='rgba(255,255,255,0.3)' fontSize='8' textAnchor='middle'>
                  {y}
                </text>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className='bg-gray-900 border-t border-white/10 px-4 py-3 shrink-0'>
        <div className='max-w-5xl mx-auto'>
          {/* Mini chart */}
          <div className='h-14 flex items-end gap-px mb-2'>
            {chartData.map(d => {
              const total = d.salmonOtros + d.soloSalmon
              const h = (total / maxCount) * 100
              const isActive = d.year <= currentYear
              const isCurrent = d.year === currentYear
              return (
                <div
                  key={d.year}
                  className='flex-1 flex flex-col justify-end cursor-pointer'
                  onClick={() => { setCurrentYear(d.year); setPlaying(false) }}
                >
                  <div
                    style={{ height: h + '%' }}
                    className={'w-full rounded-t-sm transition-all duration-150 ' +
                      (isCurrent ? 'ring-1 ring-white ' : '') +
                      (isActive
                        ? 'bg-gradient-to-t from-red-700 to-red-400'
                        : 'bg-white/10')
                    }
                  />
                </div>
              )
            })}
          </div>

          {/* Controls */}
          <div className='flex items-center gap-3'>
            <button
              onClick={() => { if (currentYear >= YEAR_MAX) setCurrentYear(YEAR_MIN); setPlaying(!playing) }}
              className='w-9 h-9 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors text-sm'
            >
              {playing ? '\u23F8' : '\u25B6'}
            </button>
            <input
              type='range'
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={currentYear}
              onChange={e => { setCurrentYear(parseInt(e.target.value)); setPlaying(false) }}
              className='flex-1 accent-red-500'
            />
          </div>

          {/* Year labels */}
          <div className='flex justify-between text-xs text-white/30 mt-1 px-10'>
            {[1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].map(y => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
