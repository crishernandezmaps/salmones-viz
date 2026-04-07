import { lazy, Suspense } from 'react'

const EmbedTimeline = lazy(() => import('./embeds/timeline/EmbedTimeline'))
const EmbedConflicto = lazy(() => import('./embeds/conflicto/EmbedConflicto'))
const EmbedTreemap = lazy(() => import('./embeds/treemap-sobreproduccion/EmbedTreemap'))
const EmbedRelocalizaciones = lazy(() => import('./embeds/relocalizaciones/EmbedRelocalizaciones'))
const ArticuloPreview = lazy(() => import('./preview/ArticuloPreview'))

const EMBEDS = {
  timeline: EmbedTimeline,
  conflicto: EmbedConflicto,
  treemap: EmbedTreemap,
  relocalizaciones: EmbedRelocalizaciones,
}

const PREVIEWS = {
  articulo: ArticuloPreview,
}

const Loading = () => (
  <div className='flex items-center justify-center h-screen text-[#1b3a4b]/40'>Cargando...</div>
)

function Index() {
  return (
    <div className='flex items-center justify-center h-screen bg-[#f0f4f3] p-8'>
      <div className='max-w-xl text-center'>
        <h1 className='text-2xl font-bold text-[#1b3a4b] mb-4'>Salmones en Chile — Visualizaciones</h1>
        <p className='text-[#1b3a4b]/60 mb-6'>Biblioteca de visualizaciones interactivas sobre la industria salmonera en Chile. Cada pieza se incrusta como iframe en WordPress.</p>
        <div className='space-y-3 text-left'>
          {Object.keys(EMBEDS).map(key => (
            <a key={key} href={`?embed=${key}`}
              className='block p-3 bg-white rounded-lg border border-[#1b3a4b]/10 hover:border-[#3a9e9e] transition-colors'>
              <span className='font-mono text-sm text-[#3a9e9e]'>?embed={key}</span>
            </a>
          ))}
        </div>
        <div className='mt-6 pt-6 border-t border-[#1b3a4b]/10'>
          <p className='text-[#1b3a4b]/40 text-xs uppercase tracking-wider mb-3'>Preview de articulo</p>
          <a href='?preview=articulo'
            className='block p-3 bg-[#1b3a4b] rounded-lg hover:bg-[#1b3a4b]/90 transition-colors'>
            <span className='font-mono text-sm text-white'>?preview=articulo</span>
            <span className='block text-xs text-white/50 mt-1'>Simula el reportaje completo con iframes</span>
          </a>
        </div>
      </div>
    </div>
  )
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const embedKey = params.get('embed')
  const previewKey = params.get('preview')
  const EmbedComponent = embedKey ? EMBEDS[embedKey] : null
  const PreviewComponent = previewKey ? PREVIEWS[previewKey] : null

  if (EmbedComponent) {
    return (
      <Suspense fallback={<Loading />}>
        <EmbedComponent />
      </Suspense>
    )
  }

  if (PreviewComponent) {
    return (
      <Suspense fallback={<Loading />}>
        <PreviewComponent />
      </Suspense>
    )
  }

  return <Index />
}

export default App
