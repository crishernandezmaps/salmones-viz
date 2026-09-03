import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers'
import MapSpinner from '../../shared/MapSpinner'
import { MAP_STYLE } from '../../shared/constants'

const BASE = import.meta.env.BASE_URL

const ROJO = [217, 64, 64]      // parte (origen)
const VERDE = [46, 125, 50]     // llega (destino solicitado)
const ROJO_CSS = '#d94040'
const VERDE_CSS = '#2e7d32'

const esc = (v) => (v == null ? '' : String(v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])))

const fmtFecha = (f) => {
  if (!f) return 'sin fecha'
  const [y, m] = String(f).split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return m ? `${meses[parseInt(m, 10) - 1]} ${y}` : f
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const easeInOut = t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
const DURACION_VIAJE = 5500

const fmtHa = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('es-CL', { maximumFractionDigits: 2 }) : esc(v)
}

// Salmon que viaja: mismo pez del pictograma (mira a la izquierda), con nado
// ondulante; .vj-rot se rota por codigo para apuntar al destino
function crearSalmonMovil(codigo) {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;width:max-content">
      <div class="vj-rot" style="will-change:transform">
        <div class="vj-swim">
          <svg width="30" height="15" viewBox="0 0 100 50" style="color:${ROJO_CSS};fill:currentColor;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">
            <rect x="5" y="12" width="70" height="26" rx="13" />
            <polygon points="65,25 95,12 95,38" />
            <circle cx="20" cy="21" r="3.5" fill="white" />
          </svg>
        </div>
      </div>
      <div class="vj-label" style="margin-top:2px;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700;background:#fff;color:${ROJO_CSS};border:1px solid ${ROJO_CSS};box-shadow:0 1px 3px rgba(0,0,0,.3);white-space:nowrap;transition:opacity .1s linear">${codigo}</div>
    </div>`
  return el
}

function crearMarcadorLlegada() {
  const el = document.createElement('div')
  el.innerHTML = `<div class="vj-pulse" style="width:20px;height:20px;border-radius:50%;background:${VERDE_CSS};border:3px solid #fff;box-shadow:0 0 14px 4px rgba(46,125,50,.6)"></div>`
  return el
}

export default function MapaViajes() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlayRef = useRef(null)
  const datosRef = useRef(null)
  const boundsTodosRef = useRef(null)
  const markersRef = useRef([])
  const rafRef = useRef(null)
  const timeoutRef = useRef(null)
  const faseRef = useRef('todos')

  const [loaded, setLoaded] = useState(false)
  const [sel, setSel] = useState(null)          // viaje seleccionado
  const [fase, setFase] = useState('todos')     // todos | playing | done
  const [meta, setMeta] = useState(null)
  const [grupos, setGrupos] = useState([])      // [holding, viajes[]] para el dropdown
  faseRef.current = fase

  const buildLayers = (selId) => {
    const { arcos, conArco } = datosRef.current
    const dim = selId != null
    const alphaArc = (d) => (dim && d.viaje.id !== selId ? 28 : 235)
    const alphaPt = (d, id) => (dim && id !== selId ? 30 : 210)
    return [
      new ArcLayer({
        id: 'arcos',
        data: arcos,
        getSourcePosition: d => d.origen,
        getTargetPosition: d => d.destino,
        getSourceColor: d => [...ROJO, alphaArc(d)],
        getTargetColor: d => [...VERDE, alphaArc(d)],
        getWidth: d => (dim && d.viaje.id === selId ? 3.5 : 2),
        widthUnits: 'pixels',
        getHeight: 0.7,
        pickable: true,
        autoHighlight: !dim,
        highlightColor: [255, 170, 40, 255],
        onClick: ({ object }) => object && clickViaje(object.viaje),
        updateTriggers: { getSourceColor: selId, getTargetColor: selId, getWidth: selId },
      }),
      new ScatterplotLayer({
        id: 'origenes',
        data: arcos,
        getPosition: d => d.origen,
        getFillColor: d => [...ROJO, alphaPt(d, d.viaje.id)],
        radiusMinPixels: 3,
        radiusMaxPixels: 6,
        stroked: true,
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 1,
        pickable: true,
        onClick: ({ object }) => object && clickViaje(object.viaje),
        updateTriggers: { getFillColor: selId },
      }),
      new ScatterplotLayer({
        id: 'destinos',
        data: conArco,
        getPosition: d => d.destino,
        getFillColor: d => [...VERDE, alphaPt(d, d.id)],
        radiusMinPixels: 3.5,
        radiusMaxPixels: 7,
        stroked: true,
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 1,
        pickable: true,
        onClick: ({ object }) => object && clickViaje(object),
        updateTriggers: { getFillColor: selId },
      }),
    ]
  }

  const refreshLayers = (selId) => {
    overlayRef.current.setProps({ layers: buildLayers(selId) })
  }

  const limpiarAnimacion = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
  }

  const clickViaje = (viaje) => {
    if (faseRef.current === 'playing') return
    animarViaje(viaje)
  }

  const animarViaje = (viaje) => {
    const map = mapRef.current
    limpiarAnimacion()
    setSel(viaje)
    setFase('playing')
    refreshLayers(viaje.id)

    const b = new maplibregl.LngLatBounds()
    viaje.origenes.forEach(o => b.extend(o.coord))
    b.extend(viaje.destino)
    // Maximo zoom que muestre el viaje completo: sin tope bajo, con aire extra
    // arriba para que la parabola del arco (y el panel) no se corten en pitch 45
    map.fitBounds(b, { padding: { top: 150, bottom: 70, left: 80, right: 80 }, maxZoom: 14, duration: 1600 })

    timeoutRef.current = setTimeout(() => {
      const movers = viaje.origenes.map(o => {
        const el = crearSalmonMovil(o.codigo)
        const marker = new maplibregl.Marker({ element: el, anchor: 'center', offset: [0, -4] })
          .setLngLat(o.coord).addTo(map)
        // orientar el salmon hacia el destino (trayecto recto -> angulo fijo);
        // el pez base mira a la izquierda, por eso el +180
        const s1 = map.project(o.coord)
        const s2 = map.project(viaje.destino)
        const ang = (s2.x - s1.x || s2.y - s1.y)
          ? Math.atan2(s2.y - s1.y, s2.x - s1.x) * 180 / Math.PI + 180
          : 0
        el.querySelector('.vj-rot').style.transform = `rotate(${ang}deg)`
        return { marker, desde: o.coord }
      })
      markersRef.current = movers.map(m => m.marker)

      let start = null
      const paso = (ts) => {
        if (!mapRef.current) return
        if (start == null) start = ts
        const t = Math.min(1, (ts - start) / DURACION_VIAJE)
        const e = easeInOut(t)
        movers.forEach(m => m.marker.setLngLat(lerp(m.desde, viaje.destino, e)))
        const op = e > 0.75 ? Math.max(0, 1 - (e - 0.75) / 0.2) : 1
        movers.forEach(m => {
          const label = m.marker.getElement().querySelector('.vj-label')
          if (label) label.style.opacity = op
        })
        if (t >= 1) {
          markersRef.current.forEach(m => m.remove())
          const llegada = new maplibregl.Marker({ element: crearMarcadorLlegada() })
            .setLngLat(viaje.destino).addTo(map)
          markersRef.current = [llegada]
          setFase('done')
          return
        }
        rafRef.current = requestAnimationFrame(paso)
      }
      rafRef.current = requestAnimationFrame(paso)
    }, 1750)
  }

  const verTodos = () => {
    if (faseRef.current === 'playing') return
    limpiarAnimacion()
    setSel(null)
    setFase('todos')
    refreshLayers(null)
    mapRef.current.fitBounds(boundsTodosRef.current, { padding: 60, duration: 1500 })
  }

  useEffect(() => {
    if (mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-73.3, -46.5],
      zoom: 5,
      pitch: 45,
      bearing: -12,
      attributionControl: false,
      cooperativeGestures: true,
      locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa', 'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + scroll para acercar', 'CooperativeGesturesHandler.MacHelpText': 'Usa Cmd + scroll para acercar' },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right')
    map.scrollZoom.disable()
    map.touchZoomRotate.enableRotation()

    map.on('load', async () => {
      const data = await fetch(BASE + 'data/viajes_reloc.json').then(r => r.json())
      const conArco = data.viajes.filter(v => v.origenes.length > 0)
      const arcos = conArco.flatMap(v => v.origenes.map(o => ({ viaje: v, origen: o.coord, destino: v.destino })))
      datosRef.current = { conArco, arcos }
      setMeta({ ...data.meta })

      // agrupar por holding para el dropdown, ordenado alfabeticamente y por fecha
      const porHolding = new Map()
      for (const v of conArco) {
        const h = v.holding || v.titular || 'SIN HOLDING'
        if (!porHolding.has(h)) porHolding.set(h, [])
        porHolding.get(h).push(v)
      }
      setGrupos(
        [...porHolding.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([h, vs]) => [h, vs.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))])
      )

      const b = new maplibregl.LngLatBounds()
      arcos.forEach(a => { b.extend(a.origen); b.extend(a.destino) })
      boundsTodosRef.current = b

      overlayRef.current = new MapboxOverlay({
        layers: buildLayers(null),
        getTooltip: ({ object }) => {
          if (!object || faseRef.current !== 'todos') return null
          const v = object.viaje || object
          return { text: `${v.holding || v.titular}\n${v.centros.join(', ')} → sector solicitado` }
        },
      })
      map.addControl(overlayRef.current)

      map.fitBounds(b, { padding: 60, duration: 0 })
      setLoaded(true)
    })

    return () => {
      limpiarAnimacion()
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <style>{`
        @keyframes vj-pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(46,125,50,.7); }
          70% { box-shadow: 0 0 0 18px rgba(46,125,50,0); }
          100% { box-shadow: 0 0 0 0 rgba(46,125,50,0); }
        }
        .vj-pulse { animation: vj-pulse-green 2s infinite; }
        @keyframes vj-swim {
          0%, 100% { transform: rotate(-7deg) translateY(-1px); }
          50% { transform: rotate(7deg) translateY(1px); }
        }
        .vj-swim { animation: vj-swim .45s ease-in-out infinite; transform-origin: 70% 50%; }
      `}</style>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      <div className='absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 z-10 max-w-[290px]'>
        <p className='text-[11px] font-bold uppercase tracking-wider text-[#1b3a4b] leading-tight'>Viajes de relocalización</p>
        {meta && (
          <p className='text-[10px] text-[#1b3a4b]/60 mt-0.5 mb-2'>
            {meta.con_arco} solicitudes &middot; {meta.arcos} trayectos &middot; 2010&ndash;2025
          </p>
        )}
        <div className='flex items-center gap-2 mb-1'>
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: ROJO_CSS }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Parte: centro de origen</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: VERDE_CSS }} />
          <span className='text-[#1b3a4b]/80 text-xs font-medium'>Llega: sector de destino solicitado</span>
        </div>

        {loaded && (
          <select
            value={sel ? sel.id : ''}
            disabled={fase === 'playing'}
            onChange={(e) => {
              const v = datosRef.current.conArco.find(x => x.id === Number(e.target.value))
              if (v) animarViaje(v)
              else verTodos()
            }}
            className='mt-2.5 w-full text-[11px] font-medium text-[#1b3a4b] bg-white border border-[#1b3a4b]/25 rounded-md px-2 py-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <option value=''>Elige un centro para ver su viaje...</option>
            {grupos.map(([holding, vs]) => (
              <optgroup key={holding} label={holding}>
                {vs.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.centros.join(' + ')} · {fmtFecha(v.fecha)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {!sel && (
          <p className='text-[10px] text-[#1b3a4b]/55 mt-2 leading-tight'>
            O haz clic directo en un arco. Gira e inclina el mapa con Ctrl + arrastrar (dos dedos en móvil).
          </p>
        )}

        {sel && (
          <div className='mt-2 pt-2 border-t border-[#1b3a4b]/10'>
            {fase === 'playing' && <p className='text-[10px] font-bold text-[#c65a1e]'>Viaje en curso...</p>}
            {fase === 'done' && (
              <div className='flex gap-2'>
                <button onClick={() => animarViaje(sel)}
                  className='text-[10px] font-bold px-2.5 py-1.5 rounded-md text-white cursor-pointer' style={{ background: '#35637f' }}>
                  Repetir viaje
                </button>
                <button onClick={verTodos}
                  className='text-[10px] font-bold px-2.5 py-1.5 rounded-md cursor-pointer border border-[#1b3a4b]/25 text-[#1b3a4b]/75 bg-white'>
                  Ver todos
                </button>
              </div>
            )}
          </div>
        )}

        {meta && !sel && (
          <p className='text-[9px] text-[#1b3a4b]/45 mt-2 leading-tight'>
            Destino = centroide del sector solicitado a Subpesca (trámites en curso, no siempre otorgados).
            {' '}{meta.sin_destino} solicitudes sin coordenada de destino y {meta.origenes_sin_coord} centros de origen sin coordenada oficial no se muestran.
          </p>
        )}
      </div>

      {/* Ficha del viaje: fija abajo a la izquierda desde que parte el viaje,
          para no tapar origen, destino ni el salmon que viaja */}
      {sel && fase !== 'todos' && (
        <div className='absolute bottom-8 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-[280px]'>
          <p className='text-[13px] font-bold text-[#1b3a4b] leading-tight'>{sel.holding || sel.titular}</p>
          <p className='text-[11px] text-[#1b3a4b] mt-1'>
            Centro{sel.centros.length > 1 ? 's' : ''} {sel.centros.join(', ')}{' '}
            <span style={{ color: VERDE_CSS, fontWeight: 700 }}>→ sector solicitado</span>
          </p>
          <p className='text-[11px] text-[#1b3a4b]/75 mt-1'>{fmtFecha(sel.fecha)} &middot; {sel.tipo}</p>
          {sel.superficie_ha && (
            <p className='text-[11px] text-[#1b3a4b]/75'>{fmtHa(sel.superficie_ha)} ha solicitadas</p>
          )}
          <p className='text-[10px] text-[#1b3a4b]/60 mt-1 leading-tight'>{sel.estado}</p>
        </div>
      )}

      <MapSpinner show={!loaded} />
    </div>
  )
}
