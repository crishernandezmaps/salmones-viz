# Mapa 3 — Treemap de Sobreproducción

Visualiza los procesos sancionatorios por sobreproducción de biomasa, agrupados por empresa titular, como un treemap interactivo.

## Qué visualiza

Cada rectángulo representa una empresa (holding). El área es proporcional al número de procesos sancionatorios. El color indica intensidad (más oscuro = más procesos). Al hacer hover o click se muestra el panel de detalle con cada expediente, porcentaje de exceso y estado del proceso.

## Datos

| Archivo | Registros | Fuente |
|---------|-----------|--------|
| `sobreproduccion.json` | 118 procesos | SMA (Superintendencia del Medio Ambiente) |

### Estructura de `sobreproduccion.json`

```json
{
  "titular": "MOWI CHILE S.A.",
  "codigo_centro": 101234,
  "expediente": "D-259-2023",
  "estado_procedimiento": "PDC en Análisis",
  "excesos": [
    { "fecha_inicio": "2019-09-06", "fecha_fin": "2020-11-15", "exceso_pct": 4.3 }
  ]
}
```

## Algoritmo de layout: Squarified Treemap

El layout usa el algoritmo **squarify** implementado desde cero (sin dependencias externas). Produce rectángulos con aspect ratio más cercano a 1 que el treemap clásico, haciendo los labels más legibles.

```
squarify(items, x, y, w, h)
  → divide recursivamente el espacio en filas
  → cada fila se corta en columnas proporcionales al valor
  → elige orientación (horizontal/vertical) según el lado más largo
```

La función `worstRatio` evalúa qué tan "cuadrados" quedan los rectángulos de una fila y decide si agregar más ítems o cerrar la fila actual.

### Escala de color

9 tonos del espectro teal de Material Design (`#b2dfdb` → `#004d40`), mapeados linealmente desde 0 hasta `maxCount`. Se eligió teal para diferenciar visualmente del rojo/naranja de los otros dos mapas.

## Arquitectura del componente

```
TreemapSobreproduccion
├── useMemo: holdings         — agrupación por titular, suma procesos y excesos
├── useMemo: rects            — layout squarify en espacio normalizado 0-100
├── SVG viewBox="0 0 100 100" — coordenadas en porcentaje, preserveAspectRatio=none
│   └── <g> por holding       — hover/click → estado hovered/selected
└── DetailPanel (memo)
    ├── Métricas: N procesos, exceso promedio %
    └── Lista de centros sancionados (paginada a 10, expandible)
```

### Por qué SVG con viewBox normalizado

El treemap usa coordenadas `0-100` en el viewBox con `preserveAspectRatio="none"`, lo que hace que el layout se estire para ocupar cualquier tamaño de contenedor sin recalcular. Los textos usan `fontSize` en unidades del viewBox (~1.6-2.2), lo que hace que escalen proporcionalmente.

### Hover vs selected

Hay dos estados independientes:
- `hovered` — se activa con `onMouseEnter/Leave`, se limpia al salir
- `selected` — se activa con `onClick`, persiste hasta hacer click de nuevo

El panel muestra `selected || hovered` (selected tiene prioridad). `DetailPanel` está envuelto en `memo` para evitar re-renders al mover el mouse.

### CSS de dim/highlight

El efecto de oscurecer los demás rectángulos al hacer hover se implementa con CSS puro, sin React:

```css
.tm-group:hover .tm-cell { opacity: 0.35; }
.tm-group .tm-cell:hover { opacity: 1; }
```

Esto es más performante que manejar estado por cada celda.

## Embed en WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=treemap"
    width="100%" height="600" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `TreemapSobreproduccion.jsx` | Algoritmo squarify, SVG treemap, panel de detalle |
| `EmbedTreemap.jsx` | Wrapper full-viewport para iframe |
