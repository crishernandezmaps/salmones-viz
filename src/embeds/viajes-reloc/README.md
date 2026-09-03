# Embed: Viajes de relocalización (`?embed=viajes`)

Mapa 3D de arcos (deck.gl `ArcLayer` sobre MapLibre): cada solicitud de relocalización
se dibuja como un arco que **parte en rojo** desde el centro de origen y **llega en
verde** al sector de destino solicitado. El mapa se puede **girar e inclinar**
(Ctrl + arrastrar / dos dedos). Al hacer clic en un arco se reproduce el **viaje**
al estilo del caso Erasmo 7 (`?embed=fusion`): la cámara encuadra la solicitud, los
centros de origen se desplazan hasta el destino y al llegar aparece un marcador
pulsante con el detalle (holding, centros, fecha, tipo, estado, superficie).
Botones "Repetir viaje" y "Ver todos".

## Datos

- `public/data/viajes_reloc.json`, generado por **`scripts/build_viajes_reloc.py`**
  desde `MAPA - RELOCALIZACIONES.xlsx` (hoja "ok - Reloc", equipo UDP), que conserva
  la columna "Coordenadas Geográficas" con los vértices DMS del **sector de destino
  solicitado** (dato que `relocalizaciones.json` no trae).
- **Origen**: coordenada oficial SERNAPESCA (`centros_salmoneros.geojson`).
- **Destino**: centroide de los vértices del sector solicitado.
- Cobertura: 198 filas → **190 solicitudes con origen y destino mapeables, 272
  trayectos** (5 sin coordenada de destino, 9 orígenes sin coordenada oficial;
  declarado en la leyenda). Distancias: mediana ~7 km, máximo ~298 km.
- Una solicitud con varios centros de origen (fusión) anima todos sus orígenes
  convergiendo al mismo destino.

## Advertencia de fidelidad

El destino es el sector **solicitado** a Subpesca — la mayoría de los trámites está
en curso, no siempre otorgado. La leyenda lo declara.

## Iframe para WordPress

```html
<!-- wp:html -->
<section class="story-viz">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=viajes"
    width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy"
    title="Viajes de relocalización"></iframe>
</section>
<!-- /wp:html -->
```

Fuera del scrollytelling: iframe con `height="700"`.

## QA

WebGL no rinde en headless (deck.gl menos aún): verificar en dispositivo real.
