import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import MapSpinner from '../../shared/MapSpinner'

const BASE = import.meta.env.BASE_URL

/* ── Detecta viewport movil de forma reactiva (orientacion / resize del iframe) ── */
function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [bp])
  return m
}

// Coordenadas [lng, lat]
const HUILLINES = [-73.592667, -46.322778]    // centro 110225 (extinguido)
const EXPLORADORES = [-73.53, -46.303333]     // centro 110295 (extinguido)
const ERASMO = [-73.465756, -46.096475]       // centro 110955 (SERNAPESCA, coordenada oficial)

// Paleta de la disenadora
const C = {
  hui: '#35637f',
  exp: '#9f4c35',
  era: '#305a44',
  accent: '#d68c5b',
  crema: '#eae9e9',
  dark: '#442805',
  mist: '#98b9be',
}

// Basemap satelital (Esri World Imagery, uso gratuito con atribucion)
const SAT_STYLE = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 17,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#1c2b33' } },
    { id: 'esri', type: 'raster', source: 'esri' },
  ],
}

const DURACION_FUSION = 7000
const ZOOM_TRAVESIA = 11

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const easeInOut = t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

function boundsIniciales() {
  const b = new maplibregl.LngLatBounds()
  ;[HUILLINES, EXPLORADORES, ERASMO, [-73.66, -46.4]].forEach(c => b.extend(c))
  return b
}

function crearMarcadorMovil(nombre, color) {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="display:flex;align-items:center;width:max-content">
      <div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid ${C.crema};box-shadow:0 2px 4px rgba(68,40,5,.5);flex-shrink:0"></div>
      <div class="fe-label" style="margin-left:6px;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;background:${C.crema};color:${color};border:1px solid ${color};box-shadow:0 2px 4px rgba(68,40,5,.4);white-space:nowrap;transition:opacity .1s linear">${nombre}</div>
    </div>`
  return el
}

function crearMarcadorErasmo() {
  const el = document.createElement('div')
  el.innerHTML = `<div class="fe-pulse" style="width:22px;height:22px;border-radius:50%;background:${C.era};border:3px solid ${C.crema};box-shadow:0 0 15px 5px rgba(48,90,68,.6)"></div>`
  return el
}

function crearEtiquetaParque() {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 4px rgba(0,0,0,.6))">
      <div style="background:${C.crema};border:2px solid ${C.accent};color:${C.dark};padding:5px 12px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;position:relative;z-index:10">
        Parque Nacional Laguna San Rafael
      </div>
      <div style="width:14px;height:14px;background:${C.crema};border-bottom:2px solid ${C.accent};border-right:2px solid ${C.accent};transform:rotate(45deg);margin-top:-8px;z-index:0"></div>
    </div>`
  return el
}

const popupHTML = `
  <div style="font-family:system-ui,-apple-system,sans-serif;text-align:center;line-height:1.4;padding:2px">
    <b style="color:${C.era};font-size:15px">Centro Erasmo 7 (110955)</b><br>
    <span style="color:${C.dark};font-size:12px">Centro resultante de la fusión y relocalización de Huillines 1 y Exploradores.</span>
  </div>`

export default function MapaFusionErasmo() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [fase, setFase] = useState('idle') // idle | playing | done
  const isMobile = useIsMobile()
  const [panelOpen, setPanelOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)

  const markersRef = useRef({ hui: null, exp: null, era: null })
  const popupRef = useRef(null)
  const rafRef = useRef(null)
  const timeoutRef = useRef(null)
  const startRef = useRef(null)
  const faseRef = useRef('idle')
  faseRef.current = fase

  const ponerMarcadoresMoviles = () => {
    const map = mapRef.current
    const m = markersRef.current
    m.hui = new maplibregl.Marker({ element: crearMarcadorMovil('Huillines 1', C.hui), anchor: 'left' })
      .setLngLat(HUILLINES).addTo(map)
    m.exp = new maplibregl.Marker({ element: crearMarcadorMovil('Exploradores', C.exp), anchor: 'left' })
      .setLngLat(EXPLORADORES).addTo(map)
    // El anchor 'left' centra el punto (offset compensa la mitad del punto de 12px + borde)
    m.hui.setOffset([-8, 0])
    m.exp.setOffset([-8, 0])
  }

  useEffect(() => {
    if (mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SAT_STYLE,
      bounds: boundsIniciales(),
      fitBoundsOptions: { padding: { top: 40, bottom: 40, left: 40, right: 40 }, maxZoom: 10 },
      attributionControl: { compact: true },
      cooperativeGestures: true,
      locale: {
        'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scroll para acercar',
        'CooperativeGesturesHandler.MacHelpText': 'Usa Cmd + scroll para acercar',
      },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.scrollZoom.disable()

    map.on('load', async () => {
      // Deslinde REAL del PN Laguna San Rafael (OSM 4647128, geometria completa)
      const parque = await fetch(BASE + 'data/pn_laguna_san_rafael.geojson').then(r => r.json())
      map.addSource('parque', { type: 'geojson', data: parque })
      map.addLayer({ id: 'parque-fill', type: 'fill', source: 'parque', paint: { 'fill-color': C.era, 'fill-opacity': 0.32 } })
      map.addLayer({ id: 'parque-line', type: 'line', source: 'parque', paint: { 'line-color': C.accent, 'line-width': 2.5, 'line-dasharray': [2.2, 2.2] } })

      // Trayectorias punteadas hacia Erasmo 7
      map.addSource('rutas', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { c: C.mist }, geometry: { type: 'LineString', coordinates: [HUILLINES, ERASMO] } },
            { type: 'Feature', properties: { c: C.accent }, geometry: { type: 'LineString', coordinates: [EXPLORADORES, ERASMO] } },
          ],
        },
      })
      map.addLayer({
        id: 'rutas', type: 'line', source: 'rutas',
        paint: { 'line-color': ['get', 'c'], 'line-width': 2, 'line-dasharray': [1.5, 2], 'line-opacity': 0.85 },
      })

      // Ubicaciones antiguas (puntos fijos)
      map.addSource('origenes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { c: C.hui }, geometry: { type: 'Point', coordinates: HUILLINES } },
            { type: 'Feature', properties: { c: C.exp }, geometry: { type: 'Point', coordinates: EXPLORADORES } },
          ],
        },
      })
      map.addLayer({
        id: 'origenes', type: 'circle', source: 'origenes',
        paint: { 'circle-radius': 4, 'circle-color': ['get', 'c'], 'circle-opacity': 0.75, 'circle-stroke-width': 1, 'circle-stroke-color': C.crema },
      })

      // Etiqueta del parque (dentro del deslinde real)
      new maplibregl.Marker({ element: crearEtiquetaParque(), anchor: 'bottom' })
        .setLngLat([-73.56, -46.42]).addTo(map)

      ponerMarcadoresMoviles()
      setLoaded(true)
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [])

  const paso = (ts) => {
    const map = mapRef.current
    if (!map) return
    if (startRef.current == null) startRef.current = ts
    const t = Math.min(1, (ts - startRef.current) / DURACION_FUSION)
    const e = easeInOut(t)

    const posHui = lerp(HUILLINES, ERASMO, e)
    const posExp = lerp(EXPLORADORES, ERASMO, e)
    markersRef.current.hui.setLngLat(posHui)
    markersRef.current.exp.setLngLat(posExp)

    // Las etiquetas se desvanecen entre el 75% y el 95% del trayecto
    const op = e > 0.75 ? Math.max(0, 1 - (e - 0.75) / 0.2) : 1
    ;[markersRef.current.hui, markersRef.current.exp].forEach(m => {
      const label = m.getElement().querySelector('.fe-label')
      if (label) label.style.opacity = op
    })

    map.jumpTo({ center: mid(posHui, posExp), zoom: ZOOM_TRAVESIA })

    if (t >= 1) { terminar(); return }
    rafRef.current = requestAnimationFrame(paso)
  }

  const terminar = () => {
    const map = mapRef.current
    markersRef.current.hui.remove()
    markersRef.current.exp.remove()
    markersRef.current.hui = null
    markersRef.current.exp = null
    map.setLayoutProperty('rutas', 'visibility', 'none')

    markersRef.current.era = new maplibregl.Marker({ element: crearMarcadorErasmo() })
      .setLngLat(ERASMO).addTo(map)

    setFase('done')
    map.flyTo({ center: ERASMO, zoom: 14.5, duration: 4500, essential: true })
    map.once('moveend', () => {
      if (!mapRef.current || faseRef.current !== 'done') return
      popupRef.current = new maplibregl.Popup({ closeOnClick: false, maxWidth: '250px', offset: 18 })
        .setLngLat(ERASMO).setHTML(popupHTML).addTo(map)
    })
  }

  const reiniciar = () => {
    const map = mapRef.current
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
    if (markersRef.current.era) { markersRef.current.era.remove(); markersRef.current.era = null }
    map.setLayoutProperty('rutas', 'visibility', 'visible')
    ponerMarcadoresMoviles()
    setFase('idle')
    map.fitBounds(boundsIniciales(), { padding: { top: 40, bottom: 40, left: 40, right: 40 }, maxZoom: 10, duration: 1500 })
  }

  const onControl = () => {
    if (!loaded || fase === 'playing') return
    if (fase === 'done') { reiniciar(); return }
    setFase('playing')
    if (isMobile) setPanelOpen(false) // en movil la tarjeta se pliega para despejar el mapa durante el recorrido
    const map = mapRef.current
    map.flyTo({ center: mid(HUILLINES, EXPLORADORES), zoom: ZOOM_TRAVESIA, duration: 3000, essential: true })
    timeoutRef.current = setTimeout(() => {
      startRef.current = null
      rafRef.current = requestAnimationFrame(paso)
    }, 3200)
  }

  const estadoTexto = { idle: 'Reproducir recorrido', playing: 'Fusión en proceso...', done: 'Volver a ver' }[fase]
  const btnColor = { idle: { background: C.hui, color: C.crema }, playing: { background: C.mist, color: C.dark, cursor: 'not-allowed' }, done: { background: C.accent, color: C.dark } }[fase]

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#1c2b33' }}>
      <style>{`
        @keyframes fe-pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(48,90,68,.7); }
          70% { box-shadow: 0 0 0 20px rgba(48,90,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(48,90,68,0); }
        }
        .fe-pulse { animation: fe-pulse-green 2s infinite; }
        @keyframes fe-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Panel de informacion — en movil parte plegado y solo muestra titulo + control */}
      <div className='absolute top-3 left-3 md:top-5 md:left-5 w-[calc(100%-24px)] max-w-[240px] md:max-w-[300px] rounded-xl p-2.5 md:p-3.5 z-10 shadow-2xl border-2'
        style={{ background: 'rgba(234,233,233,.95)', backdropFilter: 'blur(6px)', borderColor: C.mist }}>
        <button onClick={() => setPanelOpen(o => !o)} className='w-full flex items-start justify-between gap-2 text-left cursor-pointer'>
          <h1 className='text-[13px] md:text-[15px] font-bold leading-tight' style={{ color: C.dark }}>
            Fusión y relocalización de Huillines 1 y Exploradores
          </h1>
          <span className='text-[10px] mt-0.5 shrink-0' style={{ color: C.hui }}>{panelOpen ? '▾' : '▸'}</span>
        </button>

        <div className={panelOpen ? 'block' : 'hidden'}>
        <p className='text-[11px] font-semibold mt-0.5 mb-3' style={{ color: C.hui }}>Cooke Aquaculture Chile S.A.</p>

        <div className='space-y-1.5 text-xs'>
          <div className='flex items-center p-1.5 rounded-lg border transition-opacity duration-500'
            style={{ background: 'rgba(152,185,190,.3)', borderColor: C.mist, opacity: fase === 'done' ? 0.5 : 1 }}>
            <span className='w-2.5 h-2.5 rounded-full mr-2 shrink-0 border' style={{ background: C.hui, borderColor: C.crema }} />
            <span className='font-bold leading-none' style={{ color: C.hui }}>Huillines 1 (110225)</span>
          </div>
          <div className='flex items-center p-1.5 rounded-lg border transition-opacity duration-500'
            style={{ background: 'rgba(214,140,91,.3)', borderColor: C.accent, opacity: fase === 'done' ? 0.5 : 1 }}>
            <span className='w-2.5 h-2.5 rounded-full mr-2 shrink-0 border' style={{ background: C.exp, borderColor: C.crema }} />
            <span className='font-bold leading-none' style={{ color: C.exp }}>Exploradores (110295)</span>
          </div>
          <div className='text-center' style={{ color: C.accent }}>
            <svg className='w-4 h-4 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 14l-7 7m0 0l-7-7m7 7V3' />
            </svg>
          </div>
          <div className='flex items-center p-1.5 rounded-lg border transition-opacity duration-500'
            style={{ background: 'rgba(48,90,68,.2)', borderColor: C.era, opacity: fase === 'done' ? 1 : 0.5 }}>
            <span className='w-2.5 h-2.5 rounded-full mr-2 shrink-0 border' style={{ background: C.era, borderColor: C.crema, boxShadow: '0 0 8px rgba(48,90,68,.8)' }} />
            <span className='font-bold leading-none' style={{ color: C.era }}>Erasmo 7 (110955)</span>
          </div>
          <div className='flex items-center p-1.5 rounded-lg border mt-1' style={{ background: 'rgba(214,140,91,.1)', borderColor: 'rgba(214,140,91,.5)' }}>
            <span className='w-3 h-3 mr-2 shrink-0 rounded-sm' style={{ background: 'rgba(48,90,68,.32)', border: `1.5px dashed ${C.accent}` }} />
            <span className='text-[10px] leading-tight' style={{ color: C.dark }}>Deslinde del Parque Nacional Laguna San Rafael</span>
          </div>
        </div>
        </div>

        {/* Control de reproduccion — siempre visible, aunque el panel este plegado */}
        <div className='flex justify-center border-t-2 mt-2 pt-2 md:mt-3 md:pt-2.5' style={{ borderColor: 'rgba(152,185,190,.5)' }}>
          <button
            onClick={onControl}
            disabled={fase === 'playing'}
            title={estadoTexto}
            className='w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105'
            style={{ ...btnColor, border: `3px solid ${C.crema}`, boxShadow: '0 4px 6px rgba(68,40,5,.3)', cursor: fase === 'playing' ? 'not-allowed' : 'pointer' }}
          >
            {fase === 'idle' && (
              <svg className='w-6 h-6 ml-0.5' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z' clipRule='evenodd' />
              </svg>
            )}
            {fase === 'playing' && (
              <svg className='w-5 h-5' style={{ animation: 'fe-spin 1s linear infinite' }} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
              </svg>
            )}
            {fase === 'done' && (
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
              </svg>
            )}
          </button>
        </div>
        <div className='text-center text-[10px] font-bold mt-1.5' style={{ color: fase === 'done' ? C.accent : C.hui }}>{estadoTexto}</div>
      </div>

      <MapSpinner show={!loaded} />
    </div>
  )
}
