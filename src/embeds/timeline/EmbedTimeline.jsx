import MapaTimelineDatos from './MapaTimelineDatos'

export default function EmbedTimeline() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', padding: '14px', boxSizing: 'border-box', background: '#fff' }}>
      {/* El iframe va full-bleed en WordPress (width:100%), asi que su ancho = ancho
          del dispositivo. Dejamos que los breakpoints Tailwind respondan al ancho real:
          escritorio = 3 columnas + grafico; movil = apilado vertical + sparklines. */}
      <MapaTimelineDatos />
    </div>
  )
}
