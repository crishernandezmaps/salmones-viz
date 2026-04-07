# Mapa 2 — Conflicto: Concesiones vs Áreas Protegidas

Cruza la ubicación de los 1,346 centros salmoneros con áreas marinas y terrestres protegidas, denuncias ambientales, procesos sancionatorios por sobreproducción y solicitudes de relocalización.

## Qué visualiza

- Polígonos de Áreas Marinas Protegidas (AMP) — relleno teal semitransparente
- Polígonos de áreas protegidas terrestres SNASPE — relleno verde punteado
- Centros salmoneros codificados por color según su situación
- Panel lateral con ficha del centro seleccionado y ranking de holdings sancionados
- Mini-mapa de detalle con conector trapezoidal al punto seleccionado

## Código de colores de los puntos

| Color | Significado |
|-------|-------------|
| Teal `#5b9ea6` | Centro sin conflicto ni denuncia |
| Teal + borde amarillo | Centro con denuncia (sin conflicto) |
| Naranja `#ff8c00` (triángulo) | Dentro de área marina protegida |
| Naranja + borde amarillo | En área protegida + con denuncia |
| Rojo oscuro `#b71c1c` + borde amarillo | Proceso sancionatorio por sobreproducción |
| Azul `#1565c0` | Solicitud de relocalización |

Los colores de los centros "normales" (teal) se eligieron para contrastar con el rojo oscuro de sobreproducción, cumpliendo el pedido editorial de que las dos categorías sean visualmente opuestas.

## Datos

| Archivo | Registros | Fuente |
|---------|-----------|--------|
| `centros_salmoneros.geojson` | 1,346 | SERNAPESCA |
| `concesiones_excel.json` | 1,346 | Subpesca |
| `denuncias.json` | 102 | SMA |
| `sobreproduccion.json` | 118 | SMA |
| `relocalizaciones.json` | 198 | Subpesca |
| `amp_nacional.topojson` | 32 | MMA |
| `snaspe_terrestre.topojson` | 25 | OSM + CONAF |

### Cómo se construyó `snaspe_terrestre.topojson`

Los datos de parques y reservas nacionales terrestres no estaban disponibles en el repositorio original. Se construyó en dos pasos:

1. **Descarga desde Overpass API (OpenStreetMap):** se consultaron todas las relaciones con `boundary=national_park` en el bbox de las tres regiones salmoneras (`-56,-76,-40,-70`). Devolvió 24 áreas (parques nacionales, reservas nacionales, monumentos naturales).

2. **Complemento con shapefile CONAF:** el shapefile `l_reservasnacionales.shp` (disponible localmente en `material/INTENTOS MAPAS/`) aportó `Trapananda` y otras reservas del sur no presentes en OSM.

3. **Procesamiento Python:** conversión de geometrías OSM (relaciones con members `outer`) a polígonos Shapely, simplificación con tolerancia 0.005° (~500m), exportación a GeoJSON → TopoJSON.

```
Original OSM: 1.4 MB → Simplificado: 91 KB → TopoJSON final: 93 KB
```

Incluye: Laguna San Rafael, Las Guaitecas, Kawésqar, Bernardo O'Higgins, Pumalín, Torres del Paine, Hornopirén, Queulat, Cerro Castillo, Patagonia, y otros.

## Arquitectura del componente

```
MapaConflicto
├── Mapa principal (MapLibre)
│   ├── Capa snaspe-fill / snaspe-outline   — áreas terrestres SNASPE (verde)
│   ├── Capa amp-fill / amp-outline          — AMPs marinas (teal)
│   ├── Capa centros-heat                    — heatmap de densidad (visible zoom < 10)
│   ├── Capas layer-{normal|denuncia|conflict|conflict_denuncia}
│   ├── Capa layer-sobreproduccion
│   └── Capa layer-relocalizacion
├── InsetWithConnector                       — mini-mapa + conector trapezoidal SVG
├── Leyenda (capas toggle)                   — checkboxes fusionados con color dot
└── FichaPanel
    ├── Header con holding y comuna
    ├── Paginación por ranking de holdings
    ├── Alertas (dentro de área protegida)
    ├── Timeline vertical de procesos sancionatorios
    ├── Sección de relocalizaciones
    └── Datos de ubicación y concesionario
```

### Clasificación de centros

Al cargar, cada centro se clasifica en una de cuatro categorías usando `booleanPointInPolygon` de Turf.js contra los polígonos AMP:

```js
function getCategory(isConflict, hasDenuncia) {
  if (isConflict && hasDenuncia) return 'conflict_denuncia'
  if (isConflict) return 'conflict'
  if (hasDenuncia) return 'denuncia'
  return 'normal'
}
```

Cada categoría tiene su propia fuente y capa GeoJSON para poder togglear visibilidad independientemente.

### Ranking de holdings

Se construye un ranking por empresa titular contando cuántos procesos sancionatorios tiene. Al cargar el mapa se selecciona automáticamente el holding con más procesos. La paginación Anterior/Siguiente navega entre holdings haciendo `flyTo` al primer centro de cada holding.

### Mini-mapa inset

Al seleccionar un punto, aparece un mini-mapa de detalle a zoom 12 con un pin pulsante, conectado visualmente al punto seleccionado mediante un trapezoide SVG con gradiente. La posición del conector se recalcula en cada evento `move` del mapa principal.

### Ficha simplificada (correcciones UDP abril 2026)

Se eliminaron los campos: RUT, Toponimio, Grupo Especie, Barrio. Se conservan: Titular, Especies, Superficie, Fecha resolución, Ubicación.

## Embed en WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=conflicto"
    width="100%" height="700" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `MapaConflicto.jsx` | Componente principal (~750 líneas): mapa, clasificación de centros, ficha, ranking, mini-mapa |
| `EmbedConflicto.jsx` | Wrapper full-viewport para iframe |
