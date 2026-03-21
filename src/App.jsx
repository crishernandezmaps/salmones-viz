import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'

const MapaTimelineDatos = lazy(() => import('./experiments/MapaTimelineDatos'))
const ExportView = lazy(() => import('./experiments/ExportView'))

const Loading = () => (
  <div className='flex items-center justify-center h-full text-gray-400'>Cargando...</div>
)

const experiments = [
  { id: 'mapa-timeline-datos', label: 'Mapa Timeline Datos', component: MapaTimelineDatos },
]

function MainApp() {
  const [activeTab, setActiveTab] = useState(experiments[0].id)
  const ActiveComponent = experiments.find(e => e.id === activeTab)?.component

  return (
    <div className='h-screen w-screen flex flex-col overflow-hidden'>
      <TabBar
        tabs={experiments}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className='flex-1 overflow-hidden'>
        <Suspense fallback={<Loading />}>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path='/' element={<MainApp />} />
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
