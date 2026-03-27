# Salmones en Chile — Visualizaciones de Datos

Biblioteca de visualizaciones interactivas sobre la industria salmonera en Chile. Cada pieza es un componente independiente que se incrusta como iframe en WordPress.

Proyecto desarrollado por [Tremen SpA](https://tremen.tech) para la **Universidad Diego Portales (UDP)** como parte de una investigacion de periodismo de datos.

**Live**: [crishernandezmaps.github.io/salmones-viz](https://crishernandezmaps.github.io/salmones-viz/)

---

## Visualizaciones disponibles

| Pieza | Param | Descripcion | Docs |
|-------|-------|-------------|------|
| Timeline de Concesiones | `?embed=timeline` | Mapa 3 regiones con timeline animado 1985-2025 | [README](src/embeds/timeline/README.md) |
| Mapa de Conflicto | `?embed=conflicto` | Concesiones vs areas protegidas, denuncias, sobreproduccion | [README](src/embeds/conflicto/README.md) |

## Embed en WordPress

Cada visualizacion se incrusta como iframe en un bloque **Custom HTML**:

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=NOMBRE"
    width="100%" height="700" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

- `alignfull` es la clase de WordPress para full-width (tema Twenty Twenty-Five). Si se usa otro tema, buscar la clase equivalente.
- Usar bloque **Custom HTML**, no Code ni Visual.
- Los embeds fuerzan layout desktop independiente del ancho del iframe.

---

## Estructura del proyecto

```
salmones_viz/
├── public/data/                          # Datos compartidos (GeoJSON, TopoJSON, JSON)
├── src/
│   ├── App.jsx                           # Router de embeds (?embed=xxx)
│   ├── main.jsx                          # Entry point
│   ├── index.css                         # Tailwind + estilos base
│   ├── embeds/
│   │   ├── timeline/
│   │   │   ├── MapaTimelineDatos.jsx     # Mapa 3 regiones + timeline
│   │   │   ├── EmbedTimeline.jsx         # Wrapper iframe
│   │   │   └── README.md
│   │   └── conflicto/
│   │       ├── MapaConflicto.jsx         # Mapa de conflicto + panel ficha
│   │       ├── EmbedConflicto.jsx        # Wrapper iframe
│   │       └── README.md
│   └── shared/
│       └── constants.js                  # Paleta de colores, MAP_STYLE
├── scripts/
│   └── optimize-data.js                  # GeoJSON a TopoJSON
├── .github/workflows/deploy.yml          # CI/CD GitHub Pages
├── vite.config.js
└── package.json
```

---

## Datos

| Dataset | Archivo | Fuente | Registros |
|---------|---------|--------|-----------|
| Centros salmoneros | `centros_salmoneros.geojson` | SERNAPESCA | 1,346 |
| Concesiones (tabular) | `concesiones_excel.json` | Subpesca | 1,346 |
| Concesiones (geo) | `concesiones_salmones.topojson` | Subpesca | 1,351 |
| Areas Marinas Protegidas | `amp_nacional.topojson` | MMA | 32 |
| Areas Apropiadas (AAA) | `areas_apropiadas.topojson` | Subpesca | 1,277 |
| Denuncias | `denuncias.json` | SMA | 102 |
| Sobreproduccion | `sobreproduccion.json` | SMA | — |
| Relocalizaciones | `relocalizaciones.json` | Subpesca | — |

---

## Stack tecnico

| Tecnologia | Uso |
|------------|-----|
| React 19 | Componentes UI |
| Vite 8 | Build + dev server |
| Tailwind CSS 4 | Estilos |
| MapLibre GL JS 5 | Mapas vectoriales |
| TopoJSON Client | Decodificacion geodatos |
| CARTO Voyager | Tiles base (gratuito, sin API key) |

---

## Desarrollo local

```bash
git clone https://github.com/crishernandezmaps/salmones-viz.git
cd salmones-viz
npm install
npm run dev
```

Abre `http://localhost:5180/salmones-viz/`

- `?embed=timeline` — Timeline de concesiones
- `?embed=conflicto` — Mapa de conflicto
- Sin parametro — Indice de visualizaciones

---

## Deploy

Automatico via GitHub Actions en cada push a `main`. Genera build estatico y despliega en GitHub Pages.

---

## Como agregar una nueva visualizacion

1. Crear carpeta `src/embeds/mi-viz/` con el componente y su `EmbedMiViz.jsx`
2. Registrar en `App.jsx` agregando al objeto `EMBEDS`
3. Crear `README.md` con documentacion, datos y snippet de iframe
4. `npm run build && git push`

---

## Creditos

- **Desarrollo y visualizacion**: [Tremen SpA](https://tremen.tech) — Cristian Hernandez M.
- **Contenido periodistico**: Equipo de Periodismo, Universidad Diego Portales
- **Datos**: SERNAPESCA, Subpesca, SMA, MMA

Proyecto academico de periodismo de datos — Universidad Diego Portales, 2026.
