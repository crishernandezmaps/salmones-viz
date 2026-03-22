import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

export default function MapaConflicto() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ centros: true, amp: true })

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

    mapRef.current.on('load', async () => {
      // Load AMP (TopoJSON)
      const ampResp = await fetch(BASE + 'data/amp_nacional.topojson')
      const ampTopo = await ampResp.json()
      const ampGeo = feature(ampTopo, ampTopo.objects.amp)

      mapRef.current.addSource('amp', { type: 'geojson', data: ampGeo })
      mapRef.current.addLayer({
        id: 'amp-fill', type: 'fill', source: 'amp',
        paint: { 'fill-color': '#3a9e9e', 'fill-opacity': 0.3 },
      })
      mapRef.current.addLayer({
        id: 'amp-outline', type: 'line', source: 'amp',
        paint: { 'line-color': '#2a7a7a', 'line-width': 1.5 },
      })

      // Load centros salmoneros (GeoJSON points)
      const centrosResp = await fetch(BASE + 'data/centros_salmoneros.geojson')
      const centrosGeo = await centrosResp.json()

      mapRef.current.addSource('centros', { type: 'geojson', data: centrosGeo })
      mapRef.current.addLayer({
        id: 'centros-heat', type: 'heatmap', source: 'centros',
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.5, 12, 2],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 8, 22, 12, 30],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.1, 'rgba(217,64,64,0.15)', 0.3, 'rgba(217,64,64,0.35)',
            0.5, 'rgba(200,50,50,0.5)', 0.7, 'rgba(180,40,40,0.65)',
            0.9, 'rgba(160,30,30,0.8)', 1, 'rgba(140,20,20,0.9)',
          ],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0.4, 13, 0],
        },
      })
      mapRef.current.addLayer({
        id: 'centros-pts', type: 'circle', source: 'centros',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 4, 12, 7],
          'circle-color': '#d94040',
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 0.8],
          'circle-stroke-width': 0.5,
          'circle-stroke-color': '#fff',
        },
      })

      // Popups
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })

      mapRef.current.on('click', 'centros-pts', (e) => {
        const p = e.features[0].properties
        popup.setLngLat(e.lngLat).setHTML(
          '<div style="font-size:12px;line-height:1.6;color:#1b3a4b">' +
          '<b>Centro ' + (p.N_CODIGOCE || '') + '</b><br>' +
          '<b>Comuna:</b> ' + (p.COMUNA || '') + '<br>' +
          '<b>Región:</b> ' + (p.REGION || '') + '<br>' +
          '<b>Fecha:</b> ' + (p.F_RESOLSSF || '') + '</div>'
        ).addTo(mapRef.current)
      })

      mapRef.current.on('click', 'amp-fill', (e) => {
        const p = e.features[0].properties
        popup.setLngLat(e.lngLat).setHTML(
          '<div style="font-size:12px;line-height:1.6;color:#1b3a4b">' +
          '<b>' + (p.NOMBRE || '') + '</b><br>' +
          '<b>Tipo:</b> ' + (p.TIPO_AMP || '') + '<br>' +
          '<b>Región:</b> ' + (p.REGION || '') + '<br>' +
          '<b>Superficie:</b> ' + Math.round(parseFloat(p.SUP_HA) || 0).toLocaleString() + ' ha<br>' +
          '<b>Decreto:</b> ' + (p.F__DECTO || '') + '</div>'
        ).addTo(mapRef.current)
      })

      ;['centros-pts', 'amp-fill'].forEach(id => {
        mapRef.current.on('mouseenter', id, () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
        mapRef.current.on('mouseleave', id, () => { mapRef.current.getCanvas().style.cursor = '' })
      })

      setLoaded(true)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const toggleLayer = (id) => {
    const next = !visible[id]
    setVisible(v => ({ ...v, [id]: next }))
    if (mapRef.current && loaded) {
      const vis = next ? 'visible' : 'none'
      if (id === 'centros') {
        mapRef.current.setLayoutProperty('centros-heat', 'visibility', vis)
        mapRef.current.setLayoutProperty('centros-pts', 'visibility', vis)
      } else {
        mapRef.current.setLayoutProperty(id + '-fill', 'visibility', vis)
        mapRef.current.setLayoutProperty(id + '-outline', 'visibility', vis)
      }
    }
  }

  const layers = [
    { id: 'centros', label: 'Centros Salmoneros (1.346)', color: '#d94040' },
    { id: 'amp', label: 'Áreas Marinas Protegidas (32)', color: '#3a9e9e' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Layer toggle */}
      <div className='absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 text-sm space-y-2'>
        {layers.map(layer => (
          <label key={layer.id} className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={visible[layer.id]}
              onChange={() => toggleLayer(layer.id)}
              className='rounded accent-[#3a9e9e]'
            />
            <span className='w-3 h-3 rounded-full inline-block' style={{ backgroundColor: layer.color }} />
            <span className='text-[#1b3a4b]/80 text-xs sm:text-sm'>{layer.label}</span>
          </label>
        ))}
      </div>

      {!loaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-[#f0f4f3] z-20'>
          <p className='text-[#1b3a4b]/40'>Cargando capas...</p>
        </div>
      )}
    </div>
  )
}
