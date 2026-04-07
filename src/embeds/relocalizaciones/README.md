# Mapa 4 — Relocalizaciones (mapa de referencia)

Mapa simple que muestra los centros salmoneros involucrados en solicitudes de relocalización, diferenciados por región y sobre una capa de áreas protegidas terrestres. Diseñado para ser capturado como ilustración estática.

## Propósito

Este mapa no es un embed editorial para el artículo. Su función es servir de **referencia georreferenciada** para que el equipo de diseño de UDP lo replique como ilustración estática, con la misma distribución espacial de puntos y demarcación de parques nacionales.

Por eso es intencionalmente simple: sin panel lateral, sin ficha, sin paginación.

## Qué visualiza

- Puntos de centros salmoneros con solicitud de relocalización activa o histórica
- Color por región: Los Lagos (naranja), Aysén (rojo), Magallanes (azul)
- Áreas protegidas terrestres SNASPE en verde punteado (misma capa que Mapa 2)

## Datos

| Archivo | Registros | Fuente |
|---------|-----------|--------|
| `relocalizaciones.json` | 198 | Subpesca |
| `centros_salmoneros.geojson` | 1,346 (filtrado) | SERNAPESCA |
| `snaspe_terrestre.topojson` | 25 | OSM + CONAF |

### Join de coordenadas

`relocalizaciones.json` contiene los códigos de centros pero no coordenadas. El componente cruza por código (`N_CODIGOCE`) contra `centros_salmoneros.geojson` para obtener la geometría:

```js
const relocCodes = new Set()
relocResp.forEach(r => r.centros.forEach(c => relocCodes.add(String(parseInt(c)))))

centrosResp.features.forEach(f => {
  const code = String(parseInt(f.properties.N_CODIGOCE))
  if (relocCodes.has(code)) byRegion[key].push(f)
})
```

## Arquitectura del componente

```
MapaRelocalizaciones
├── Mapa MapLibre (centro -73.0, -46.5, zoom 5.5)
│   ├── Capa snaspe-fill / snaspe-outline   — áreas terrestres (verde punteado)
│   └── Capas layer-centros-{región} × 3    — puntos por región
└── Leyenda fija (top-left)
    ├── Punto por región con conteo
    └── Referencia área protegida terrestre
```

No tiene interacción de click ni popups, para mantener la interfaz limpia en capturas.

## Embed en WordPress (si se usa)

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=relocalizaciones"
    width="100%" height="700" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `MapaRelocalizaciones.jsx` | Mapa simple con puntos por región y capa SNASPE |
| `EmbedRelocalizaciones.jsx` | Wrapper full-viewport para iframe |
