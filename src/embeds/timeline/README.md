# Timeline de Concesiones Salmoneras (1985-2025)

Mapa interactivo que muestra la evolución temporal de las concesiones salmoneras en tres regiones del sur de Chile.

## Visualizacion

Tres mapas sincronizados (Los Lagos, Aysen, Magallanes) con:
- Capa de heatmap para densidad de concesiones
- Puntos individuales con popup (centro, comuna, fecha)
- Grafico de linea acumulativo por region
- Indicador de crecimiento (multiplicador)
- Deteccion automatica de anos de aceleracion (elbows)
- Timeline con play/pause y slider (1985-2025)

## Datos

- **Fuente**: `public/data/centros_salmoneros.geojson` (1,346 centros)
- **Origen**: SERNAPESCA (Servicio Nacional de Pesca y Acuicultura)
- **Campo temporal**: `F_RESOLSSF` (fecha de resolucion, formato DD-MM-YYYY)
- **Campo regional**: `REGION` (filtrado por LOS LAGOS, AYSEN, MAGALLANES)

## Embed en WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=timeline"
    width="100%" height="700" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `MapaTimelineDatos.jsx` | Componente principal con mapas, timeline y graficos |
| `EmbedTimeline.jsx` | Wrapper full-viewport con overrides CSS para iframe |
