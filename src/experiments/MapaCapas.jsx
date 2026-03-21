import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL

const LAYERS = [
  { id: 'areas-apropiadas', label: 'Areas Apropiadas (AAA)', file: 'data/areas_apropiadas.topojson', topoKey: 'areas', color: '#3b82f6', opacity: 0.15 },
  { id: 'amp-nacional', label: 'Areas Marinas Protegidas', file: 'data/amp_nacional.topojson', topoKey: 'amp', color: '#22c55e', opacity: 0.3 },
  { id: 'concesiones', label: 'Concesiones Salmones', file: 'data/concesiones_salmones.topojson', topoKey: 'concesiones', color: '#ef4444', opacity: 0.7 },
]

export default function MapaCapas() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ 'areas-apropiadas': true, 'amp-nacional': true, 'concesiones': true })

  useEffect(() => {
    if (map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-73.5, -45.0],
      zoom: 6,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', async () => {
      for (const layer of LAYERS) {
        const resp = await fetch(BASE + layer.file)
        const topo = await resp.json()
        const geojson = feature(topo, topo.objects[layer.topoKey])
        map.current.addSource(layer.id, { type: 'geojson', data: geojson })
        map.current.addLayer({
          id: layer.id + '-fill',
          type: 'fill',
          source: layer.id,
          paint: { 'fill-color': layer.color, 'fill-opacity': layer.opacity },
        })
        map.current.addLayer({
          id: layer.id + '-outline',
          type: 'line',
          source: layer.id,
          paint: { 'line-color': layer.color, 'line-width': 1 },
        })
      }

      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '320px' })
      map.current.on('click', 'concesiones-fill', (e) => {
        const props = e.features[0].properties
        popup.setLngLat(e.lngLat).setHTML(
          '<div style="font-size:13px;line-height:1.5">' +
          '<b>' + (props.TITULAR || '') + '</b><br>' +
          '<b>Especie:</b> ' + (props.ESPECIES || '').substring(0, 80) + '...<br>' +
          '<b>Comuna:</b> ' + (props.COMUNA || '') + '<br>' +
          '<b>Region:</b> ' + (props.REGION || '') + '<br>' +
          '<b>Estado:</b> ' + (props.T_ESTADOTR || '') + '<br>' +
          '<b>Superficie:</b> ' + (props.SUPERFICIE || '') + ' ha</div>'
        ).addTo(map.current)
      })
      map.current.on('mouseenter', 'concesiones-fill', () => { map.current.getCanvas().style.cursor = 'pointer' })
      map.current.on('mouseleave', 'concesiones-fill', () => { map.current.getCanvas().style.cursor = '' })
      setLoaded(true)
    })

    return () => { if (map.current) { map.current.remove(); map.current = null } }
  }, [])

  const toggleLayer = (id) => {
    const next = !visible[id]
    setVisible(v => ({ ...v, [id]: next }))
    if (map.current) {
      const vis = next ? 'visible' : 'none'
      map.current.setLayoutProperty(id + '-fill', 'visibility', vis)
      map.current.setLayoutProperty(id + '-outline', 'visibility', vis)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Layer control */}
      <div className='absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 z-10 text-sm space-y-2'>
        <p className='font-bold text-xs text-gray-500 uppercase tracking-wide mb-2'>Capas</p>
        {LAYERS.map(layer => (
          <label key={layer.id} className='flex items-center gap-2 cursor-pointer'>
            <input type='checkbox' checked={visible[layer.id]} onChange={() => toggleLayer(layer.id)} className='rounded' />
            <span className='w-3 h-3 rounded-sm inline-block' style={{ backgroundColor: layer.color }} />
            <span className='text-gray-700'>{layer.label}</span>
          </label>
        ))}
      </div>

      {/* Legend */}
      <div className='absolute bottom-6 right-3 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 z-10 text-xs'>
        <p className='font-bold text-gray-500 uppercase tracking-wide mb-2'>Leyenda</p>
        {LAYERS.map(layer => (
          <div key={layer.id} className='flex items-center gap-2 mb-1'>
            <span className='w-3 h-3 rounded-sm inline-block' style={{ backgroundColor: layer.color, opacity: layer.opacity }} />
            <span className='text-gray-600'>{layer.label}</span>
          </div>
        ))}
      </div>

      {!loaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 z-20'>
          <p className='text-gray-500'>Cargando mapa...</p>
        </div>
      )}
    </div>
  )
}
