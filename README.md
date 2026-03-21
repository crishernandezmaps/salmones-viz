# Salmones en Chile — Visualizacion de Datos

Plataforma interactiva de visualizacion de datos sobre la industria salmonera en Chile. Integra mapas interactivos, timeline animado y graficos por region para explorar 40 anos de concesiones salmoneras (1985-2025).

Proyecto desarrollado por [Tremen SpA](https://tremen.tech) para la **Universidad Diego Portales (UDP)** como parte de una investigacion de periodismo de datos.

**Live**: [crishernandezmaps.github.io/salmones-viz](https://crishernandezmaps.github.io/salmones-viz/)

---

## Que muestra la visualizacion

### Articulo periodistico (`ArticleView`)

La ruta principal (`/`) presenta una pieza de periodismo de datos con estructura editorial tipo longform:

1. **Hero fullscreen** — Titulo, bajada, autor y fecha sobre imagen de fondo
2. **Introduccion** — Parrafo con drop cap sobre imagen sutil
3. **Secciones de texto** — Narrativa con tipografia Roboto, columna centrada de max 768px
4. **Mapa interactivo** — Componente `MapaTimelineDatos` embebido (ver seccion siguiente)
5. **Imagen full-width** — Fotografia con caption superpuesto
6. **Blockquote** — Cita destacada sobre fondo azul marino (#0d1b2a)
7. **Seccion parallax** — Dato destacado sobre imagen con overlay
8. **Metodologia** — Dos columnas con fuentes de datos y procesamiento
9. **Creditos** — Footer oscuro con equipo editorial y de desarrollo

### Mapa Timeline con Datos (`MapaTimelineDatos`)

Vista principal de la visualizacion. Embebida en el articulo y tambien disponible para captura de frames.

#### Arquitectura visual

Tres mapas simultaneos de las regiones salmoneras de Chile, cada uno con su propio panel:

| Region | Centro | Zoom | Descripcion |
|--------|--------|------|-------------|
| Los Lagos | -72.8, -42.8 | 6.5 | Mayor concentracion de concesiones |
| Aysen | -73.5, -45.5 | 6.0 | Segunda region en importancia |
| Magallanes | -73.0, -52.0 | 6.0 | Zona de expansion reciente |

- **Mapa base**: CARTO Voyager (fondo claro/pastel)
- **Pitch**: 50° en desktop, 65° en mobile (vista 3D)
- Se ocultan labels de regiones/estados del mapa base para evitar redundancia

#### Capas del mapa

Cada panel regional renderiza dos capas MapLibre GL sobre los datos filtrados por region:

1. **Heatmap** (`type: 'heatmap'`)
   - Visible en zoom bajo (opacity 0.85 a zoom 7, se desvanece a 0 en zoom 13)
   - Gradiente de colores pastel marino: transparente → teal oscuro → purpura → teal profundo
   - Radio adaptativo al zoom (14px a zoom 4, 30px a zoom 12)

2. **Puntos** (`type: 'circle'`)
   - Color: `#3a9e9e` (teal)
   - Aparecen gradualmente al hacer zoom in (opacity 0 a zoom 7, 0.8 a zoom 9)
   - Radio crece con zoom (2.5px a zoom 5, 8px a zoom 14)
   - Click muestra popup con: codigo centro, comuna, fecha de resolucion

#### Procedimiento de datos

```
centros_salmoneros.geojson (1,346 puntos)
    │
    ▼
1. Parseo de fecha (F_RESOLSSF)
   Formato: "DD-MM-YYYY" o "YYYY-MM-DD"
   Se extrae el año y se filtra rango 1980-2030
    │
    ▼
2. Filtro temporal
   Solo se muestran centros con year <= currentYear
    │
    ▼
3. Filtro regional
   Cada panel filtra por REGION.includes("LOS LAGOS"|"AYSÉN"|"MAGALLANES")
    │
    ▼
4. Actualizacion reactiva
   Cada cambio de año actualiza el GeoJSON source de MapLibre
   (primera vez: addSource/addLayer, despues: setData)
```

#### Grafico de linea por region

#### Desktop: grafico de linea

Cada panel tiene un mini grafico SVG (240×80 viewBox) superpuesto en la parte inferior del mapa, sobre fondo blanco semitransparente con backdrop-blur:

- **Eje Y**: Escala global consistente (el max de las 3 regiones) para comparabilidad
- **Linea**: Concesiones acumuladas hasta `currentYear`, color `#3a9e9e`
- **Punto**: Circulo en el ultimo dato visible
- **Gridlines**: 0%, 50%, 100% del max
- **Codos**: Lineas verticales rojas punteadas con el año en el eje X (ver deteccion abajo)
- **Leyenda**: Dot teal + "Concesion de Salmones" + multiplicador + count

#### Mobile: sparkline + circulos pulsantes

En pantallas < 768px el grafico con fondo se reemplaza por una visualizacion minimalista que no tapa el mapa:

- **Sparkline**: Linea roja semitransparente (`rgba(217,64,64,0.6)`, grosor 2.5px) en el 25% inferior de cada panel, sin fondo, sin ejes
- **Circulos pulsantes**: En cada punto de codo, un circulo rojo solido (r=2.5) con un anillo animado que se expande y contrae (3→8→3px, ciclo 2s). Encima del circulo se muestra el año en rojo
- **Multiplicador**: Esquina superior derecha, fuente grande (`text-base`), color teal
- **Region + count**: Esquina superior izquierda

#### Indicador de crecimiento (multiplicador)

Se muestra un multiplicador (ej: `×49.7`) que indica cuantas veces se multiplicaron las concesiones:

```
multiplicador = concesiones_actuales / concesiones_base
```

- **Base**: Primer año en que la region alcanzo al menos 10 concesiones
- Se usa 10 como umbral minimo para evitar multiplicadores inflados (pasar de 1 a 500 = ×500)
- Solo se muestra cuando hay crecimiento real (current > base)
- **Desktop**: Junto al count en la leyenda del grafico (texto pequeño)
- **Mobile**: Esquina superior derecha del panel (fuente grande)

#### Deteccion de codos (lineas rojas / circulos pulsantes)

Se identifican automaticamente los años con cambios bruscos en la tasa de otorgamiento:

```
1. Calcular concesiones nuevas por año:
   added[y] = total[y] - total[y-1]

2. Calcular aceleracion (cambio en la tasa):
   jump[y] = added[y] - added[y-1]

3. Filtrar saltos significativos:
   threshold = max(mean(jumps_positivos) × 1.5, 3)
   candidatos = años donde jump >= threshold

4. Eliminar redundancia:
   Gap minimo de 4 años entre codos (se priorizan los mayores)
```

Representacion visual:
- **Desktop**: Linea vertical roja punteada + año en el eje X. Labels estaticos del eje X se ocultan si estan a menos de 4 años de un codo
- **Mobile**: Circulo rojo solido con anillo pulsante animado (SVG `<animate>`) + año encima del circulo

#### Timeline global

Barra inferior con:

- **Mini histograma**: Barras por año (total nacional), clickeables (solo desktop)
- **Boton play/pause**: Animacion automatica a 400ms/año
- **Slider**: Navegacion directa a cualquier año
- **Display**: Año actual en bold

### Mapa de Capas (`MapaCapas`)

Mapa con capas toggleables (no activo en el articulo, disponible como experimento):

- **Areas Apropiadas para la Acuicultura (AAA)** — Zonas definidas por la autoridad
- **Areas Marinas Protegidas (AMP)** — Zonas de proteccion ambiental
- **Concesiones Salmoneras** — Poligonos de cada concesion con popup de detalle

Las 3 capas se cargan desde archivos TopoJSON y se convierten a GeoJSON en runtime con `topojson-client`.

### Rutas de Export (`ExportView`)

Rutas para captura de frames con Puppeteer (misma logica visual que `MapaTimelineDatos` pero sin controles interactivos):

| Ruta | Viewport | Uso |
|------|----------|-----|
| `/export/scroll-desktop` | Portrait 750x1400 | Scrollmation desktop |
| `/export/scroll-mobile` | Landscape 1400x788 | Scrollmation mobile |
| `/export/bg-desktop` | Landscape 1920x1080 | Background Scrollmation desktop |
| `/export/bg-mobile` | Landscape 1400x788 | Background Scrollmation mobile |

Cada ruta expone `window.setYear(year)` para control externo via Puppeteer.

### Paleta de colores

| Elemento | Color | Hex |
|----------|-------|-----|
| Puntos en mapa / linea de grafico | Teal | `#3a9e9e` |
| Puntos pastel (mapa) | Seafoam | `#7ec8c8` |
| Fondo UI / timeline | Gris verdoso claro | `#f0f4f3` |
| Textos principales | Azul marino | `#1b3a4b` |
| Fondo hero / blockquote / creditos | Azul profundo | `#0d1b2a` |
| Codos (lineas verticales) | Rojo | `#d94040` |
| Heatmap denso | Teal oscuro → purpura → teal profundo | gradiente |
| Mapa base | CARTO Voyager | pastel claro |

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
│   ├── App.jsx                 # Router: articulo (/) + rutas export
│   ├── main.jsx                # Entry point React
│   ├── index.css               # Estilos base + Tailwind + Roboto
│   ├── components/
│   │   ├── ArticleView.jsx     # Articulo periodistico longform con mapa embebido
│   │   ├── Layout.jsx          # Layout con header/footer (no activo)
│   │   └── TabBar.jsx          # Barra de tabs (no activa)
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
| CARTO Voyager | — | Tiles base pastel (servicio gratuito, sin API key) |

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
| CARTO Voyager tiles | `basemaps.cartocdn.com` | Bajo — servicio gratuito de CARTO, ampliamente usado |
| MapLibre GL JS | Bundleado en el build | Ninguno — incluido en el bundle |

Si CARTO dejara de servir tiles en el futuro, basta con cambiar la URL del estilo en `MAP_STYLE` por otro proveedor de tiles gratuito (ej: MapTiler, Stadia Maps).

---

## Creditos

- **Desarrollo y visualizacion de datos**: [Tremen SpA](https://tremen.tech) — Cristian Hernandez M.
- **Contenido periodistico**: Equipo de Periodismo, Universidad Diego Portales
- **Fuentes de datos**: Servicio Nacional de Pesca y Acuicultura (SERNAPESCA), Subsecretaria de Pesca (Subpesca), Superintendencia del Medio Ambiente (SMA), Ministerio del Medio Ambiente (MMA)

---

Proyecto academico de periodismo de datos — Universidad Diego Portales, 2026.
