import { useEffect, useRef, useState } from 'react'

// Datos: concesiones por empresa/holding (fuente: Subpesca + SMA via Ley de Transparencia).
// Cifras entregadas por el equipo UDP (prototipo agosto 2026).
const DATA = [
  { name: 'EMPRESAS AQUACHILE (AGROSUPER)', value: 325, color: '#1a5039' },
  { name: 'MOWI CHILE', value: 171, color: '#295671' },
  { name: 'CERMAQ CHILE S.A (MITSUBISHI CORPORATION)', value: 120, color: '#79acc2' },
  { name: 'MULTIEXPORT FOODS', value: 110, color: '#c06836' },
  { name: 'AUSTRALIS (JOYVIO)', value: 96, color: '#97362c' },
  { name: 'SALMONES CAMANCHACA', value: 74, color: '#523214' },
  { name: 'SALMONES AUSTRAL', value: 72, color: '#195c37' },
  { name: 'SALMONES ANTÁRTICA (NISSUI CORPORATION)', value: 69, color: '#256687' },
  { name: 'BLUMAR', value: 52, color: '#97bed3' },
  { name: 'OTROS', value: 257, color: '#e2e8f0', textColor: '#64748b' },
]

const TOTAL = 1346
const POR_PEZ = 20
const PEZ_W = 22

function Pez({ color, frac = 1, delay = 0, visible }) {
  const w = Math.max(1, Math.round(frac * PEZ_W))
  return (
    <span
      style={{
        width: w, height: 16, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', flexShrink: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(8px)',
        transition: `opacity .35s ease ${delay}ms, transform .35s ease ${delay}ms`,
      }}
    >
      <svg width={PEZ_W} height='13' viewBox='0 0 100 50' style={{ color, fill: 'currentColor', flexShrink: 0 }}>
        <rect x='5' y='12' width='70' height='26' rx='13' />
        <polygon points='65,25 95,12 95,38' />
        <circle cx='20' cy='21' r='3.5' fill='white' />
      </svg>
    </span>
  )
}

export default function GraficoConcesiones() {
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(false)

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
      <div className='w-full max-w-6xl mx-auto p-4 sm:p-6'>

        {/* Encabezado */}
        <div className='mb-5'>
          <h1 className='text-[#0f172a] text-xl sm:text-2xl font-bold tracking-tight'>Concesiones salmoneras según empresa</h1>
          <p className='text-gray-500 text-sm mt-1'>Sobre un total de 1.346 concesiones</p>
        </div>

        {/* Leyenda */}
        <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] rounded-md border border-gray-200 mb-6'>
          <svg width='22' height='13' viewBox='0 0 100 50' style={{ color: '#475569', fill: 'currentColor' }}>
            <rect x='5' y='12' width='70' height='26' rx='13' />
            <polygon points='65,25 95,12 95,38' />
            <circle cx='20' cy='21' r='3.5' fill='white' />
          </svg>
          <span className='text-[13px] font-semibold text-gray-600'>= 20 concesiones</span>
        </div>

        {/* Filas */}
        <div className='flex flex-col space-y-1'>
          {DATA.map((item, rowIdx) => {
            const percentage = ((item.value / TOTAL) * 100).toFixed(1).replace('.', ',')
            const completos = Math.floor(item.value / POR_PEZ)
            const resto = item.value % POR_PEZ
            const textColor = item.textColor || item.color
            const baseDelay = rowIdx * 90

            return (
              <div key={item.name} className='flex flex-col sm:flex-row sm:items-center p-0.5 rounded-lg hover:bg-gray-50/50 transition-colors group'>
                <div className='sm:w-[280px] sm:shrink-0 sm:text-right sm:pr-4 mb-1 sm:mb-0'>
                  <span className='text-[10px] font-[800] text-gray-700 uppercase tracking-wide leading-tight block group-hover:text-black transition-colors'>
                    {item.name}
                  </span>
                </div>
                <div className='flex-1 border-l-2 border-gray-200 pl-3 sm:pl-4 py-1 flex items-center'>
                  <div className='flex flex-wrap items-center gap-x-[4px] gap-y-[2px]'>
                    {Array.from({ length: completos }, (_, i) => (
                      <Pez key={i} color={item.color} delay={baseDelay + i * 28} visible={visible} />
                    ))}
                    {resto > 0 && (
                      <Pez color={item.color} frac={resto / POR_PEZ} delay={baseDelay + completos * 28} visible={visible} />
                    )}
                    <div
                      className='ml-3 flex flex-col justify-center'
                      style={{
                        opacity: visible ? 1 : 0,
                        transition: `opacity .5s ease ${baseDelay + (completos + 1) * 28}ms`,
                      }}
                    >
                      <span className='text-sm font-bold leading-none mb-1' style={{ color: textColor }}>{item.value}</span>
                      <span className='text-[10px] text-gray-400 font-medium leading-none'>{percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Fuente */}
        <div className='mt-6 pt-4 border-t border-gray-100'>
          <p className='text-xs text-gray-400'>
            <span className='font-semibold text-gray-500'>Fuente:</span> Datos abiertos Subsecretaría de Pesca y Acuicultura, y Superintendencia de Medioambiente vía Ley de Transparencia
          </p>
        </div>

      </div>
    </div>
  )
}
