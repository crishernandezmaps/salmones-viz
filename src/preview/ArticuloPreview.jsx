const BASE = import.meta.env.BASE_URL

/* ── Section types ── */

function HeroSection() {
  return (
    <section style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a4b 40%, #1a4a5a 70%, #0d1b2a 100%)',
    }}>
      {/* Subtle animated grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'radial-gradient(circle at 20% 80%, #3a9e9e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #7ec8c8 0%, transparent 40%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, padding: '0 clamp(2rem, 6vw, 8rem)',
        paddingBottom: 'clamp(4rem, 10vh, 8rem)', maxWidth: 900,
      }}>
        <div style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: 4,
          color: '#3a9e9e', marginBottom: 20, fontWeight: 600,
        }}>
          Centro de Investigacion Periodistica UDP
        </div>
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.05,
          color: '#fff', margin: 0, marginBottom: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          Asi nadan los salmones en Chile
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.35rem)', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}>
          Cuatro decadas de expansion, conflictos ambientales y sobreproduccion
          en la industria salmonera del sur de Chile.
        </p>

        <div style={{
          marginTop: 40, fontSize: 12, color: 'rgba(255,255,255,0.35)',
          fontFamily: 'system-ui, sans-serif', display: 'flex', gap: 20, flexWrap: 'wrap',
        }}>
          <span>Equipo de Investigacion UDP</span>
          <span>Visualizaciones: Tremen</span>
          <span>Abril 2026</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        <span>Scroll</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 8 L10 14 L16 8" />
        </svg>
      </div>
    </section>
  )
}

function TextSection({ children, dark = false }) {
  return (
    <section style={{
      background: dark ? '#0d1b2a' : '#fff',
      color: dark ? 'rgba(255,255,255,0.8)' : '#1a1a1a',
      padding: 'clamp(4rem, 12vh, 8rem) clamp(2rem, 6vw, 4rem)',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 640, width: '100%',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)', lineHeight: 1.85,
      }}>
        {children}
      </div>
    </section>
  )
}

function HeadingSection({ kicker, title, subtitle, dark = false }) {
  return (
    <section style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', textAlign: 'center',
      background: dark ? '#0d1b2a' : '#f0f4f3',
      padding: 'clamp(4rem, 10vh, 8rem) clamp(2rem, 6vw, 4rem)',
    }}>
      {kicker && (
        <div style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: 4,
          color: '#3a9e9e', marginBottom: 16, fontWeight: 600,
        }}>
          {kicker}
        </div>
      )}
      <h2 style={{
        fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.1,
        color: dark ? '#fff' : '#1b3a4b', margin: 0, maxWidth: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)', lineHeight: 1.6,
          color: dark ? 'rgba(255,255,255,0.5)' : '#1b3a4b80', maxWidth: 520,
          marginTop: 16, fontFamily: 'Georgia, serif',
        }}>
          {subtitle}
        </p>
      )}
    </section>
  )
}

function VizSection({ embedKey, height = '100vh' }) {
  const src = `${BASE}?embed=${embedKey}`
  return (
    <section style={{ width: '100%', height, position: 'relative', background: '#f0f4f3' }}>
      <iframe
        src={src}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, display: 'block' }}
        allowFullScreen
        title={embedKey}
      />
    </section>
  )
}

function DataCallout({ items }) {
  return (
    <section style={{
      background: '#0d1b2a', padding: 'clamp(3rem, 8vh, 6rem) clamp(2rem, 6vw, 4rem)',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'clamp(1.5rem, 3vw, 3rem)', maxWidth: 800, width: '100%',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800,
              color: '#3a9e9e', lineHeight: 1, fontFamily: 'system-ui, sans-serif',
            }}>
              {item.value}
            </div>
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8,
              textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'system-ui, sans-serif',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function DividerQuote({ text, author }) {
  return (
    <section style={{
      minHeight: '50vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: '#1b3a4b', padding: 'clamp(4rem, 10vh, 8rem) clamp(2rem, 6vw, 4rem)',
    }}>
      <blockquote style={{
        maxWidth: 640, textAlign: 'center', margin: 0,
        fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', lineHeight: 1.6,
        color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia, serif', fontStyle: 'italic',
      }}>
        {text}
      </blockquote>
      {author && (
        <cite style={{
          display: 'block', marginTop: 20, fontSize: 13, fontStyle: 'normal',
          color: '#3a9e9e', letterSpacing: 1, textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {author}
        </cite>
      )}
    </section>
  )
}

/* ── Main ── */

export default function ArticuloPreview() {
  return (
    <div style={{ background: '#fff', overflowX: 'hidden' }}>
      <style>{`
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        ::selection { background: #3a9e9e; color: #fff; }
      `}</style>

      <HeroSection />

      <DataCallout items={[
        { value: '1.346', label: 'Centros de cultivo' },
        { value: '40', label: 'Anos de expansion' },
        { value: '118', label: 'Procesos sancionatorios' },
        { value: '3', label: 'Regiones' },
      ]} />

      <TextSection>
        <p style={{ margin: '0 0 1.5em' }}>
          Desde mediados de la decada de 1980, la industria salmonera en Chile ha experimentado
          un crecimiento sin precedentes. Lo que comenzo como un punado de concesiones en la
          Region de Los Lagos se ha expandido hasta convertirse en una de las principales
          industrias exportadoras del pais, con mas de 1.300 centros de cultivo distribuidos
          en tres regiones del sur de Chile.
        </p>
        <p style={{ margin: 0 }}>
          Chile es hoy el segundo mayor productor de salmon del mundo, solo detras de Noruega.
          Pero esta expansion no ha estado exenta de conflictos: denuncias ambientales,
          sobreproduccion sistematica y operaciones dentro de areas marinas protegidas han
          marcado el camino de una industria que mueve miles de millones de dolares al ano.
        </p>
      </TextSection>

      {/* ── VIZ 1: Timeline ── */}
      <HeadingSection
        kicker="Capitulo 1"
        title="Cuatro decadas de expansion"
        subtitle="La evolucion de las concesiones salmoneras en Los Lagos, Aysen y Magallanes entre 1985 y 2025."
      />

      <VizSection embedKey="timeline" height="100vh" />

      <TextSection>
        <p style={{ margin: '0 0 1.5em' }}>
          Los datos revelan periodos de expansion particularmente intensos. En la Region de
          Los Lagos, el numero de concesiones se multiplico significativamente durante la
          decada de 1990 y principios de los 2000. Aysen, en tanto, experimento su mayor
          crecimiento a partir del ano 2000, cuando la industria comenzo a buscar nuevas
          aguas tras la saturacion de Los Lagos.
        </p>
        <p style={{ margin: 0 }}>
          Magallanes representa la frontera mas reciente de expansion. Aunque su crecimiento
          ha sido mas gradual, la region ha visto un aumento sostenido de concesiones en la
          ultima decada, generando nuevos debates sobre el equilibrio entre desarrollo
          economico y proteccion ambiental en zonas pristinas.
        </p>
      </TextSection>

      {/* ── VIZ 2: Conflicto ── */}
      <HeadingSection
        kicker="Capitulo 2"
        title="Salmones en zonas protegidas"
        subtitle="Concesiones activas dentro de areas marinas protegidas, denuncias y procesos sancionatorios."
        dark
      />

      <VizSection embedKey="conflicto" height="100vh" />

      <DividerQuote
        text="&laquo;Al cruzar datos geoespaciales de SERNAPESCA con las areas marinas protegidas, se identificaron concesiones activas dentro de zonas que deberian estar resguardadas.&raquo;"
        author="Investigacion UDP-Tremen, 2026"
      />

      <TextSection>
        <p style={{ margin: '0 0 1.5em' }}>
          Los procesos sancionatorios por sobreproduccion — donde los centros producen
          mas toneladas de salmon de las autorizadas — son particularmente preocupantes
          cuando ocurren dentro o cerca de areas protegidas. El exceso de biomasa genera
          mayor contaminacion organica, uso de antibioticos y riesgo de escape de
          ejemplares, todos factores que impactan directamente los ecosistemas marinos.
        </p>
        <p style={{ margin: 0 }}>
          La navegacion por holding en el mapa permite recorrer las empresas con mayor
          numero de sanciones, revelando que la sobreproduccion no es un fenomeno aislado
          sino un patron sistematico en algunos grupos economicos.
        </p>
      </TextSection>

      {/* ── VIZ 3: Treemap ── */}
      <HeadingSection
        kicker="Capitulo 3"
        title="Los principales infractores"
        subtitle="Procesos sancionatorios por sobreproduccion agrupados por empresa titular."
      />

      <VizSection embedKey="treemap" height="85vh" />

      <TextSection>
        <p style={{ margin: '0 0 1.5em' }}>
          El treemap permite visualizar la proporcion de procesos sancionatorios que
          concentra cada holding. Al seleccionar una empresa, se despliegan los centros
          involucrados, el expediente de cada proceso y el porcentaje de exceso de
          produccion detectado. Algunas empresas superaron su produccion autorizada
          en mas de un 100%.
        </p>
        <p style={{ margin: 0 }}>
          La Superintendencia del Medio Ambiente ha abierto decenas de procesos
          sancionatorios, pero la concentracion en un pequeno numero de holdings
          plantea preguntas sobre la efectividad de las sanciones como mecanismo
          disuasivo.
        </p>
      </TextSection>

      {/* ── Cierre ── */}
      <section style={{
        background: '#0d1b2a', padding: 'clamp(5rem, 12vh, 10rem) clamp(2rem, 6vw, 4rem)',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
          <div style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 4,
            color: '#3a9e9e', marginBottom: 20, fontWeight: 600,
          }}>
            Metodologia
          </div>
          <p style={{
            fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', lineHeight: 1.8,
            color: 'rgba(255,255,255,0.5)', fontFamily: 'Georgia, serif', margin: '0 0 2rem',
          }}>
            Este reportaje se basa en datos publicos de SERNAPESCA (centros de cultivo),
            Subsecretaria de Pesca (concesiones y relocalizaciones), Ministerio del Medio
            Ambiente (areas marinas protegidas) y Superintendencia del Medio Ambiente
            (denuncias y procesos sancionatorios). Los datos fueron procesados y cruzados
            geoespacialmente.
          </p>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem',
            display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                Investigacion
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
                Centro de Investigacion Periodistica UDP
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                Visualizaciones
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
                Tremen
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '3rem', fontSize: 11, color: 'rgba(255,255,255,0.2)',
            fontFamily: 'system-ui, sans-serif',
          }}>
            Preview de articulo — Solo para revision interna — Abril 2026
          </div>
        </div>
      </section>
    </div>
  )
}
