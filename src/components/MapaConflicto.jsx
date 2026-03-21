import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { feature } from 'topojson-client'

const BASE = import.meta.env.BASE_URL
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const LAYERS_CONFIG = [
  {
    id: 'concesiones',
    label: 'Concesiones Salmoneras',
    file: 'data/concesiones_salmones.topojson',
    topoKey: 'concesiones',
    color: '#d94040',
    opacity: 0.5,
    outlineColor: '#d94040',
  },
  {
    id: 'amp',
    label: 'Áreas Marinas Protegidas',
    file: 'data/amp_nacional.topojson',
    topoKey: 'amp',
    color: '#3a9e9e',
    opacity: 0.35,
    outlineColor: '#2a7a7a',
  },
]

export default function MapaConflicto() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState({ concesiones: true, amp: true })

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-73.2, -44.5],
      zoom: 5.5,
      attributionControl: false,
    })
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    mapRef.current.on('load', async () => {
      for (const layer of LAYERS_CONFIG) {
        const resp = await fetch(BASE + layer.file)
        const topo = await resp.json()
        const geojson = feature(topo, topo.objects[layer.topoKey])

        mapRef.current.addSource(layer.id, { type: 'geojson', data: geojson })

        mapRef.current.addLayer({
          id: layer.id + '-fill',
          type: 'fill',
          source: layer.id,
          paint: {
            'fill-color': layer.color,
            'fill-opacity': layer.opacity,
          },
        })

        mapRef.current.addLayer({
          id: layer.id + '-outline',
          type: 'line',
          source: layer.id,
          paint: {
            'line-color': layer.outlineColor,
            'line-width': 1,
          },
        })
      }

      // Popup for concesiones
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
      mapRef.current.on('click', 'concesiones-fill', (e) => {
        const p = e.features[0].properties
        popup.setLngLat(e.lngLat).setHTML(
          '<div style="font-size:12px;line-height:1.6;color:#1b3a4b">' +
          '<b>' + (p.TITULAR || '') + '</b><br>' +
          '<b>Especie:</b> ' + (p.ESPECIES || '').substring(0, 80) + '<br>' +
          '<b>Comuna:</b> ' + (p.COMUNA || '') + '<br>' +
          '<b>Región:</b> ' + (p.REGION || '') + '<br>' +
          '<b>Estado:</b> ' + (p.T_ESTADOTR || '') + '<br>' +
          '<b>Superficie:</b> ' + (p.SUPERFICIE || '') + ' ha</div>'
        ).addTo(mapRef.current)
      })

      // Popup for AMP
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

      ;['concesiones-fill', 'amp-fill'].forEach(id => {
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
      mapRef.current.setLayoutProperty(id + '-fill', 'visibility', vis)
      mapRef.current.setLayoutProperty(id + '-outline', 'visibility', vis)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Layer toggle — top left */}
      <div className='absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 text-sm space-y-2'>
        {LAYERS_CONFIG.map(layer => (
          <label key={layer.id} className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={visible[layer.id]}
              onChange={() => toggleLayer(layer.id)}
              className='rounded accent-[#3a9e9e]'
            />
            <span
              className='w-3 h-3 rounded-sm inline-block border'
              style={{ backgroundColor: layer.color, opacity: layer.opacity, borderColor: layer.outlineColor }}
            />
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
