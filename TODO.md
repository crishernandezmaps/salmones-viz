# TODO — Salmones Viz

_Actualizado 2026-08-20._

## Estado

- **Intro MOVIL v35 (2026-08-20)**: cola rehecha con los FRAMES de la maqueta de julio
  (`final/intro_movil/SCROLL INTRO/8..13.png` -> `m1-cola8..13.webp` + `m1-cola10b.webp`).
  Antes eran dos imagenes sueltas de junio (`m1-fondo`/`m1-fondobuzo`, ahora `.sv-mold`).
  `SCREENS` movil 13 -> 15. Rollback: **`?introm=old`** (cola de junio intacta).
  - **FUERA el descenso por codigo de v15** (`surfY -20%` / `cageY -12%`): resolvia por JS lo
    que la maqueta trae dibujado y desplazaba las capas ~15% -> no calzaban con los frames.
    Medido: sin descenso, las capas coinciden con los frames 6 y 7 (error 4.7 y 3.2).
  - **Descenso de camara REAL entre los frames 9 y 10: -9.5%** (correlacion al pixel,
    dy=760 de 8000, error residual 1.07 -> alineados son la MISMA imagen; el tono NO cambia,
    brightness optimo 0.99). Se reproduce con `camY` sobre jaula1/c8/c9 mientras `c10b`
    (lecho, tope alfa difuminado) sube y cubre la franja inferior; el frame 10 completo entra
    con todo QUIETO. Fundir 9 y 10 sin ese movimiento = jaula duplicada y escena lavada.
  - Cola v35: j1 0.48-0.56 -> c8 0.58-0.64 -> c9 0.66-0.71 -> [camY 0.71-0.79 + c10b sube
    0.71-0.78] -> c10 0.80-0.84 -> c11 0.85-0.875 -> c12 0.89-0.915 (+luz) -> c13 0.932-0.945
    -> destello 0.965-0.985 -> negro 0.975-1.0.
  - Glow `#m1-luz` reposicionado a 56%/72% y REDUCIDO (el haz va dibujado en los frames 12/13;
    el glow solo aporta el parpadeo). `#m1-flash` va FUERA de `.sv-frame-m` (z-index local:
    adentro quedaba bajo `.sv-dark`/`.sv-black` y el destello no se veia).
  - La cola nueva carga DIFERIDA (`.sv-mq`, `loadMQ()` con p>0.25): ~670 KB fuera de la
    carga inicial.
- **Encuadre por PROPORCION, no por ancho (2026-08-20)**: `isMobileIntro` es
  `max-width:767px` **O** `innerHeight >= innerWidth`, y el CSS usa el mismo criterio
  (`@media (max-width:767px), (orientation:portrait)` + el bloque de escritorio con
  `and (orientation:landscape)`). Motivo: en una ventana alta y angosta (~1000px de ancho)
  se servian los `d1-*` 16:9 y `object-fit:cover` recortaba ~65% del ancho -> jaulas
  gigantes, vehiculos sin recorrido, transiciones duplicadas (reporte de cris 2026-08-20).
  **CSS y JS deben moverse JUNTOS**: si el JS elige la rama movil y el CSS no la muestra,
  la intro queda en blanco.
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
- QA de cris + la clienta a la intro MOVIL v35 en dispositivo real.
- Escritorio v34 NO se toco en v35 (verificado: identico a 1600x900, diferencia media 0.000
  en p=0.45; el residuo 0.16 en 0.30/0.52 son los vehiculos en movimiento).
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
