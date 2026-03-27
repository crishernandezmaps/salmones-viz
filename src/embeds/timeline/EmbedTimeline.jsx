import MapaTimelineDatos from './MapaTimelineDatos'

export default function EmbedTimeline() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        /* Force desktop layout regardless of iframe width */
        .md\\:flex-row { flex-direction: row !important; }
        .md\\:hidden { display: none !important; }
        .hidden.md\\:block { display: block !important; }
        .md\\:border-b-0 { border-bottom-width: 0 !important; }
        .md\\:border-r { border-right-width: 1px !important; }
        .sm\\:flex { display: flex !important; }
        .sm\\:px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
        .sm\\:py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
        .sm\\:gap-3 { gap: 0.75rem !important; }
        .hidden.sm\\:flex { display: flex !important; }
      `}</style>
      <MapaTimelineDatos />
    </div>
  )
}
