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

function ExportRegionMap({ region, visibleCentros, centrosWithYear, currentYear, globalMaxVal, layout }) {
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

  const slicedData = useMemo(() => chartData.filter(d => d.year <= currentYear), [chartData, currentYear])

  const isHorizontal = layout === 'scroll-mobile' || layout === 'bg-desktop' || layout === 'bg-mobile'
  const pitch = layout === 'scroll-desktop' ? 50 : layout === 'bg-desktop' ? 40 : 60

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: region.center,
      zoom: region.zoom,
      pitch,
      maxPitch: 75,
      attributionControl: false,
    })
    mapRef.current.scrollZoom.disable()
    mapRef.current.dragPan.disable()
    mapRef.current.touchZoomRotate.disable()

    mapRef.current.on('load', () => {
      mapRef.current.getStyle().layers.forEach(l => {
        if (l.id.includes('place') && (l.id.includes('state') || l.id.includes('region') || l.id.includes('province'))) {
          mapRef.current.setLayoutProperty(l.id, 'visibility', 'none')
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
        properties: f.properties,
      })),
    })

    const allData = mkGJ(regionCentros)

    if (sourcesReady.current) {
      mapRef.current.getSource('all').setData(allData)
      return
    }

    mapRef.current.addSource('all', { type: 'geojson', data: allData })

    mapRef.current.addLayer({
      id: 'heat', type: 'heatmap', source: 'all',
      paint: {
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.5, 12, 2],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 8, 22, 12, 30],
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)', 0.1, 'rgba(58,120,130,0.2)', 0.25, 'rgba(40,100,120,0.4)',
          0.4, 'rgba(30,90,110,0.55)', 0.55, 'rgba(80,140,140,0.65)', 0.7, 'rgba(120,80,150,0.7)',
          0.85, 'rgba(40,110,120,0.8)', 1, 'rgba(25,80,100,0.9)'],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0.45, 13, 0],
      },
    })

    mapRef.current.addLayer({
      id: 'pts', type: 'circle', source: 'all',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 5, 14, 8],
        'circle-color': '#3a9e9e',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.8],
        'circle-stroke-width': 0,
      },
    })

    sourcesReady.current = true
  }, [regionCentros])

  // Chart SVG dimensions
  const CW = isHorizontal ? 160 : 200
  const CH = isHorizontal ? 50 : 70
  const cp = { t: 4, r: 4, b: 12, l: 24 }
  const pw = CW - cp.l - cp.r
  const ph = CH - cp.t - cp.b

  const mkLine = (data) =>
    data.map(d => {
      const x = cp.l + ((d.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
      const y = cp.t + ph - (d.total / globalMaxVal) * ph
      return `${x},${y}`
    }).join(' ')

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: isHorizontal ? '1px solid rgba(27,58,75,0.08)' : 'none', borderBottom: !isHorizontal ? '1px solid rgba(27,58,75,0.08)' : 'none' }}>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(255,255,255,0.7)', borderRadius: 4, padding: '2px 6px', zIndex: 10 }}>
        <span style={{ color: '#1b3a4b', fontWeight: 700, fontSize: isHorizontal ? 10 : 12 }}>{region.label}</span>
      </div>

      <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '4px 6px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, fontSize: isHorizontal ? 8 : 10 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#3a9e9e' }} />
            <span style={{ color: 'rgba(27,58,75,0.6)' }}>Concesión de Salmones</span>
          </div>
          <span style={{ color: '#1b3a4b', fontWeight: 700, fontSize: isHorizontal ? 10 : 12 }}>{count}</span>
        </div>
        <svg width='100%' viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio='xMidYMid meet'>
          {[0, 1].map(f => (
            <text key={f} x={cp.l - 3} y={cp.t + (1 - f) * ph + 3} fill='rgba(27,58,75,0.35)' fontSize='7' textAnchor='end'>{Math.round(globalMaxVal * f)}</text>
          ))}
          <polyline fill='none' stroke='#3a9e9e' strokeWidth='1.5' points={mkLine(slicedData)} />
          {slicedData.length > 0 && (() => {
            const last = slicedData[slicedData.length - 1]
            const x = cp.l + ((last.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw
            const y = cp.t + ph - (last.total / globalMaxVal) * ph
            return <circle cx={x} cy={y} r='2.5' fill='#3a9e9e' />
          })()}
          {[1985, 2005, 2025].map(y => (
            <text key={y} x={cp.l + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * pw} y={CH - 2} fill='rgba(27,58,75,0.3)' fontSize='6' textAnchor='middle'>{y}</text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export default function ExportView({ layout }) {
  const [centros, setCentros] = useState([])
  const [currentYear, setCurrentYear] = useState(YEAR_MIN)

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

  useEffect(() => {
    window.setYear = (y) => setCurrentYear(y)
    return () => { delete window.setYear }
  }, [])

  const isHorizontal = layout === 'scroll-mobile' || layout === 'bg-desktop' || layout === 'bg-mobile'
  const yearSize = layout === 'scroll-desktop' ? 48 : layout === 'bg-desktop' ? 64 : 32

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', background: '#f0f4f3', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {REGIONS.map(region => (
        <ExportRegionMap
          key={region.id}
          region={region}
          visibleCentros={visibleCentros}
          centrosWithYear={centrosWithYear}
          currentYear={currentYear}
          globalMaxVal={globalMaxVal}
          layout={layout}
        />
      ))}

      <div style={{
        position: 'absolute',
        top: layout === 'scroll-desktop' ? 'auto' : 8,
        bottom: layout === 'scroll-desktop' ? 8 : 'auto',
        right: 8,
        background: 'rgba(255,255,255,0.75)',
        borderRadius: 8,
        padding: '4px 12px',
        zIndex: 20,
      }}>
        <span style={{ color: '#1b3a4b', fontWeight: 900, fontSize: yearSize }}>{currentYear}</span>
      </div>
    </div>
  )
}
