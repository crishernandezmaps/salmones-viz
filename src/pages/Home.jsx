import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className='relative bg-[var(--color-primary)] text-white py-24 px-4'>
        <div className='max-w-4xl mx-auto text-center'>
          <h1 className='text-4xl sm:text-5xl font-bold mb-6 leading-tight'>
            La industria salmonera en Chile
          </h1>
          <p className='text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto'>
            Una investigación periodística con datos y visualizaciones interactivas
            sobre las concesiones, centros y denuncias de la salmonicultura chilena.
          </p>
          <Link
            to='/mapa'
            className='inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-lg hover:bg-orange-500 transition-colors'
          >
            Explorar el mapa
          </Link>
        </div>
      </section>

      {/* Indicadores */}
      <section className='max-w-6xl mx-auto py-16 px-4'>
        <h2 className='text-2xl font-bold text-center mb-10'>Indicadores clave</h2>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          {[
            { value: '---', label: 'Concesiones activas', desc: 'A noviembre 2025' },
            { value: '---', label: 'Centros salmoneros', desc: 'Con coordenadas georref.' },
            { value: '---', label: 'Denuncias registradas', desc: 'Total acumulado' },
          ].map((item) => (
            <div
              key={item.label}
              className='bg-white rounded-xl shadow-md p-6 text-center'
            >
              <p className='text-3xl font-bold text-[var(--color-secondary)]'>
                {item.value}
              </p>
              <p className='font-semibold mt-2'>{item.label}</p>
              <p className='text-sm text-gray-500 mt-1'>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secciones de contenido */}
      <section className='bg-white py-16 px-4'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-2xl font-bold mb-6'>Reportaje</h2>
          <p className='text-gray-600 leading-relaxed'>
            El contenido del reportaje periodístico será integrado aquí por el equipo
            de periodismo de la Universidad Diego Portales. Esta sección combinará
            texto narrativo, imágenes, gráficos y elementos multimedia para contar
            la historia detrás de los datos.
          </p>
        </div>
      </section>
    </div>
  )
}
