import MapaConflicto from './MapaConflicto'

export default function EmbedConflicto() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        /* Force desktop layout regardless of iframe width */
        .md\\:flex-row { flex-direction: row !important; }
        .md\\:hidden { display: none !important; }
        .hidden.md\\:block { display: block !important; }
        .hidden.md\\:flex { display: flex !important; }
        .sm\\:flex { display: flex !important; }
        .sm\\:px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
        .lg\\:block { display: block !important; }
        .hidden.lg\\:block { display: block !important; }
      `}</style>
      <MapaConflicto />
    </div>
  )
}
