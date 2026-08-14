# TODO — Salmones Viz

_Actualizado 2026-08-14._

## Estado

- **Intro movil (post 70, slug `salmones-movil-vN`)**: aprobada, iterando detalles. NO tocar
  `renderMobile()` ni `.sv-m`.
- **Intro de ESCRITORIO = PARALLAX POR CAPAS + COLA con FRAMES FINALES** (`renderDesktopParallax`,
  capas `d1-*`, ids `ds-*`). Post 70 slug **`salmones-movil-v34`** (2026-08-14) — **APROBADA POR
  CRIS para escritorio**. Rollback intro vieja: `?introd=old`; cola v31 exacta: commit `a4077c7`.
  - Frames finales 11-15 de la disenadora en Pages: `d1-cola11..15.webp` + `d1-cola11b.webp`
    (frame 11 con tope alfa: solo agua+lecho) + **`d1-cola13s/14s/15s.webp` (beats del buzo
    SIN jaula, parche de agua 2026-08-14; los originales con jaula quedan como rollback)**.
  - `SCREENS=17`; breakpoints de la cabecera remapeados x15/17 (mismos scrolls que v30 hasta
    el escape); las 2 pantallas extra van a la cola.
  - Cola v34: escape HOLD hasta 0.70 -> `c11b` (agua+lecho, ANTES de las jaulas en el DOM)
    SUBE 0.70-0.78 por DETRAS de la jaula del escape, que queda visible -> jaula se funde
    quieta 0.75-0.80 -> frame 11 completo QUIETO 0.78-0.83 -> c12 (con su jaula al tope,
    saliendo) 0.835 -> c13s buzo lejos 0.875 -> c14s buzo iluminando redes 0.905 (+luz) ->
    c15s buzo cerca 0.945 -> flash 0.965 -> negro 0.975-1.0. Del 13 en adelante NO hay jaula.
  - Capas viejas `ds-fondo`/`ds-fondobuzo` fuera del DOM (assets `d1-fondo-mar*` huerfanos en
    Pages, limpiables).
- **Mapa 2 (`?embed=conflicto`)**: reconstruido desde `Desktop/Mapa  2.0.xlsx` (36 centros
  sancionados); desde 2026-07-20 los **5 casos destacados** de `Desktop/Mapa v3 13.07.26.xlsx`
  (filas amarillas: 102833, 110818, 104040, 110259, 110228) van `destacado:true` en
  `sobreproduccion.json` e **inician la navegacion** (posiciones 1-5 + seleccion inicial).
  Ficha nuevo formato, paginacion por centro, capa ECMPO quitada.

## Pendientes
- QA de la CLIENTA a la intro de escritorio v34 (cris ya la aprobo el 2026-08-14).
- Opcional si cris lo pide: quitar tambien la jaula del frame 12 (mismo parche de agua).
- QA del mapa 2 en navegador real: confirmar que la navegacion parte en los 5 destacados.
- Limpieza post-QA: eliminar set viejo `of-*`/`render()` (rollback), el bloque DOM muerto
  `.sv-frame-dq` del post, y los assets huerfanos de Pages (`d1-fondo-mar*.webp`,
  `d1-cola13/14/15.webp` originales con jaula).
- Copy de la seccion del mapa nuevo (lo ajusta UDP).
- Portadas: assets de la disenadora (no codigo).
- Intro/mapas en produccion `cip.udp.cl` (UDP, NO tocar sin coordinar).

## Gotchas criticos
- **WP escapa `&` a `&#038;` en el `<script>` del post**: PROHIBIDO `&`/`&&` en el JS de
  `post-standalone.html` (rompe el motor, movil incluido). Validar ANTES de deploy (extraer el
  `<script>` + `node --check` + grep de `&`) y DESPUES (`grep -c '&#038;'` en el HTML servido).
- **Huincha en transiciones de la intro**: NINGUNA capa full-frame OPACA se traslada durante un
  cruce (descubre franjas en sus bordes). Los handoffs son por opacidad con las capas quietas.
  Excepcion valida: capas con TOPE TRANSPARENTE difuminado (tipo `c11b` o el fondo del movil)
  SI pueden subir desde abajo — su borde es un degradado, no deja costura.
- **Cruces con frames completos**: lo que sube desde abajo NO debe traer una segunda copia de
  lo que ya esta en pantalla (subir el frame 11 completo duplicaba la jaula del escape). Se sube
  solo el contenido nuevo (recorte con alfa) y el frame completo se funde quieto al final.
- **Los `d1-jaula*` son FULL-FRAME, no sprites** (traen su agua pintada; el alfa es solo el
  cielo): PROHIBIDO trasladarlos o escalarlos — queda un rectangulo translucido con bordes
  visibles (v32 fallida 2026-08-14). No existe asset de jaula aislada; si un frame trae la
  jaula dibujada donde no debe, se parcha el asset (gradiente de agua por filas + mascara
  difuminada; extender la mascara BAJO la base de la jaula o se filtra como linea punteada).
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

## Correcciones de cris — sesion 2026-07-31 (CERRADA en v31)
- [HECHO] Integrar frames finales 11-15 (`final/intro_desktop/`) en la cola de escritorio.
- [HECHO] Cruce escape->fondo sin vacio de agua (feedback en vivo): el fondo sube como bruma
  (`c11b`) mientras el escape sigue visible.
- [HECHO] Cruce sin jaula duplicada ni costura (feedback en vivo): lo que sube no trae jaula;
  el frame completo se funde quieto al posarse.

## Correcciones de cris — sesion 2026-08-14 (CERRADA en v34, APROBADA para escritorio)
- [HECHO] El fondo ya no tapa la jaula del escape: `c11b` movido antes de las jaulas en el
  DOM, sube por detras; la jaula se funde quieta despues (v33, "asi si!").
- [FALLIDO->REVERTIDO] v32: subir/escalar las jaulas con translate+scale — los `d1-jaula*`
  son full-frame y quedo un rectangulo con bordes visibles (gotcha documentado arriba).
- [HECHO] En los beats del buzo (frames 13-15) la jaula desaparece por completo: assets
  parcheados `d1-cola13s/14s/15s.webp` (la jaula venia dibujada en los frames). El frame 12
  conserva la suya (pegada al tope, saliendo de cuadro).
