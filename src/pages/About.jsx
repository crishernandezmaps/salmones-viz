export default function About() {
  return (
    <div className='max-w-4xl mx-auto py-16 px-4'>
      <h1 className='text-3xl font-bold mb-6'>Acerca del proyecto</h1>

      <div className='prose max-w-none space-y-4 text-gray-700 leading-relaxed'>
        <p>
          Esta plataforma de visualización de datos fue desarrollada por{' '}
          <strong>Tremen SpA</strong> para la{' '}
          <strong>Universidad Diego Portales</strong>, integrando un reportaje
          periodístico elaborado por el equipo de periodismo UDP con un mapa
          interactivo y visualizaciones de datos sobre la industria salmonera en
          Chile.
        </p>

        <h2 className='text-xl font-bold mt-8 mb-3'>Fuentes de datos</h2>
        <ul className='list-disc pl-6 space-y-1'>
          <li>Concesiones salmoneras oficiales (noviembre 2025)</li>
          <li>Centros salmoneros con coordenadas georreferenciadas</li>
          <li>Registro de denuncias ambientales</li>
          <li>GeoJSON de regiones y comunas de Chile</li>
        </ul>

        <h2 className='text-xl font-bold mt-8 mb-3'>Equipo</h2>
        <p>
          <strong>Dirección de proyecto:</strong> Cristian Hernández M. — Tremen SpA
        </p>
        <p>
          <strong>Contenido periodístico:</strong> Equipo de Periodismo UDP
        </p>
      </div>
    </div>
  )
}
