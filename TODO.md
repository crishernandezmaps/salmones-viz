# TODO — Salmones Viz

_Actualizado 2026-07-20._

## Estado

- **Intro movil (post 70, slug `salmones-movil-vN`)**: aprobada, iterando detalles. NO tocar
  `renderMobile()` ni `.sv-m`.
- **Intro de ESCRITORIO = PARALLAX POR CAPAS** (`renderDesktopParallax`, replica de `renderMobile`
  con capas `d1-*`, ids `ds-*`). Post 70 slug **`salmones-movil-v30`**. Rollback intro vieja:
  `?introd=old`. Estado 2026-07-20 (correcciones de cris aplicadas y validadas en vivo):
  - `SCREENS=15`; hero se suelta en p 0.02-0.08; camion entra 0.04-0.11 (arranque rapido).
  - Cola: escape (jaula3) 0.64-0.70 con HOLD hasta 0.78 -> jaulas se funden QUIETAS 0.78-0.85 ->
    fondo fundido en su lugar 0.84-0.90 -> buzo 0.905-0.94 -> destello de linterna `#ds-flash`
    0.93-0.97 (z48, sobre el negro) -> negro 0.965-1.0.
  - Los frames `dq-*` se eliminaron de Pages (respaldo: tarball en la VPS + historial git).
- **Mapa 2 (`?embed=conflicto`)**: reconstruido desde `Desktop/Mapa  2.0.xlsx` (36 centros
  sancionados); desde 2026-07-20 los **5 casos destacados** de `Desktop/Mapa v3 13.07.26.xlsx`
  (filas amarillas: 102833, 110818, 104040, 110259, 110228) van `destacado:true` en
  `sobreproduccion.json` e **inician la navegacion** (posiciones 1-5 + seleccion inicial).
  Ficha nuevo formato, paginacion por centro, capa ECMPO quitada.

## Pendientes
- OK final de cris/clienta al ritmo completo de la intro de escritorio v30 (escape, fondo, destello).
- QA del mapa 2 en navegador real: confirmar que la navegacion parte en los 5 destacados.
- Limpieza post-QA: eliminar set viejo `of-*`/`render()` (rollback) y el bloque DOM muerto
  `.sv-frame-dq` del post (esta oculto, inofensivo).
- Copy de la seccion del mapa nuevo (lo ajusta UDP).
- Portadas: assets de la disenadora (no codigo).
- Intro/mapas en produccion `cip.udp.cl` (UDP, NO tocar sin coordinar).

## Gotchas criticos
- **WP escapa `&` a `&#038;` en el `<script>` del post**: PROHIBIDO `&`/`&&` en el JS de
  `post-standalone.html` (rompe el motor, movil incluido). Verificar post-deploy: `grep -c '&#038;'`.
- **Huincha en transiciones de la intro**: NINGUNA capa full-frame se traslada durante un cruce
  (translateY en jaulas o fondo descubre franjas de otro tono en sus bordes). Los handoffs son
  SOLO por opacidad, con las capas quietas en translateY 0.
- **Mapas**: QA SOLO en navegador real (WebGL no rinde headless NI en pestanas automatizadas —
  ahi el overlay "Cargando mapa..." eterno es falso negativo). Al renombrar variables en un
  componente, grep TODAS las refs (el build compila pero crashea en runtime).
- **Deploy Pages**: GitHub Actions genera su propio hash de chunk (distinto al build local);
  verificar el chunk EN VIVO via el index desplegado. Propagacion CDN ~2-4 min.
- **Excel de la clienta**: los "destacados" pueden venir SOLO como color de celda (fill amarillo);
  leer estilos con openpyxl (sin read_only), no solo valores.

## Deploy
Ver `.claude/infra.md` (local). Resumen: editar `wordpress/post-standalone.html` -> `wp post update 70`
(post) ; push a `main` -> Actions -> Pages (mapas/assets).

## Correcciones de cris — lista 2026-07-13 (CERRADA 2026-07-20)

### Mapa 2 (?embed=conflicto)
- [HECHO] Holding (solo grupo, sin titular) a la izquierda del "Centro NNNNN", sin huincha roja.
- [HECHO] Recuadro de capas como simbologia; circulo rojo con el texto exacto.
- [HECHO] Preview por defecto con mas zoom out (7/6.2).
- [HECHO] Movil: ficha en 2 columnas + fuente menor.
- [HECHO] Casos destacados del Excel v3 inician la navegacion (5 filas amarillas).

### Intro de escritorio (post 70)
- [HECHO] Menos scrolls iniciales (hero 0.02-0.08, camion 0.04-0.11, SCREENS 16->15).
- [HECHO] Transicion jaulas->buzo despejada: escape con hold largo, jaulas y fondo se funden
  quietos y separados en el tiempo (sin huincha).
- [HECHO] Destello final: el haz de la linterna crece hacia el espectador antes del negro
  (`#ds-flash`; en los assets el buzo no mira a camara, el efecto es el halo).
