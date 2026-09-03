# Embed: Fusión y relocalización → Erasmo 7 (`?embed=fusion`)

Mapa animado del caso Cooke Aquaculture: los centros **Huillines 1 (110225)** y
**Exploradores (110295)** se fusionan y relocalizan en **Erasmo 7 (110955)**, junto al
Parque Nacional Laguna San Rafael. Botón de reproducción tipo video: encuadre inicial →
convergencia de los dos centros (7 s) → zoom final al centro nuevo con popup.

Reproduce de forma profesional el prototipo `animacion/gemini-code-*.html` del equipo
UDP (agosto 2026), con dos correcciones de fondo:

- **Basemap**: Esri World Imagery (satélite, uso gratuito con atribución) en MapLibre,
  en lugar de los tiles de Google Maps del prototipo (sin licencia para ese uso).
- **Deslinde REAL del parque**: `public/data/pn_laguna_san_rafael.geojson` (OSM,
  relación 4647128, geometría completa de 4.208 vértices), en lugar del polígono
  dibujado a mano del prototipo. Con el deslinde real, Huillines 1 queda DENTRO del
  polígono del parque y el borde norte pasa justo al sur de los centros extinguidos.

## Coordenadas

| Centro | Código | Coordenada | Fuente |
|---|---|---|---|
| Huillines 1 | 110225 | -46.322778, -73.592667 | Prototipo UDP (centro extinguido, no está en datos vigentes) |
| Exploradores | 110295 | -46.303333, -73.530000 | Prototipo UDP (centro extinguido) |
| Erasmo 7 | 110955 | -46.096475, -73.465756 | `centros_salmoneros.geojson` (SERNAPESCA, coordenada oficial) |

## Iframe para WordPress

```html
<!-- wp:html -->
<section class="story-viz">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=fusion"
    width="100%" height="100%" frameborder="0" allowfullscreen
    title="Fusión y relocalización de Huillines 1 y Exploradores"></iframe>
</section>
<!-- /wp:html -->
```

Fuera del scrollytelling: iframe con `height="700"`.

## QA

WebGL no rinde en headless: verificar en dispositivo real (regla del proyecto).
