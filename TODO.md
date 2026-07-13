# TODO — Salmones Viz

_Actualizado 2026-07-13._

## Estado

- **Intro movil (post 70, slug `salmones-movil-vN`)**: aprobada, iterando detalles. NO tocar
  `renderMobile()` ni `.sv-m`.
- **Intro de ESCRITORIO = PARALLAX POR CAPAS** (`renderDesktopParallax`, replica de `renderMobile`
  con capas `d1-*`, ids `ds-*`): descenso de camara continuo, jaulas colgando (cutaway), vehiculos
  que entran/salen, jaula que emerge opaca del fondo, linterna del buzo (`#ds-luz`), fundido a
  negro final (`.sv-black`). Post 70 slug **`salmones-movil-v27`**. Rollback intro vieja: `?introd=old`.
  Referencia de la progresion: `Desktop/video_movil.mp4`. Se descartaron los enfoques de frames e
  hibrido (ver memoria `project_intro_escritorio_aditiva`).
- **Mapa 2 (`?embed=conflicto`)**: reconstruido desde `Desktop/Mapa  2.0.xlsx` (36 centros sancionados).
  Ficha nuevo formato (grupo+pais, Centro N, area+region, tramite reloca, descripcion, Expediente SNIFA
  + estado), paginacion por centro. Capa ECMPO quitada (carga mas liviana). Ver memoria
  `project_mapa2_sobreproduccion`.

## Pendientes
- Iterar detalles de diseno de la intro de escritorio con cris (afinables: velocidad, encuadre).
- QA del mapa 2 por cris en navegador real; ajustar campos/orden de la ficha si hace falta.
- Decidir si se elimina el set viejo `of-*`/`render()` (rollback) y los frames `dq-*` muertos.
- Copy de la seccion del mapa nuevo (lo ajusta UDP).
- Portadas y buzo apuntando al frente: assets de la disenadora (no codigo).
- Intro/mapas en produccion `cip.udp.cl` (UDP, NO tocar sin coordinar).

## Gotchas criticos
- **WP escapa `&` a `&#038;` en el `<script>` del post**: PROHIBIDO `&`/`&&` en el JS de
  `post-standalone.html` (rompe el motor, movil incluido). Verificar post-deploy: `grep -c '&#038;'`.
- **Mapas**: QA SOLO en navegador real (WebGL no rinde headless). Al renombrar variables en un
  componente, grep TODAS las refs (el build compila pero crashea en runtime, ej ReferenceError).
- **Deploy Pages**: GitHub Actions genera su propio hash de chunk (distinto al build local);
  verificar el chunk EN VIVO via el index desplegado. Propagacion CDN ~2-4 min.

## Deploy
Ver `.claude/infra.md` (local). Resumen: editar `wordpress/post-standalone.html` -> `wp post update 70`
(post) ; push a `main` -> Actions -> Pages (mapas/assets).
