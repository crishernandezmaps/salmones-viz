# TODO — Salmones Viz

_Actualizado 2026-08-20._

## Estado

- **Intro MOVIL v41 (2026-08-20, post 70 slug `salmones-movil-v46`) — APROBADA POR CRIS**: cola rehecha con los FRAMES de la maqueta de julio
  (`final/intro_movil/SCROLL INTRO/8..13.png` -> `m1-cola8..13.webp` + `m1-cola10b.webp`).
  Antes eran dos imagenes sueltas de junio (`m1-fondo`/`m1-fondobuzo`, ahora `.sv-mold`).
  `SCREENS` movil 13 -> 16 -> **18** (v41). Rollback: **`?introm=old`** (cola de junio intacta).
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
  - **v36 (feedback de cris sobre la v35), los cuatro medidos antes de tocar:**
    1. **`m1-wellboat` va DETRAS de `m1-fiordo2`** en el DOM y emerge desde el cerro derecho
       (ese asset cubre 37-98% de la banda del barco a partir de x 80%). Antes iba delante con
       un recorrido de +36% y navegaba POR ENCIMA de la tierra. Recorrido corto (+15%). La
       posicion final NO se toca: el asset coincide exacto con el frame 3 (bbox identico).
    2. **La jaula (frame 7) se REVELA, no se funde**: frames 6 y 7 son IDENTICOS arriba del
       40% (diferencia 0.00) -> mascara `linear-gradient` con borde difuminado que baja del
       38% al 100%; se limpia al entrar el frame 8. Antes el fade la dejaba translucida
       flotando bajo las balsas.
    3. **Buzo**: c12/c13 pasan de 0.017 a ~0.05 de scroll entre si (c12 0.885-0.91,
       c13 0.955-0.968); destello 0.978-0.991, negro 0.985-1.0.
    4. **La JAULA EMERGE DEL FONDO** (v39, lo APROBADO): mismo mecanismo que escritorio
       (`setL(dJ1, ..., lerp(55,0,j1rise))`). En movil NO se puede trasladar el frame 7 entero
       (trae las montanas en el tercio superior: quedarian flotando bajo el agua), asi que sube
       **`m1-sub7.webp`** (40 KB): la mitad submarina del frame 7, cortada JUSTO bajo la linea
       de espuma (43.6%) y sobre la jaula del escape (44.8%) — ventana de 1 punto —, con el
       tope en degradado alfa. Fade-in 0.50-0.545 + ascenso `lerp(45,0,ease(seg(0.50,0.645)))`.
       Antes sube, **`m1-agua7.webp`** iguala el AGUA (0.44-0.52): el frame 7 no solo agrega la
       jaula, tambien aclara toda la escena (de 128 a 165 de brillo lejos de la jaula), y sin
       igualarla la capa que sube arrastra un escalon de tono en su borde.
       DESCARTADOS en el camino: fundir el frame 7 (jaula translucida), revelarlo con mascara
       (estatico + costura de tono a lo ancho de la pantalla) y la franja de luz `#m1-wipe`.
    5. **El GLOW va SOLO en la linterna (v44)**: (a) NO puede interpolar su posicion entre los
       focos del frame 12 y el 13 — durante el cruce quedaba una luz suelta flotando en el agua
       ("la luz que flota y se posa", feedback cris). Ahora se apaga mientras los buzos se
       funden (0.940-0.966) y reaparece ya posada en la linterna del frame siguiente.
       (b) El foco NO se mide buscando el pixel mas brillante: en el frame 12 ese maximo cae en
       el HAZ proyectado y en el 13 en las burbujas. Medir MIRANDO el asset con grilla.
       Valores buenos: frame 12 = **(50.0, 71.5)**, frame 13 = **(57.0, 74.0)**.
    6. **Aire para cada beat del buzo (v44)**: el frame 11 (buzo LEJANO al fondo) se veia 0.13
       pantallas antes de que lo tapara el 12. Reparto actual: frame 11 **1.12 pantallas** ->
       frame 12 (cerca, con linterna) **1.13** -> frame 13 (apunta al frente) 0.32 -> destello
       0.22 -> negro. Los tres beats del buzo son distintos y hay que dejar ver cada uno.
    7. **Ritmo del buzo (v41)**: del buzo pequeno al grande "pasaba muy rapido" (0.43
       pantallas). `SCREENS` 16 -> 18 con TODOS los breakpoints previos reescalados x16/18
       (mismo scroll ABSOLUTO que la v40; verificado: diferencia media 0.08/0.39/0.07 al
       comparar capturas al mismo scroll). Las 2 pantallas extra van integras a la espera:
       frame 12 completo en 0.825 -> frame 13 entra en 0.92 = **1.71 pantallas** con el buzo
       pequeno; buzo grande 0.937-0.968; destello 0.968-0.984; negro 0.978-1.0.
    6. **Glow en el FOCO real**: medido (48.7%, 65.4%) en el frame 12 y (61.8%, 66.1%) en el
       13. Un % FIJO en CSS no sirve — `object-fit:cover` recorta distinto en cada viewport y
       el mismo % cae en otro punto del dibujo. `assetToStage()` mapea con la geometria real
       de cover (assets 1242x2208), el foco VIAJA del 12 al 13 durante el cruce (repintado
       por pasos, no por frame) y se repinta en `sizeIntro()` al cambiar el tamano. El
       destello nace del mismo punto.
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
- **Mapa 2: capa "Concentracion de centros salmoneros" (heatmap) APAGADA el 2026-08-20**
  (pedido de cris). Esta **comentada, no borrada**, en tres puntos de `MapaConflicto.jsx`: el
  bloque `// ── Heatmap ──` (source `all-centros` + layer `centros-heat`), la linea de
  `centros-heat` en `toggleLayer` y su entrada en la leyenda. Para reactivarla, descomentar
  los tres. Verificado en el bundle: 0 ocurrencias de `centros-heat`/`heatmap`/`Concentraci`.
- **Mapa 2 (`?embed=conflicto`)**: reconstruido desde `Desktop/Mapa  2.0.xlsx` (36 centros
  sancionados); desde 2026-07-20 los **5 casos destacados** de `Desktop/Mapa v3 13.07.26.xlsx`
  (filas amarillas: 102833, 110818, 104040, 110259, 110228) van `destacado:true` en
  `sobreproduccion.json` e **inician la navegacion** (posiciones 1-5 + seleccion inicial).
  Ficha nuevo formato, paginacion por centro, capa ECMPO quitada.

## El GLOW de la linterna (las DOS ramas, v44-v45)

Regla, valida para movil y escritorio: **el glow va SOLO en la linterna del frame vigente,
y SOLO mientras ese frame esta 100% OPACO** (v46). Encenderlo o reaparecer durante un
cross-fade lo deja flotando en el agua: el frame dominante todavia es el anterior. Ciclo:
entra en sincronia con el fade de su frame, se apaga ANTES de que el siguiente empiece a
fundirse, reaparece DESPUES de que quede opaco, ya posado en su linterna. El bug del timing
sobrevivio a DOS arreglos de posicion (v44 y v45): al depurar el glow, instrumentar
opacidad+posicion por p (inspect.mjs), no solo mirar capturas.
- **No interpolar** su posicion entre dos frames: durante el cruce queda una luz suelta flotando
  en el agua. Salta de una a otra y se APAGA mientras los buzos se funden.
- **No medir el foco con el pixel mas brillante**: cae en el HAZ proyectado o en las burbujas.
  Mirar el asset con grilla.
- Los porcentajes NO pueden ir fijos en el CSS: `object-fit:cover` recorta distinto en cada
  viewport. `assetToStage(fx,fy,aw,ah,rk)` mapea con la geometria real y se repinta al
  redimensionar. Movil = 1242x2208, escritorio = 2560x1440.

| Rama | Frame | Foco (linterna) |
|---|---|---|
| Movil | 12 (linterna abajo-derecha) | (50.0, 71.5) |
| Movil | 13 (apunta al frente) | (57.0, 74.0) |
| Escritorio | 14 (mano extendida) | (51.0, 65.0) |
| Escritorio | 15 (apunta al frente) | (57.5, 64.0) |

## Auditoria de fluidez (2026-08-20, barridos densos con diferencia entre capturas)
Sin saltos NO intencionales en ninguna rama. Picos = transiciones de diseno: descenso de
camara movil (17-18, repartido), disolucion de la jaula del escape en escritorio (41.7,
0.85 pantallas, aprobada v34), destello+negro final. El cruce al frame 10 movil mide 0.6
(imperceptible, el objetivo del diseno). Holds con subtitulo miden ~0: son deliberados.
Metodo: sweep.mjs (una sesion de Chrome, N capturas) + diferencia media entre consecutivas.

## Que intro se sirve (verificado el 2026-08-20 en el post en vivo)

**El cambio de rama es EN CALIENTE** (v43): al rotar el telefono o redimensionar la ventana no
hace falta refrescar. `revisarRama()` corre en el `resize`; si la rama cambio, carga los assets
que faltan, cambia `activeRender` y `SCREENS`, resetea `glowIdx` y `maxH`, y reubica el scroll
en el mismo punto de la narracion (la intro cambia de alto, 17 <-> 18 pantallas).
GOTCHA: `mostrarEscritorio(on)` tambien tiene que OCULTAR — el `display` inline gana sobre el
media query, asi que sin limpiarlo el bloque de escritorio queda encima de la intro movil.


| Viewport | Rama | SCREENS | Assets |
|---|---|---|---|
| 1600x900 / 1440x900 / 1280x800 | ESCRITORIO | 17 | d1:17, m1:0 |
| iPad horizontal 1180x820 | ESCRITORIO | 17 | d1:17, m1:0 |
| iPhone horizontal 844x390 | ESCRITORIO | 17 | d1:17, m1:0 |
| Ventana angosta 980x1600 | MOVIL | 18 | m1:19, d1:0 |
| iPhone 390x844 / 430x932 | MOVIL | 18 | m1:19, d1:0 |
| iPad vertical 820x1180 | MOVIL | 18 | m1:19, d1:0 |

Cada rama carga SOLO sus assets. **La intro de escritorio quedo IDENTICA a la v34**: comparada
pixel a pixel contra la captura de la v34 original a 1600x900, diferencia media **0.000** en
p=0.30, 0.45 y 0.52.

**GOTCHA DE QA (headless):** si queda una instancia de Chrome headless colgada, el script se
conecta a ELLA por el puerto de depuracion y hereda SUS metricas -> el diagnostico reporta un
viewport que no pediste (756x469) y la rama equivocada. `pkill -f "remote-debugging-port=922"`
y borrar el `--user-data-dir` ANTES de cada corrida.

## Pendientes
- QA de la CLIENTA a la intro de escritorio v34 (cris ya la aprobo el 2026-08-14).
- QA de la CLIENTA a la intro MOVIL v39 en dispositivo real (cris ya la aprobo el 2026-08-20).
- Opcional: si se quiere que un TELEFONO en horizontal reciba igual la version movil (hoy recibe la de escritorio, correcto en encuadre pero descarga los assets 16:9), agregar una condicion de ancho.
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
