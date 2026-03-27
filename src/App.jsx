import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const ArticleView = lazy(() => import('./components/ArticleView'))
const ExportView = lazy(() => import('./experiments/ExportView'))
const EmbedTimeline = lazy(() => import('./components/EmbedTimeline'))

const Loading = () => (
  <div className='flex items-center justify-center h-screen text-[#1b3a4b]/40'>Cargando...</div>
)

function App() {
  // Query param ?embed=timeline bypasses router for iframe embedding
  const params = new URLSearchParams(window.location.search)
  if (params.get('embed') === 'timeline') {
    return (
      <Suspense fallback={<Loading />}>
        <EmbedTimeline />
      </Suspense>
    )
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path='/' element={<ArticleView />} />
          <Route path='/export/scroll-desktop' element={<ExportView layout='scroll-desktop' />} />
          <Route path='/export/scroll-mobile' element={<ExportView layout='scroll-mobile' />} />
          <Route path='/export/bg-desktop' element={<ExportView layout='bg-desktop' />} />
          <Route path='/export/bg-mobile' element={<ExportView layout='bg-mobile' />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
