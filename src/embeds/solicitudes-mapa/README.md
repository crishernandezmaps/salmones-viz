# Embed: Mapa de solicitudes de relocalización (`?embed=solicitudes-mapa`)

Mapa del universo completo de solicitudes de relocalización (`relocalizaciones.json`,
Subpesca vía Ley de Transparencia): un punto por **centro de origen** involucrado,
coloreado según si alguna de sus solicitudes **fusiona más de un centro** (naranja) o
son **individuales** (teal). Popup con el detalle de cada solicitud (fecha, tipo,
co-centros, estado del trámite). Complementa la animación del caso Erasmo 7
(`?embed=fusion`) mostrando que el fenómeno no es un caso aislado.

## Datos

- `public/data/solicitudes_reloc.geojson`, generado por
  `scripts/build_solicitudes_reloc.mjs` (correr con `node` desde la raíz del repo si
  `relocalizaciones.json` cambia).
- 198 solicitudes (2010-02 a 2025-12); 291 menciones de centros, de las cuales las que
  cruzan con la coordenada oficial de SERNAPESCA (`centros_salmoneros.geojson`) se
  dibujan; el resto se declara en la leyenda como no mostrado.
- **Se mapea el ORIGEN**: las solicitudes en trámite no informan coordenada de destino.
- "Incluye fusión" = el tipo declara FUSION **o** la solicitud involucra más de un centro.

## Iframe para WordPress

```html
<!-- wp:html -->
<section class="story-viz">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=solicitudes-mapa"
    width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy"
    title="Centros con solicitudes de relocalización"></iframe>
</section>
<!-- /wp:html -->
```

Fuera del scrollytelling: iframe con `height="700"`.

## QA

WebGL no rinde en headless: verificar en dispositivo real (regla del proyecto).
