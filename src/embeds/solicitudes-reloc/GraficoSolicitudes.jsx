import { useEffect, useRef, useState } from 'react'

// Paleta de la disenadora (misma del prototipo aprobado)
const PALETTE = ['#305a44', '#35637f', '#98b9be', '#eae9e9', '#d68c5b', '#9f4c35', '#442805']

// Solicitudes de relocalizacion por empresa, 2010 a junio 2026.
// Fuente: Subpesca via Ley de Transparencia (prototipo UDP agosto 2026).
const RAW = [
  { empresa: 'AUSTRALIS', count: 25 },
  { empresa: 'BLUMAR', count: 16 },
  { empresa: 'CALETA BAY', count: 2 },
  { empresa: 'CERMAQ', count: 9 },
  { empresa: 'COOKE AQUACULTURE', count: 5 },
  { empresa: 'EMPRESAS AQUACHILE', count: 26 },
  { empresa: 'FRÍO SALMÓN', count: 2 },
  { empresa: 'INVERMAR', count: 5 },
  { empresa: 'MARINE FARM', count: 8 },
  { empresa: 'MOWI CHILE', count: 9 },
  { empresa: 'MULTIEXPORT FOODS', count: 15 },
  { empresa: 'NOVA AUSTRAL', count: 5 },
  { empresa: 'PACIFIC SEAFOOD', count: 1 },
  { empresa: 'PRODUCTOS DEL MAR VENTISQUEROS', count: 7 },
  { empresa: 'SALMONES ANTÁRTICA', count: 14 },
  { empresa: 'SALMONES AUSTRAL', count: 15 },
  { empresa: 'SALMONES CAMANCHACA', count: 11 },
  { empresa: 'SALMONES DE CHILE ALIMENTOS', count: 2 },
]

// Empresas con 5 o menos solicitudes se agrupan en "OTRAS EMPRESAS"
const UMBRAL = 5

function prepararDatos() {
  const ordenadas = [...RAW].sort((a, b) => b.count - a.count)
  const principales = ordenadas.filter(d => d.count > UMBRAL)
  const otras = ordenadas.filter(d => d.count <= UMBRAL)
  if (otras.length > 0) {
    principales.push({ empresa: 'OTRAS EMPRESAS', count: otras.reduce((s, d) => s + d.count, 0) })
  }
  return principales
}

export default function GraficoSolicitudes() {
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(false)

  const datos = prepararDatos()
  const total = datos.reduce((s, d) => s + d.count, 0)
  const max = Math.max(...datos.map(d => d.count))

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(rootRef.current)
    // Fallback: el grafico nunca debe quedar invisible si el observer no dispara
    const t = setTimeout(() => setVisible(true), 1500)
    return () => { obs.disconnect(); clearTimeout(t) }
  }, [])

  return (
    <div ref={rootRef} className='w-full bg-white font-sans'>
      <div className='w-full max-w-5xl mx-auto p-4 sm:p-6'>

        {/* Encabezado */}
        <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-1'>Solicitudes de relocalización por empresa</h2>
        <h3 className='text-base sm:text-lg text-gray-600 mb-6 font-medium'>Desde 2010 a junio de 2026</h3>

        {/* Barras */}
        <div className='flex flex-col gap-[7px]'>
          {datos.map((d, idx) => {
            const color = PALETTE[idx % PALETTE.length]
            const pct = (d.count / max) * 100
            const label = `${d.count} (${(d.count / total * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%)`
            return (
              <div key={d.empresa} className='flex flex-col sm:flex-row sm:items-center'>
                <div className='sm:w-[265px] sm:shrink-0 sm:text-right sm:pr-3 mb-0.5 sm:mb-0'>
                  <span className='text-[12px] sm:text-[13px] font-medium text-gray-600 uppercase leading-tight block'>{d.empresa}</span>
                </div>
                <div className='flex-1'>
                  <div
                    className='relative h-[26px] sm:h-[28px] rounded-md hover:opacity-85 transition-opacity'
                    style={{
                      backgroundColor: color,
                      width: visible ? `${pct}%` : '0%',
                      transition: `width 1s cubic-bezier(.25,.7,.3,1) ${idx * 60}ms, opacity .2s ease`,
                    }}
                  >
                    <span
                      className='absolute right-2 top-1/2 -translate-y-1/2 text-[11px] sm:text-[13px] font-bold text-white whitespace-nowrap'
                      style={{
                        textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                        opacity: visible ? 1 : 0,
                        transition: `opacity .5s ease ${800 + idx * 60}ms`,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contexto + fuente */}
        <p className='text-[#35637f] text-base sm:text-lg font-semibold mt-6 pt-5 border-t border-gray-200'>
          Las 177 solicitudes involucran a más de 300 centros
        </p>
        <p className='text-sm text-gray-500 mt-2 font-medium'>
          Fuente: Subsecretaría de Pesca y Acuicultura, vía Ley de Transparencia
        </p>

      </div>
    </div>
  )
}
