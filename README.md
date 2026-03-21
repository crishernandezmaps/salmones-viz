# Salmones en Chile — Visualizacion de Datos

Plataforma interactiva de visualizacion de datos sobre la industria salmonera en Chile. Integra mapas interactivos, timeline animado y graficos por region para explorar 40 anos de concesiones salmoneras (1985-2025).

Proyecto desarrollado por [Tremen SpA](https://tremen.tech) para la **Universidad Diego Portales (UDP)** como parte de una investigacion de periodismo de datos.

**Live**: [crishernandezmaps.github.io/salmones-viz](https://crishernandezmaps.github.io/salmones-viz/)

---

## Que muestra la visualizacion

### Mapa Timeline con Datos (`MapaTimelineDatos`)

Vista principal. Tres mapas simultaneos de las regiones salmoneras de Chile:

- **Los Lagos** — La region con mayor concentracion de concesiones
- **Aysen** — Segunda region en importancia salmonera
- **Magallanes** — Zona de expansion reciente

Cada mapa muestra:
- **Heatmap** de densidad de concesiones (visible en zoom bajo)
- **Puntos** coloreados por tipo: cyan para solo salmon, naranja para salmon + otras especies
- **Grafico de linea** por region con evolucion temporal
- **Popups** con detalle de cada centro al hacer click

Un **timeline animado** (1985-2025) permite reproducir la evolucion historica o navegar a un ano especifico con el slider.

### Mapa de Capas (`MapaCapas`)

Mapa con capas toggleables:
- **Areas Apropiadas para la Acuicultura (AAA)** — Zonas definidas por la autoridad
- **Areas Marinas Protegidas (AMP)** — Zonas de proteccion ambiental
- **Concesiones Salmoneras** — Poligonos de cada concesion con popup de detalle (titular, especie, comuna, estado, superficie)

### Mapa Timeline Simple (`MapaTimeline`)

Version alternativa con un solo mapa nacional y controles de timeline. Misma logica de heatmap + puntos + grafico de linea.

### Rutas de Export (`ExportView`)

Rutas especiales para captura de frames con Puppeteer, pensadas para generar secuencias de imagenes para Shorthand:

| Ruta | Viewport | Uso |
|------|----------|-----|
| `/export/scroll-desktop` | Portrait 750x1400 | Scrollmation desktop |
| `/export/scroll-mobile` | Landscape 1400x788 | Scrollmation mobile |
| `/export/bg-desktop` | Landscape 1920x1080 | Background Scrollmation desktop |
| `/export/bg-mobile` | Landscape 1400x788 | Background Scrollmation mobile |

Cada ruta expone `window.setYear(year)` para control externo via Puppeteer.

---

## Estructura del proyecto

```
salmones_viz/
├── .github/workflows/
│   └── deploy.yml              # CI/CD: build + deploy a GitHub Pages
├── public/
│   └── data/
│       ├── centros_salmoneros.geojson    # 724 KB — 1,346 puntos de centros
│       ├── concesiones_excel.json        # 1.4 MB — datos tabulares de concesiones
│       ├── concesiones_salmones.topojson # 1.3 MB — poligonos de concesiones
│       ├── areas_apropiadas.topojson     # 636 KB — lineas de areas apropiadas
│       ├── amp_nacional.topojson         # 320 KB — poligonos de areas marinas protegidas
│       └── denuncias.json               # 40 KB  — 102 registros de denuncias
├── src/
│   ├── App.jsx                 # Router principal con tabs y rutas de export
│   ├── main.jsx                # Entry point React
│   ├── index.css               # Estilos base + Tailwind
│   ├── components/
│   │   ├── Layout.jsx          # Layout con header/footer (no activo)
│   │   └── TabBar.jsx          # Barra de tabs para cambiar entre experimentos
│   ├── experiments/
│   │   ├── MapaTimelineDatos.jsx  # Vista principal: 3 mapas + timeline
│   │   ├── ExportView.jsx         # Rutas de export para Puppeteer
│   │   ├── MapaCapas.jsx          # Mapa con capas toggleables
│   │   └── MapaTimeline.jsx       # Timeline con mapa unico
│   └── pages/
│       ├── Home.jsx            # Landing page (no activa)
│       ├── About.jsx           # Pagina acerca de (no activa)
│       └── MapView.jsx         # Vista de mapa basica (no activa)
├── scripts/
│   └── optimize-data.js        # Conversion GeoJSON → TopoJSON
├── vite.config.js
├── package.json
└── README.md
```

---

## Stack tecnico

| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 19.2 | UI components |
| Vite | 8.0 | Build tool + dev server |
| Tailwind CSS | 4.2 | Estilos utilitarios |
| MapLibre GL JS | 5.20 | Renderizado de mapas vectoriales |
| Deck.gl | 9.2 | Capas avanzadas de visualizacion |
| React Router | 7.13 | Routing SPA |
| TopoJSON Client | 3.1 | Decodificacion de datos geograficos |
| CARTO Dark Matter | — | Tiles base (servicio gratuito, sin API key) |

---

## Datos

### Fuentes

| Dataset | Fuente | Registros | Descripcion |
|---------|--------|-----------|-------------|
| Centros salmoneros | SERNAPESCA | 1,346 | Coordenadas de centros de cultivo con fecha de resolucion |
| Concesiones (tabular) | Subpesca | 1,346 | Datos administrativos: titular, holding, especie, region |
| Concesiones (geo) | Subpesca | 1,351 | Poligonos de concesiones salmoneras |
| Areas Apropiadas (AAA) | Subpesca | 1,277 | Zonas definidas para acuicultura |
| Areas Marinas Protegidas | MMA | 32 | Poligonos de areas de proteccion |
| Denuncias | SMA | 102 | Registros de denuncias ambientales |

### Optimizacion

Los archivos GeoJSON grandes fueron convertidos a TopoJSON para reducir el peso total:

| Archivo | GeoJSON original | TopoJSON | Reduccion |
|---------|-----------------|----------|-----------|
| Areas Marinas Protegidas | 4.5 MB | 320 KB | 93% |
| Areas Apropiadas | 2.2 MB | 636 KB | 71% |
| Concesiones (geo) | 1.7 MB | 1.3 MB | 23% |
| **Total** | **8.4 MB** | **2.3 MB** | **73%** |

Los archivos de puntos (`centros_salmoneros.geojson`) y datos tabulares (`concesiones_excel.json`, `denuncias.json`) se mantienen en formato original por ser pequenos o no beneficiarse de la conversion.

Para re-generar los TopoJSON desde los GeoJSON originales:

```bash
node scripts/optimize-data.js
```

---

## Desarrollo local

### Requisitos

- Node.js 20+
- npm

### Instalacion

```bash
git clone https://github.com/crishernandezmaps/salmones-viz.git
cd salmones-viz
npm install
```

### Dev server

```bash
npm run dev
```

Abre `http://localhost:5180`. Hot reload habilitado.

### Build

```bash
npm run build
```

Genera archivos estaticos en `dist/`. Para probar el build localmente:

```bash
npx serve dist
```

### Lint

```bash
npm run lint
```

---

## Deploy

### GitHub Pages (produccion)

El deploy es automatico via GitHub Actions. Cada push a `main` ejecuta:

1. `npm ci` — Instala dependencias
2. `npm run build` — Genera el build con `base: '/salmones-viz/'`
3. Deploy a GitHub Pages via `actions/deploy-pages`

El workflow esta en `.github/workflows/deploy.yml`.

**URL**: https://crishernandezmaps.github.io/salmones-viz/

### Configuracion de GitHub Pages

El proyecto usa `base: '/salmones-viz/'` en `vite.config.js` y `basename` en el `BrowserRouter` para funcionar correctamente bajo el subpath de GitHub Pages. Los fetch de datos usan `import.meta.env.BASE_URL` para resolver rutas relativas al base path.

### Migracion a otra cuenta/organizacion

Para transferir el repo a una organizacion UDP:

1. GitHub → Settings → Transfer repository
2. Actualizar `base` en `vite.config.js` si cambia el nombre del repo
3. Activar GitHub Pages en el nuevo repo (Settings → Pages → Source: GitHub Actions)

---

## Captura de frames para Shorthand

La UDP utiliza Shorthand (plan gratuito, sin Custom HTML). Las visualizaciones se exportan como secuencias de imagenes.

### Hitos de captura

8 frames por formato, correspondientes a momentos clave:

| Frame | Ano | Contexto |
|-------|-----|----------|
| 01 | 1985 | Inicio de la industria |
| 02 | 1990 | Primeras concesiones |
| 03 | 1995 | Expansion |
| 04 | 2000 | Boom salmonero |
| 05 | 2005 | Pico de otorgamiento |
| 06 | 2010 | Post-crisis ISA |
| 07 | 2020 | Estado actual |
| 08 | 2025 | Panorama final |

### Script de captura (Puppeteer)

```javascript
// Ejemplo de captura para un formato
const page = await browser.newPage()
await page.goto('https://crishernandezmaps.github.io/salmones-viz/export/scroll-desktop')
await page.waitForTimeout(3000) // esperar carga de tiles

for (const year of [1985, 1990, 1995, 2000, 2005, 2010, 2020, 2025]) {
  await page.evaluate((y) => window.setYear(y), year)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `frames/scroll-desktop/${year}.png` })
}
```

Se generan 32 frames (8 anos x 4 formatos).

---

## Dependencias externas en runtime

| Servicio | URL | Riesgo |
|----------|-----|--------|
| CARTO Basemaps | `basemaps.cartocdn.com` | Bajo — servicio gratuito de CARTO, ampliamente usado |
| MapLibre GL JS | Bundleado en el build | Ninguno — incluido en el bundle |

Si CARTO dejara de servir tiles en el futuro, basta con cambiar la URL del estilo en `MAP_STYLE` por otro proveedor de tiles gratuito (ej: MapTiler, Stadia Maps).

---

## Creditos

- **Desarrollo y visualizacion de datos**: [Tremen SpA](https://tremen.tech) — Cristian Hernandez M.
- **Contenido periodistico**: Equipo de Periodismo, Universidad Diego Portales
- **Fuentes de datos**: Servicio Nacional de Pesca y Acuicultura (SERNAPESCA), Subsecretaria de Pesca (Subpesca), Superintendencia del Medio Ambiente (SMA), Ministerio del Medio Ambiente (MMA)

---

Proyecto academico de periodismo de datos — Universidad Diego Portales, 2026.
