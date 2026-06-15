import { useState, useEffect } from 'react'

/*
 * MobileMapGate — resuelve el conflicto scroll-vs-interaccion en movil.
 *
 * Con mapas a pantalla completa dentro de un iframe scrollytelling, tocar el mapa
 * o bien atrapa el scroll (no puedes pasar de largo) o bien se va a la pagina (no
 * puedes interactuar). Patron "toca para activar":
 *   - Modo SCROLL (por defecto): un overlay transparente cubre el mapa. 1 dedo
 *     arrastra -> scrollea el articulo (el overlay no consume el gesto, asi que
 *     la pagina padre scrollea). El mapa es un "preview".
 *   - Modo INTERACCION: al TOCAR (tap limpio) el overlay desaparece -> los gestos
 *     llegan al mapa (pan, zoom, tap en puntos, play, slider). Un boton "Listo"
 *     vuelve al modo scroll.
 *
 * Solo actua en movil (<768px); en escritorio no renderiza nada.
 */
export default function MobileMapGate() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [active, setActive] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setIsMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  if (!isMobile) return null

  if (active) {
    // Boton para salir del modo interaccion y volver a poder scrollear.
    return (
      <button
        onClick={() => setActive(false)}
        className='absolute z-30 left-1/2 -translate-x-1/2 top-3 flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b3a4b] text-white text-xs font-bold shadow-lg'
      >
        ✓ Listo · seguir leyendo
      </button>
    )
  }

  // Overlay de captura: tap = activar; arrastrar = scrollear la pagina.
  return (
    <button
      onClick={() => setActive(true)}
      aria-label='Tocar para interactuar con el mapa'
      className='absolute inset-0 z-20 w-full h-full bg-transparent border-0 cursor-pointer'
      style={{ touchAction: 'pan-y' }}
    >
      <span className='absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#1b3a4b]/85 text-white text-xs font-semibold shadow-lg whitespace-nowrap pointer-events-none'>
        👆 Toca para interactuar con el mapa
      </span>
    </button>
  )
}
