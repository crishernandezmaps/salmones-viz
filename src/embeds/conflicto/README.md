# Mapa de Conflicto: Concesiones vs Areas Protegidas

Mapa interactivo que cruza la ubicacion de centros salmoneros con areas marinas protegidas, denuncias ambientales, sanciones por sobreproduccion y solicitudes de relocalizacion.

## Visualizacion

- Mapa base CARTO Voyager centrado en la zona salmonera
- Capas de Areas Marinas Protegidas (AMP) con relleno semitransparente
- Heatmap de densidad de centros salmoneros
- Puntos codificados por color y forma segun estado:
  - Circulo rojo: centro normal
  - Circulo rojo + borde amarillo: con denuncia
  - Triangulo naranja: en area protegida (conflicto)
  - Triangulo naranja + borde amarillo: conflicto + denuncia
  - Diamante rojo oscuro: sobreproduccion
  - Cuadrado azul: solicitud de relocalizacion
- Panel lateral con ficha detallada del centro seleccionado
- Sistema de rankings por empresa titular

## Datos

| Archivo | Registros | Fuente |
|---------|-----------|--------|
| `centros_salmoneros.geojson` | 1,346 | SERNAPESCA |
| `concesiones_excel.json` | 1,346 | Subpesca |
| `denuncias.json` | 102 | SMA |
| `sobreproduccion.json` | — | SMA |
| `relocalizaciones.json` | — | Subpesca |
| `amp_nacional.topojson` | 32 | MMA |

## Embed en WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=conflicto"
    width="100%" height="700" frameborder="0"
    style="border:0; display:block;" allowfullscreen></iframe>
</div>
```

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `MapaConflicto.jsx` | Componente principal con mapa, capas, panel de ficha y rankings |
| `EmbedConflicto.jsx` | Wrapper full-viewport con overrides CSS para iframe |
