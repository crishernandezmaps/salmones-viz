import { useEffect, useState, useMemo, useRef, useCallback, memo } from 'react'

const BASE = import.meta.env.BASE_URL

// Squarified treemap layout algorithm
function squarify(items, x, y, w, h) {
  if (items.length === 0) return []
  const total = items.reduce((s, d) => s + d.value, 0)
  if (total === 0) return []

  const rects = []
  let remaining = [...items]
  let cx = x, cy = y, cw = w, ch = h

  while (remaining.length > 0) {
    const remTotal = remaining.reduce((s, d) => s + d.value, 0)
    const isWide = cw >= ch

    let row = [remaining[0]]
    let rowSum = remaining[0].value

    for (let i = 1; i < remaining.length; i++) {
      const newRow = [...row, remaining[i]]
      const newSum = rowSum + remaining[i].value
      if (worstRatio(row, rowSum, remTotal, isWide ? cw : ch) <=
          worstRatio(newRow, newSum, remTotal, isWide ? cw : ch)) {
        break
      }
      row = newRow
      rowSum = newSum
    }

    const rowFraction = rowSum / remTotal
    const rowSize = isWide ? cw * rowFraction : ch * rowFraction

    let offset = 0
    for (const item of row) {
      const itemFraction = item.value / rowSum
      const itemSize = (isWide ? ch : cw) * itemFraction

      if (isWide) {
        rects.push({ ...item, x: cx, y: cy + offset, w: rowSize, h: itemSize })
      } else {
        rects.push({ ...item, x: cx + offset, y: cy, w: itemSize, h: rowSize })
      }
      offset += itemSize
    }

    if (isWide) {
      cx += rowSize
      cw -= rowSize
    } else {
      cy += rowSize
      ch -= rowSize
    }

    remaining = remaining.slice(row.length)
  }

  return rects
}

function worstRatio(row, rowSum, total, side) {
  const s = (rowSum / total) * side
  let worst = 0
  for (const item of row) {
    const r = (item.value / rowSum) * side
    const area = (item.value / total) * side * side
    const w = Math.max((s * s) / (area || 1), (area) / (s * s || 1))
    if (w > worst) worst = w
  }
  return worst
}

// Color scale — darker = more processes
const COLORS = [
  '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a',
  '#009688', '#00897b', '#00796b', '#00695c',
  '#004d40',
]

function getColor(value, max) {
  const t = Math.min(value / max, 1)
  const idx = Math.min(Math.floor(t * (COLORS.length - 1)), COLORS.length - 1)
  return COLORS[idx]
}

const MAX_CENTROS_SHOWN = 10

const DetailPanel = memo(function DetailPanel({ active, maxCount }) {
  const [showAll, setShowAll] = useState(false)

  // Reset showAll when active changes
  useEffect(() => { setShowAll(false) }, [active?.name])

  const panelStyle = {
    width: 280, flexShrink: 0, background: 'white', borderRadius: 8,
    border: '1px solid rgba(27,58,75,0.1)', padding: 16, overflowY: 'auto',
    fontSize: 13, color: '#1b3a4b',
  }

  if (!active) {
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3, textAlign: 'center' }}>
          <p>Selecciona una empresa para ver el detalle de sus procesos sancionatorios</p>
        </div>
      </div>
    )
  }

  const visibleCentros = showAll ? active.centros : active.centros.slice(0, MAX_CENTROS_SHOWN)
  const hasMore = active.centros.length > MAX_CENTROS_SHOWN

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.4, marginBottom: 4 }}>Titular</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{active.name}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#f0f4f3', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#00796b' }}>{active.count}</div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>Procesos</div>
        </div>
        <div style={{ background: '#f0f4f3', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d94040' }}>{active.avgExceso}%</div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>Exceso promedio</div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.4, marginBottom: 8 }}>
        Centros sancionados ({active.centros.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visibleCentros.map((c, i) => (
          <div key={i} style={{
            padding: '6px 8px', background: '#f8fafa', borderRadius: 4,
            borderLeft: '3px solid ' + getColor(active.count, maxCount),
          }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{c.nombre_centro}</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
              {c.expediente} — {c.estado_procedimiento}
            </div>
            {(c.excesos || []).map((e, j) => (
              <div key={j} style={{ fontSize: 11, color: '#d94040', marginTop: 2 }}>
                {e.exceso_pct}% exceso ({e.fecha_inicio.slice(0, 7)} a {e.fecha_fin.slice(0, 7)})
              </div>
            ))}
          </div>
        ))}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              background: 'none', border: '1px solid rgba(27,58,75,0.15)', borderRadius: 4,
              padding: '6px', fontSize: 11, color: '#1b3a4b', opacity: 0.6, cursor: 'pointer',
            }}
          >
            Ver {active.centros.length - MAX_CENTROS_SHOWN} centros mas...
          </button>
        )}
      </div>
    </div>
  )
})

export default function TreemapSobreproduccion() {
  const [data, setData] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const hoveredRef = useRef(null)

  useEffect(() => {
    fetch(BASE + 'data/sobreproduccion.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  const holdings = useMemo(() => {
    if (!data) return []
    const map = {}
    for (const d of data) {
      const name = d.titular
      if (!map[name]) {
        map[name] = { name, count: 0, centros: [], totalExceso: 0, excesos: 0 }
      }
      map[name].count++
      map[name].centros.push(d)
      for (const e of d.excesos || []) {
        map[name].totalExceso += e.exceso_pct
        map[name].excesos++
      }
    }
    return Object.values(map)
      .map(h => ({
        ...h,
        value: h.count,
        avgExceso: h.excesos > 0 ? Math.round(h.totalExceso / h.excesos * 10) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  const maxCount = useMemo(() => Math.max(...holdings.map(h => h.value), 1), [holdings])

  const rects = useMemo(() => {
    if (holdings.length === 0) return []
    return squarify(holdings, 0, 0, 100, 100)
  }, [holdings])

  const active = selected || hovered

  if (!data) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f3' }}>
        <p style={{ color: '#1b3a4b', opacity: 0.4 }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f4f3', fontFamily: 'Roboto, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 8px', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1b3a4b' }}>
          Procesos sancionatorios por sobreproduccion
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1b3a4b', opacity: 0.5 }}>
          {data.length} procesos en {holdings.length} empresas titulares — Fuente: SMA
        </p>
      </div>

      {/* Treemap + detail panel */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '8px 16px 16px', gap: 16 }}>
        {/* Treemap */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <style>{`
            .tm-cell { transition: opacity 0.15s; }
            .tm-group:hover .tm-cell { opacity: 0.35; }
            .tm-group .tm-cell:hover { opacity: 1; }
            .tm-cell:hover rect.tm-bg { stroke: #1b3a4b; stroke-width: 0.4; }
            .tm-selected rect.tm-bg { stroke: #1b3a4b; stroke-width: 0.4; opacity: 1; }
          `}</style>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
            className="tm-group"
          >
            {rects.map((r) => (
              <g key={r.name}
                className={'tm-cell' + (selected?.name === r.name ? ' tm-selected' : '')}
                onMouseEnter={() => { hoveredRef.current = r; setHovered(r) }}
                onMouseLeave={() => { if (hoveredRef.current?.name === r.name) { hoveredRef.current = null; setHovered(null) } }}
                onClick={() => setSelected(selected?.name === r.name ? null : r)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  className="tm-bg"
                  x={r.x + 0.15} y={r.y + 0.15}
                  width={Math.max(r.w - 0.3, 0)} height={Math.max(r.h - 0.3, 0)}
                  fill={getColor(r.value, maxCount)}
                  stroke="#f0f4f3"
                  strokeWidth={0.2}
                  rx={0.3}
                />
                {r.w > 8 && r.h > 6 && (
                  <text
                    x={r.x + r.w / 2} y={r.y + r.h / 2 - 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={r.w > 20 ? 2.2 : 1.6} fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {r.name.length > 18 ? r.name.slice(0, 16) + '...' : r.name}
                  </text>
                )}
                {r.w > 8 && r.h > 10 && (
                  <text
                    x={r.x + r.w / 2} y={r.y + r.h / 2 + 2.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(255,255,255,0.8)" fontSize={r.w > 20 ? 1.8 : 1.3}
                    style={{ pointerEvents: 'none' }}
                  >
                    {r.value} proceso{r.value !== 1 ? 's' : ''}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Detail panel */}
        <DetailPanel active={active} maxCount={maxCount} />
      </div>
    </div>
  )
}
