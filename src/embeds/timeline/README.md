# Mapa 1 — Timeline de Concesiones Salmoneras (1985-2025)

Muestra la expansión histórica de las concesiones salmoneras en tres regiones del sur de Chile a través de un timeline animado.

## Qué visualiza

Tres mapas sincronizados (Los Lagos, Aysén, Magallanes) que se actualizan año a año mostrando qué centros salmoneros existían en cada momento. Cada columna tiene su propio gráfico de línea acumulativo. El usuario puede reproducir la animación o arrastrar el slider.

## Datos

| Archivo | Registros | Fuente | Campo clave |
|---------|-----------|--------|-------------|
| `centros_salmoneros.geojson` | 1,346 | SERNAPESCA | `F_RESOLSSF` (fecha resolución, formato `DD-MM-YYYY` o `YYYY-MM-DD`) |

**Parsing de fechas:** el campo `F_RESOLSSF` tiene dos formatos posibles en el dataset. El componente detecta cuál es y extrae el año correctamente:

```js
const parts = dateStr.split('-')
const y = parts[2].length === 4 ? parseInt(parts[2]) : parseInt(parts[0])
```

Los centros sin fecha válida se descartan del timeline.

## Arquitectura del componente

```
MapaTimelineDatos
├── RegionMap × 3          — cada columna con su propio mapa MapLibre
│   ├── Clustering          — fuente con cluster:true, radio 28px
│   ├── Gráfico SVG         — línea acumulativa con detección de elbows
│   └── Multiplicador       — ×N desde primer año con ≥10 concesiones
└── Timeline bar
    ├── Barras de histograma — clickeables, muestran acumulado global
    ├── Slider + play/pause
    └── Labels de año
```

### Clustering (MapLibre GL JS)

Los puntos usan `cluster: true` en la fuente GeoJSON para que a zoom bajo se vean grupos con conteo en lugar de puntos solapados. Al hacer click en un cluster se hace zoom automático hasta separar los puntos.

```js
mapRef.current.addSource('all', {
  type: 'geojson', data: allData,
  cluster: true, clusterRadius: 28, clusterMaxZoom: 10,
})
```

Tres capas:
1. `clusters` — círculos naranjos, tamaño según `point_count` (4 escalones: 10/14/19/24px)
2. `cluster-count` — etiqueta con número dentro del cluster
3. `pts` — puntos individuales visibles a partir de zoom 10 (filtro `['!', ['has', 'point_count']]`)

### Detección de elbows (años de aceleración)

El componente calcula automáticamente los años donde el ritmo de nuevas concesiones tuvo un salto estadísticamente significativo. Usa la aceleración (cambio en concesiones nuevas por año) con umbral `max(media × 1.5, 3)`. Los elbows se muestran como líneas verticales punteadas en el gráfico y círculos pulsantes animados.

### Actualización del mapa con el año

Cada frame de la animación llama a `setData()` en la fuente existente con los centros filtrados por `year <= currentYear`. MapLibre reclusteriza automáticamente sin recrear capas:

```js
mapRef.current.getSource('all').setData(mkGJ(regionCentros))
```

### Escala Y compartida

El eje Y de los tres gráficos SVG usa `globalMaxVal` — el máximo histórico a través de todas las regiones — para que las escalas sean comparables entre columnas.

## Decisiones de diseño

- **Pitch 50° (desktop) / 65° (mobile):** da profundidad geográfica al mapa, distingue archipiélagos de Chiloé y canales australes.
- **Scroll zoom desactivado:** evita que el usuario quede atrapado en el mapa al scrollear el artículo en WordPress.
- **Touch desactivado en mobile:** por la misma razón, en pantallas pequeñas el mapa es estático y el gráfico reemplaza la interactividad.
- **Color naranja `#e07b39`:** elegido por UDP para contrastar con el mapa base Voyager (tonos beige/gris).

## Historial de cambios relevantes

| Versión | Cambio |
|---------|--------|
| v1 | Heatmap de densidad + puntos individuales visibles desde zoom 9 |
| v2 (correcciones UDP abril 2026) | Eliminado heatmap, reemplazado por clustering nativo. Color cambiado de teal `#3a9e9e` a naranja `#e07b39`. |

## Embed en WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=timeline"
    width="100%" height="700" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `MapaTimelineDatos.jsx` | Componente principal: mapas, clustering, gráficos, animación |
| `EmbedTimeline.jsx` | Wrapper full-viewport para iframe. Inyecta CSS que fuerza layout desktop dentro del iframe (breakpoints Tailwind responden al ancho del iframe, no del dispositivo) |
