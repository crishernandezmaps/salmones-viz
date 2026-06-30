# Embed: relocalizaciones-ap

Mapa de **centros salmoneros relocalizados** cruzados con **areas protegidas (AP)**.

- Param: `?embed=relocalizaciones-ap`
- Componente: `MapaRelocalizacionesAP.jsx` (clona el estilo de `relocalizaciones/MapaRelocalizaciones`)
- Datos: `public/data/relocalizaciones_ap.geojson` (36 centros; 23 dentro de AP, 13 fuera)
  - Generado desde `data/Mapa 2.0.xlsx` (Hoja 1).

## Visual
- Puntos rojos = relocalizado **dentro** de AP; teal = **fuera**.
- Capa SNASPE (areas protegidas terrestres) de contexto + labels de las AP clave.
- Leyenda con toggles (en AP / fuera / AP terrestres). Click en un punto = popup con
  titular, grupo, comuna/region, fecha de solicitud de relocalizacion, AP y ano de
  creacion del AP, descripcion del caso y expediente.

## Iframe
```html
<iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=relocalizaciones-ap"
  width="100%" height="700" frameborder="0" style="border:0;display:block" allowfullscreen></iframe>
```
