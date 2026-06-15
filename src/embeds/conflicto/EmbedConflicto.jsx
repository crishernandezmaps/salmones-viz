import MapaConflicto from './MapaConflicto'

export default function EmbedConflicto() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* El iframe va full-bleed en WordPress (width:100%): su ancho = ancho del
          dispositivo. Dejamos que los breakpoints respondan al ancho real:
          escritorio = mapa + ficha lateral; movil = mapa + ficha como bottom-sheet. */}
      <MapaConflicto />
    </div>
  )
}
