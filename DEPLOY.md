# Deploy & Workflow — Salmones Viz (UDP)

> **IMPORTANTE (desde 2026-06-06): se trabaja DESDE LA VPS, no desde el local.**
> El macOS local empezó a dar `Operation not permitted` (EPERM) en `~/Documents`
> y `~/Desktop` (TCC caído pese a Full Disk Access). La copia de trabajo vive en
> la VPS y desde ahí se edita y despliega.

## Dónde está todo

| Qué | Dónde |
|-----|-------|
| Copia de trabajo | VPS `46.224.221.33` → `/root/work/salmones-viz` (clon del repo) |
| Repo GitHub | `github.com/crishernandezmaps/salmones-viz` (rama `main`) |
| Mapas (vizs) | GitHub Pages: `crishernandezmaps.github.io/salmones-viz` |
| Artículo WordPress | contenedor `salmones-wp` en la VPS · post **ID 47** · test: `salmoneswp.tremen.tech` |
| Assets del scroll | `/var/www/html/wp-content/uploads/scroll-assets/` (dentro de `salmones-wp`) |

## Cómo editar (desde la VPS)

Los tools locales (Read/Edit/Write) NO sirven mientras el local esté bloqueado.
Editar vía SSH + scripts (python por stdin / sed):

```bash
# ejemplo: aplicar un parche python
cat patch.py | ssh root@46.224.221.33 'cat > /root/patch.py && cd /root/work/salmones-viz && python3 /root/patch.py'
```

## Desplegar el ARTÍCULO (post WordPress 47)

El HTML del artículo es `wordpress/post-standalone.html` (fuente de verdad).

```bash
ssh root@46.224.221.33 'cd /root/work/salmones-viz && \
  cat wordpress/post-standalone.html | docker exec -i salmones-wp wp post update 47 - --allow-root'
```

## Publicar una versión FRESCA para revisión en móvil (evitar caché)

En el teléfono es difícil hacer hard refresh, y el navegador móvil cachea fuerte
(tanto el HTML del post como los iframes de mapas desde GitHub Pages). Para que la
clienta/cris vea la última versión sin hard refresh, hay que entregar una **URL que
el navegador trate como nueva**. Eso implica DOS cosas (no basta con una):

1. **Versionar los iframes de mapas** en `wordpress/post-standalone.html`: subir el
   `&v=N` de cada `?embed=...` (`v=2` -> `v=3` -> ...). Sin esto el teléfono carga
   el mapa cacheado (con el gate viejo, que choca con el gate del padre).
2. **Cambiar el slug del post** a uno nuevo (`salmones-movil-vN`). El slug viejo
   queda con redirect 301 al nuevo automáticamente.

> **IMPORTANTE (orden):** si el cambio toca los MAPAS (Pages), bumpea la version
> `&v=N` y el slug **DESPUES** de que el deploy de Pages confirme `completed/success`
> (y dale ~1 min extra por la CDN de GitHub Pages). Si bumpeas ANTES, el navegador
> baja el build VIEJO y lo cachea bajo la clave nueva -> el usuario ve lo viejo aunque
> el codigo este bien, y hay que volver a bumpear. (Paso real: v5 se entrego antes de
> que Pages terminara; hubo que rehacer a v6.) Si el cambio es solo del POST (HTML),
> no hay build de Pages que esperar.

Proceso completo (incrementar N cada vez que se quiera un link fresco):

```bash
ssh root@46.224.221.33 'cd /root/work/salmones-viz &&   # 1) subir version de los 3 iframes (ej. v=2 -> v=3)
  sed -i "s|&v=2\"|\&v=3\"|g" wordpress/post-standalone.html &&   # 2) desplegar el post (ID 70 = test movil; 47 = articulo oficial)
  cat wordpress/post-standalone.html | docker exec -i salmones-wp wp post update 70 - --allow-root &&   # 3) nuevo slug -> nueva ruta
  docker exec salmones-wp wp post update 70 --post_name="salmones-movil-v3" --allow-root &&   docker exec salmones-wp wp post url 70 --allow-root'
# 4) commitear el cambio de version del archivo
```

**Estado actual:** post 70 ("Asi nadan los salmones en Chile (movil)"),
slug `salmones-movil-v14` (iframe de relocalizaciones ahora = ?embed=relocalizaciones-ap).
URL vigente: https://salmoneswp.tremen.tech/2026/06/15/salmones-movil-v14/
Proximo link fresco = `v15` (slug `salmones-movil-v15`).

> Nota: el `&` en el `src` del iframe se sirve como `&#038;` (encoding HTML
> correcto); el navegador lo decodifica a `&` y pide `?embed=...&v=N`. Está bien.

## Desplegar los MAPAS (GitHub Pages)

Cualquier cambio en `src/` o `public/data/` se publica con push a `main`
(GitHub Actions hace build + deploy de Pages, ~1-2 min):

```bash
ssh root@46.224.221.33 'cd /root/work/salmones-viz && git add -A && git commit -m "..." && git push origin main'
# monitorear: gh run watch <id> --repo crishernandezmaps/salmones-viz
```

**Auth de push:** deploy key SSH en la VPS (`/root/.ssh/salmones_deploy`), dada de
alta como Deploy key con *write* en el repo. Configurado con:
`git config core.sshCommand "ssh -i /root/.ssh/salmones_deploy -o IdentitiesOnly=yes"`
y remote `git@github.com:crishernandezmaps/salmones-viz.git`.

## QA visual

Chrome headless **local** contra la URL pública, guardando en `/tmp` (red y `/tmp`
funcionan aunque `~/Documents` esté bloqueado). Script CDP con emulación móvil +
scroll: `/tmp/shot.mjs`.

- **WebGL no rinde en headless** con `--disable-gpu` → los mapas (MapLibre) salen
  en blanco en captura. Verificar por CDP (nº de canvas, requests fallidas,
  errores JS), no por pixeles.
- El scrollytelling (CSS) sí rinde en headless.

## Optimizaciones de carga de mapas (2026-06-06)

- **`concesiones_excel.json`**: 2,4 MB → **215 KB** (~30 KB gzip). El mapa de
  conflicto solo usaba 3 columnas (`Codigo Centro`, `nombre titular`, `Titular`)
  para la ficha; se eliminaron las 21 columnas no usadas.
- **Spinner de carga**: componente `src/shared/MapSpinner.jsx` en los 3 mapas
  (timeline, conflicto, capas); se muestra mientras cargan datos/capas.
- Iframes de mapas en el post con `loading="lazy"`.

## Decisiones de interaccion / render en MOVIL (sesion junio 2026)

Capturado para no re-litigarlo ni revertirlo por error en la proxima sesion:

- **Mapas — gestos:** los 3 mapas usan `cooperativeGestures: true` (MapLibre):
  un dedo scrollea la pagina, DOS dedos mueven/zoom el mapa. Se QUITO el patron
  anterior "toca-para-activar" (`MobileMapGate` in-iframe + gate de pointer-events
  en el post). **No reintroducir el gate.** Mensaje en espanol via `locale`.
- **Intro — alto del escenario:** se fija por JS al viewport visible mas GRANDE
  visto (`maxH`, "solo crece, nunca encoge"); `sizeIntro()` se llama tambien en
  `onScroll`. Esto evita la franja blanca abajo + el tiriton cuando colapsa la barra
  de URL. **`lvh`/`dvh`/`innerHeight`-a-secas fallaron** (franja o tiriton): no volver
  a esas unidades. El escenario tiene `transition:height 0.3s ease-out` para suavizar
  el crecimiento.
- **Overflow horizontal:** `html, body { overflow-x:clip }` global (clip = NO crea
  scroll container, no rompe el sticky) + barra de scroll oculta (evita el gutter en
  DevTools). `.story-wrap` debe quedar `overflow:visible`.
- **Ficha del mapa 2 (conflicto) en movil:** split 70/30 (mapa 70% / ficha 30%),
  CERO scroll. Layout flex-column (header + paginacion fijos, contenido flex-1 con
  overflow clip en movil / scroll en escritorio). Cada ciclo de sobreproduccion en
  UNA linea (`anio-anio · expediente · +X%`); estado mostrado UNA vez junto al
  titulo; Ubicacion/Concesionario/Concesion colapsados a un pie `Region · Titular`.
  Boton "Siguiente": pill rojo con la flecha en bob continuo (`.sv-next` en index.css).
- **QA:** siempre en TELEFONO real (el modo dispositivo de DevTools y headless mienten
  con el encuadre/overflow/barra de URL). Para ver fresco sin hard refresh: link nuevo
  (bump `&v=N` + slug `vN`) DESPUES de confirmar el deploy de Pages.

## Intro scrollytelling

Documentación detallada y **reglas para no romperla** en
`wordpress/scroll-oficial/README.md`.

> Nota: el `CLAUDE.md` (carpeta padre del local) quedó desactualizado respecto al
> flujo VPS porque el local está inaccesible. Este `DEPLOY.md` + la memoria del
> agente son la referencia vigente del flujo.
