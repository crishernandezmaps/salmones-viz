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

## Correcciones de cris (lista 2026-07-13)

### Mapa 2 (?embed=conflicto)
- [HECHO] Quitar huincha roja del nombre de empresa; el HOLDING (solo el grupo, sin titular) va A LA
  IZQUIERDA del "Centro NNNNN" (misma fila), en rojo, bajo la paginacion. Falta validar el layout en
  movil (2 columnas puede apretar).
- [HECHO] Recuadro de capas como simbologia (sin activar/desactivar). Circulo rojo: "Centros con
  solicitud de relocalizacion y procedimiento sancionatorio (36)".
- [HECHO] Preview por defecto con mas zoom out (inicial 7/6.2).
- [HECHO] Movil: ficha en 2 columnas + fuente menor para evitar scroll.
- [POR HACER] Incluir el Excel del mapa, con casos destacados para iniciar la navegacion (si se puede).
  Aclarar con cris que significa: ¿arrancar la navegacion en ciertos centros destacados en vez del
  primero por orden? ¿publicar el Excel como descarga?

### Intro de escritorio (post 70)
- [POR HACER] Reducir la cantidad de scrolls iniciales: hoy hay que scrollear mucho para que el
  titular (hero) suba y empiecen a aparecer las piezas. Acortar ese tramo inicial.
- [POR HACER] Transicion jaulas->buzo mas despejada (como en movil): en escritorio la jaula con
  peces (escape) arranca DETRAS del buzo e interfiere. Separar los tiempos.
- [POR HACER] Recuperar el buzo apuntando al lector con la linterna al final (estaba en versiones
  anteriores). Requiere asset/pose del buzo mirando al frente o reposicionar la linterna.
