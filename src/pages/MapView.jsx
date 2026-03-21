import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

export default function MapView() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-72.5, -42.0],
      zoom: 6,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className='flex flex-col h-[calc(100vh-8rem)]'>
      {/* Panel superior */}
      <div className='bg-white border-b px-4 py-3 flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-bold'>Mapa Interactivo</h1>
          <p className='text-sm text-gray-500'>
            Concesiones, centros salmoneros y denuncias
          </p>
        </div>
        <div className='flex gap-2'>
          <button className='px-3 py-1.5 text-sm rounded-lg bg-[var(--color-secondary)] text-white hover:bg-blue-700 transition-colors'>
            Concesiones
          </button>
          <button className='px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'>
            Centros
          </button>
          <button className='px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'>
            Denuncias
          </button>
        </div>
      </div>

      {/* Mapa */}
      <div ref={mapContainer} className='flex-1 relative'>
        {!mapLoaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
            <p className='text-gray-500'>Cargando mapa...</p>
          </div>
        )}
      </div>
    </div>
  )
}
