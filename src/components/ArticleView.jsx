import { lazy, Suspense } from 'react'

const MapaTimelineDatos = lazy(() => import('../experiments/MapaTimelineDatos'))

const Loading = () => (
  <div className='flex items-center justify-center h-[70vh] text-[#1b3a4b]/40'>Cargando mapa...</div>
)

export default function ArticleView() {
  return (
    <div className='min-h-screen bg-white' style={{ fontFamily: "'Roboto', 'Inter', system-ui, sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO — Full viewport, dark background
          ═══════════════════════════════════════════════════════ */}
      <section className='relative h-screen flex items-end justify-start overflow-hidden'>
        <div className='absolute inset-0 bg-[#0d1b2a]'>
          <img
            src='https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=1920&q=80'
            alt='Salmon farming in southern Chile'
            className='w-full h-full object-cover opacity-40'
          />
        </div>
        <div className='relative z-10 max-w-4xl px-6 sm:px-12 pb-16 sm:pb-24'>
          <p className='text-white/60 text-sm sm:text-base font-light tracking-widest uppercase mb-4'>
            Investigación
          </p>
          <h1 className='text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6'>
            La fiebre del salmón:<br />
            <span className='text-[#7ec8c8]'>40 años de concesiones en el sur de Chile</span>
          </h1>
          <p className='text-white/70 text-lg sm:text-xl max-w-2xl leading-relaxed'>
            Cómo la industria salmonera transformó los fiordos y canales de la Patagonia
            en una de las mayores operaciones acuícolas del mundo.
          </p>
          <div className='mt-8 flex items-center gap-4 text-white/50 text-sm'>
            <span>Por Equipo de Periodismo UDP</span>
            <span className='w-1 h-1 rounded-full bg-white/30' />
            <span>Marzo 2026</span>
          </div>
        </div>
        <div className='absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 animate-bounce'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M12 5v14M5 12l7 7 7-7' />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: TEXT OVER MEDIA — Intro paragraph
          ═══════════════════════════════════════════════════════ */}
      <section className='relative py-24 sm:py-32'>
        <div className='absolute inset-0'>
          <img
            src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=80'
            alt='Aerial view of fjords'
            className='w-full h-full object-cover opacity-10'
          />
        </div>
        <div className='relative max-w-3xl mx-auto px-6 sm:px-12'>
          <p className='text-[#1b3a4b] text-xl sm:text-2xl leading-relaxed font-light first-letter:text-5xl first-letter:font-bold first-letter:text-[#3a9e9e] first-letter:float-left first-letter:mr-3 first-letter:mt-1'>
            En 1985, las aguas del sur de Chile albergaban apenas un puñado de centros de cultivo
            de salmón. Cuatro décadas después, más de 1.300 concesiones salpican los fiordos y canales
            de tres regiones, convirtiendo a Chile en el segundo productor mundial de salmón de cultivo.
            Esta es la historia de una transformación silenciosa que redibujó la geografía económica
            y ambiental de la Patagonia.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: TEXT — Context paragraphs
          ═══════════════════════════════════════════════════════ */}
      <section className='py-16 sm:py-20'>
        <div className='max-w-3xl mx-auto px-6 sm:px-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#1b3a4b] mb-8'>
            El origen de la industria
          </h2>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum
            primis in faucibus orci luctus et ultrices posuere cubilia curae. Sed ut perspiciatis
            unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam
            rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae
            vitae dicta sunt explicabo.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
            consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
            quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8]'>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam,
            nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in
            ea voluptate velit esse quam nihil molestiae consequatur.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: INTERACTIVE MAP — Scrollpoints / Main viz
          ═══════════════════════════════════════════════════════ */}
      <section className='bg-[#f0f4f3]'>
        <div className='max-w-5xl mx-auto px-6 sm:px-12 py-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#1b3a4b] mb-2'>
            La expansión en el mapa
          </h2>
          <p className='text-[#1b3a4b]/60 mb-6 text-base'>
            Evolución de las concesiones salmoneras por región (1985–2025). Presiona play o arrastra el slider.
          </p>
        </div>
        <div className='relative w-full' style={{ height: '90vh', minHeight: 600 }}>
          <Suspense fallback={<Loading />}>
            <MapaTimelineDatos />
          </Suspense>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: TEXT — Post-map analysis
          ═══════════════════════════════════════════════════════ */}
      <section className='py-16 sm:py-20'>
        <div className='max-w-3xl mx-auto px-6 sm:px-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#1b3a4b] mb-8'>
            El boom de los 2000
          </h2>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin at vestibulum magna.
            Curabitur hendrerit odio eu eros tincidunt, non lacinia sem fermentum. Integer
            malesuada lorem a turpis efficitur, at ultricies velit fringilla. Aliquam erat
            volutpat.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8]'>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: FULL-WIDTH IMAGE
          ═══════════════════════════════════════════════════════ */}
      <section className='relative'>
        <img
          src='https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80'
          alt='Salmon farming pens in a Chilean fjord'
          className='w-full h-[50vh] sm:h-[60vh] object-cover'
        />
        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 sm:px-12 py-6'>
          <p className='text-white/70 text-sm max-w-3xl'>
            Balsas-jaula en un fiordo de la Región de Aysén. Fotografía referencial. / Unsplash
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: TEXT — Continued narrative
          ═══════════════════════════════════════════════════════ */}
      <section className='py-16 sm:py-20'>
        <div className='max-w-3xl mx-auto px-6 sm:px-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#1b3a4b] mb-8'>
            La crisis del virus ISA
          </h2>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce in ligula at mi
            consequat tincidunt. Phasellus blandit, nulla at vehicula pharetra, sapien risus
            tristique leo, id laoreet lacus nisl eget velit. Quisque volutpat auctor elit,
            at molestie enim imperdiet at.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8]'>
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus
            error sit voluptatem accusantium doloremque laudantium.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8: BLOCKQUOTE — Dark background
          ═══════════════════════════════════════════════════════ */}
      <section className='bg-[#0d1b2a] py-20 sm:py-28'>
        <div className='max-w-4xl mx-auto px-6 sm:px-12'>
          <blockquote className='text-2xl sm:text-4xl font-bold text-white leading-snug'>
            "La salmonicultura cambió para siempre la relación entre las comunidades
            costeras y el mar que las alimentó durante generaciones."
          </blockquote>
          <p className='text-[#7ec8c8] mt-6 text-base'>
            — Nombre del entrevistado, cargo o institución
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9: TEXT — Post-quote continuation
          ═══════════════════════════════════════════════════════ */}
      <section className='py-16 sm:py-20'>
        <div className='max-w-3xl mx-auto px-6 sm:px-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#1b3a4b] mb-8'>
            El impacto ambiental
          </h2>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi euismod, urna eu
            tempor consectetur, ante nisi aliquet nisi, eu tempor orci est vel odio. Nullam
            consequat aliquam dapibus. Fusce vehicula dolor arcu, sit amet blandit dolor
            mollis nec.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8]'>
            Donec sollicitudin molestie malesuada. Nulla porttitor accumsan tincidunt.
            Proin eget tortor risus. Mauris blandit aliquet elit, eget tincidunt nibh
            pulvinar a. Vivamus suscipit tortor eget felis porttitor volutpat.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 10: PARALLAX IMAGE + QUOTE — Dark reveal
          ═══════════════════════════════════════════════════════ */}
      <section className='relative h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src='https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=1920&q=80'
            alt='Underwater salmon farm'
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-[#0d1b2a]/70' />
        </div>
        <div className='relative z-10 max-w-3xl mx-auto px-6 sm:px-12 text-center'>
          <p className='text-3xl sm:text-5xl font-bold text-white leading-snug'>
            Más de <span className='text-[#7ec8c8]'>1.300</span> concesiones otorgadas en 40 años
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 11: TEXT — Final analysis
          ═══════════════════════════════════════════════════════ */}
      <section className='py-16 sm:py-20'>
        <div className='max-w-3xl mx-auto px-6 sm:px-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#1b3a4b] mb-8'>
            El futuro de la industria
          </h2>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus magna justo,
            lacinia eget consectetur sed, convallis at tellus. Curabitur non nulla sit amet
            nisl tempus convallis quis ac lectus. Pellentesque in ipsum id orci porta dapibus.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8] mb-6'>
            Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur
            arcu erat, accumsan id imperdiet et, porttitor at sem. Nulla quis lorem ut libero
            malesuada feugiat. Sed porttitor lectus nibh.
          </p>
          <p className='text-[#1b3a4b]/80 text-lg leading-[1.8]'>
            Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Donec
            sollicitudin molestie malesuada. Quisque velit nisi, pretium ut lacinia in,
            elementum id enim.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 12: TWO-COLUMN — Methodology
          ═══════════════════════════════════════════════════════ */}
      <section className='bg-[#f0f4f3] py-16 sm:py-20'>
        <div className='max-w-5xl mx-auto px-6 sm:px-12'>
          <h2 className='text-xl font-bold text-[#1b3a4b] mb-8 uppercase tracking-widest text-center'>
            Metodología
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12'>
            <div>
              <h3 className='text-base font-bold text-[#1b3a4b] mb-3'>Fuentes de datos</h3>
              <p className='text-[#1b3a4b]/70 text-base leading-[1.8]'>
                Los datos de concesiones salmoneras fueron obtenidos del Servicio Nacional de
                Pesca y Acuicultura (SERNAPESCA) y la Subsecretaría de Pesca (Subpesca),
                con información actualizada a noviembre de 2025. Los registros de denuncias
                provienen de la Superintendencia del Medio Ambiente (SMA).
              </p>
            </div>
            <div>
              <h3 className='text-base font-bold text-[#1b3a4b] mb-3'>Procesamiento</h3>
              <p className='text-[#1b3a4b]/70 text-base leading-[1.8]'>
                Las coordenadas de los centros de cultivo fueron georreferenciadas y cruzadas
                con los datos administrativos de concesiones. La visualización temporal se
                construyó a partir de las fechas de resolución de cada centro, permitiendo
                reconstruir la línea de tiempo de la expansión salmonera.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 13: CREDITS — Footer
          ═══════════════════════════════════════════════════════ */}
      <section className='bg-[#0d1b2a] py-16 sm:py-20'>
        <div className='max-w-4xl mx-auto px-6 sm:px-12'>
          <h2 className='text-xs font-bold text-white/40 mb-8 uppercase tracking-widest'>
            Créditos
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-8'>
            <div>
              <p className='text-white/40 text-xs uppercase tracking-wider mb-2'>Dirección</p>
              <p className='text-white/80 text-sm'>Nombre Director/a</p>
              <p className='text-white/50 text-xs mt-1'>Escuela de Periodismo UDP</p>
            </div>
            <div>
              <p className='text-white/40 text-xs uppercase tracking-wider mb-2'>Reporteo y redacción</p>
              <p className='text-white/80 text-sm'>Nombre Periodista 1</p>
              <p className='text-white/80 text-sm'>Nombre Periodista 2</p>
              <p className='text-white/80 text-sm'>Nombre Periodista 3</p>
            </div>
            <div>
              <p className='text-white/40 text-xs uppercase tracking-wider mb-2'>Visualización de datos</p>
              <p className='text-white/80 text-sm'>Cristian Hernández M.</p>
              <p className='text-white/50 text-xs mt-1'>Tremen SpA</p>
            </div>
          </div>
          <div className='mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4'>
            <p className='text-white/30 text-xs'>
              Universidad Diego Portales · Escuela de Periodismo · 2026
            </p>
            <p className='text-white/30 text-xs'>
              Desarrollo: Tremen SpA
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
