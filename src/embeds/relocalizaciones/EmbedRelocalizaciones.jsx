import MapaCapas from './MapaRelocalizaciones'
import MobileMapGate from '../../shared/MobileMapGate'

export default function EmbedCapas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <MapaCapas />
      <MobileMapGate />
    </div>
  )
}
