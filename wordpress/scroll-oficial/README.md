# Intro scrollytelling oficial — "Asi nadan los salmones en Chile"

Secuencia de apertura inmersiva del reportaje, basada **exactamente** en la maqueta
de la disenadora (`SCROLL_VISUAL_OFICIAL/MOVIL/`). Es un parallax scroll-pinned
hecho a mano (sin librerias) que vive dentro del post de WordPress.

- **Fuente de verdad del post:** `salmones_viz/wordpress/post-standalone.html`
- **Prototipo standalone (referencia/QA):** `prototipo.html` (incluye hook `?p=`)
- **Assets:** `assets/of-*.webp` → se suben a `/wp-content/uploads/scroll-assets/`
- **Post en vivo:** post ID **47** en `salmoneswp.tremen.tech` (test)

---

## Anatomia

```
.sv-intro (altura por JS = innerHeight * 4.8)  ← da el "recorrido" de scroll
  └─ .sv-stage (sticky; altura por JS = innerHeight) ← se queda fija al scrollear
       ├─ .sv-bg--surface / .sv-bg--deep  (paisaje DESENFOCADO de relleno)
       ├─ .sv-frame  (encuadre centrado; contiene las capas)
       │    └─ .sv-layer x13 (mar3, montana1/2, fiordo1/2, camion, wellboat,
       │                      avion, mar1/2, jaula-llena, jaula-escape2/3)
       ├─ #sv-fondo  (FUERA del frame; anclado al borde inferior; z-index:2)
       ├─ .sv-scrim  (oscurece arriba para legibilidad del titulo)
       ├─ .sv-hero   (titulo)
       ├─ .sv-beat x3 (leyendas — PLACEHOLDER, reemplazar con copy UDP)
       └─ .sv-cue    ("Desliza ↓")
```

> Alturas e intro NO usan vh/svh/dvh para el calculo final: se fijan por JS en
> px (`sizeIntro()`), porque en moviles esas unidades dejaban franja blanca.

El motor (`render(p)` en el `<script>` del post) recibe el progreso de scroll
`p ∈ [0,1]` y setea opacidad/posicion de cada capa. `p` se calcula con
`getBoundingClientRect()` de `.sv-intro`.

## Coreografia (pacing) — valores de `render(p)`

| p (scroll) | Que pasa | Anotacion de la disenadora |
|------------|----------|----------------------------|
| 0.00–0.12  | Hero + escena superficie | escena fiordo + jaulas |
| 0.10–0.22  | Camion entra desde el fiordo izq | "camion se desliza a la derecha" |
| 0.22–0.34  | Wellboat entra al centro | "barco se desliza a la izquierda" |
| 0.32–0.50  | Avion cruza (fade in/out) | "avion aparece deslizandose" |
| 0.46–0.58  | Fiordos+montanas se abren, mar3 fade out | "se abren a los costados" |
| 0.50–0.67  | Aparecen jaulas grandes (mar1) y se van | "jaulas cambian con fade" |
| 0.66–0.90  | Inmersion: jaula llena (HOLD largo) | "vista submarina de abajo hacia arriba" |
| 0.85–0.95  | Escape (jaula-escape2 → 3) | peces escapando |
| 0.95–1.00  | Sube el fondo contaminado | "fondo contaminado sube" |

Para QA del pacing: agregar temporalmente el hook `?p=` (ver punto 9 abajo),
abrir `...?p=0.78`, capturar, y QUITARLO antes de desplegar.

---

## REGLAS CRITICAS (no romper — cada una costo varias iteraciones)

1. **Sticky requiere ancestros sin recorte.** El clip horizontal va en
   `html { overflow-x:clip }`. **NO** poner `overflow` distinto de `visible`
   en `.story-wrap` ni en sus ancestros: rompe el `position:sticky` y la
   intro queda en blanco al scrollear.

2. **Encuadre responsive del `.sv-frame`** (lo que mas se rompe):
   - **Movil (base):** `width:100%`, centrado vertical, `aspect-ratio:1664/2388`.
     Llena el ancho (conserva camion/barco en los bordes). Las franjas
     arriba/abajo NO son color plano: `.sv-bg` muestra el MISMO paisaje
     DESENFOCADO (pre-generado: `of-mar3-blur.webp` / `of-deep-blur.webp`,
     tecnica tipo Instagram) -> se ve como profundidad, no como "huincha".
   - **Fondo contaminado:** `#sv-fondo` vive FUERA de `.sv-frame` (hijo directo
     de `.sv-stage`, `z-index:2`, `object-position:center bottom`) para anclar el
     lecho marino al borde inferior de la pantalla (no flotando al medio).
   - **Altura por JS:** el stage se fija en px = `window.innerHeight`
     (vh/svh/dvh no son fiables en moviles: dejaban franja blanca). Ver el
     bloque `sizeIntro()` en el `<script>`.
   - **Escritorio (`@media min-width:768px`):** el frame llena el viewport
     (`width:100%;height:100%;aspect-ratio:auto` → cover borde a borde) y cada
     escena se ancla con `object-position`:
     `superficie 40%`, `#sv-jaulaLlena/#sv-jaulaEsc2/#sv-jaulaEsc3 → 10%`,
     `#sv-fondo → bottom`.
   - ❌ **NO** usar "contain" / columna angosta con max-width (deja espacio
     muerto a los lados en escritorio — el cliente lo rechazo).
   - El cliente piensa siempre en movil; escritorio debe llenar el ancho.

3. **Sin zoom/scale en superficie.** Las jaulas "cambian con fade"
   (`mar3 → mar1`). Escalar las lineas finas de las jaulas produce shimmer.
   En `render()`: `var zoom = 1;` y `scale` de mar1/mar2 = 1.

4. **NO forzar GPU en las 14 capas.** Como ya no hay `scale` (punto 3), no se
   necesita promocion GPU para evitar shimmer. `.sv-layer` NO lleva
   `will-change`/`translateZ(0)` y el JS usa `translate()` 2D: forzar 14 capas
   full-screen a GPU satura memoria en moviles y hace el scroll pesado.

5. **Avion con fade suave** (no on/off duro), si no "prende y apaga".

6. **Assets oficiales:** `of-*.webp` (origen `SCROLL_VISUAL_OFICIAL/MOVIL/ELEMENTOS`,
   optimizados con `cwebp -q 82 -m 6 -resize 1500 0`). El avion es preliminar
   (`of-avion.webp`, falta el oficial). Se suben con:
   ```
   tar c of-*.webp | ssh root@46.224.221.33 \
     'docker exec -i salmones-wp tar x -C /var/www/html/wp-content/uploads/scroll-assets'
   ```

7. **Tema WP oculto** (CSS scoped a la pagina): `header.wp-block-template-part`,
   `.wp-block-post-title`, byline (`:has(> .wp-block-post-author-name)`), y se
   colapsa el espacio superior (margin/padding de main/grupos) para que el hero
   arranque pegado arriba.

8. **Iframes de mapas con `loading="lazy"`** (no cargar los 3 al abrir).

9. **Texto ASCII** (sin tildes ni `n~`) en el contenido, para evitar mojibake
   al actualizar via `wp-cli` por stdin.

10. **Hook de debug `?p=`** (QA): se agrega temporalmente al final del motor
    ```js
    var __p=new URLSearchParams(location.search).get('p');
    if(__p!==null){ intro.style.height='100vh'; render(parseFloat(__p)); }
    else { /* listeners normales + render(0) */ }
    ```
    Sirve para capturar un beat exacto. **QUITARLO antes de desplegar.**

---

## QA con capturas (Chrome headless)

```bash
# generar test local con rutas de assets locales
# (reemplazar /wp-content/uploads/scroll-assets/of-  ->  assets/of-)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --window-size=1440,860 --screenshot=out.png \
  "file://.../test_post.html?p=0.78"     # escritorio
"$CHROME" --headless=new --window-size=430,932 --screenshot=out.png \
  "file://.../test_post.html?p=0.78"     # movil
```
Nota: el headless de escritorio NO emula bien el viewport movil (innerWidth
queda en ~580); para movil real, abrir en navegador.

---

## Pendientes

- Reemplazar los textos `sv-beat` (placeholder) con el copy editorial de UDP.
- Avion oficial (hoy se usa el preliminar).
- Arte de **escritorio** (`SCROLL_VISUAL_OFICIAL/ESCRITORIO/` esta vacia); hoy
  escritorio usa el arte movil en cover.
- Optimizar carga del mapa **conflicto**: hoy baja `concesiones_excel.json`
  (~2.4 MB). Evaluar recortar columnas o derivarlo del topojson.

---

## Robustez en MOVIL (2026-06-04)

Sintoma reportado: en Android/Brave "no anima y mal encuadrado". Causas y fixes:

- `overflow-x:clip` en `<html>` puede romper `position:sticky` en navegadores
  moviles; ademas en movil no hay scrollbar, asi que NO hace falta. Se limito a
  escritorio: `@media (min-width:768px){ html{overflow-x:clip} }`.
- Desajuste `vh` vs viewport real por la barra dinamica movil hacia que el
  contenido quedara "muy alto". Se usa **`dvh`** en `.sv-intro`/`.sv-stage`
  (sigue el viewport real) y el progreso se calcula con `stage.offsetHeight`,
  no con `window.innerHeight`.
- Scroll pesado en movil: se quitaron `will-change`/`translateZ(0)` de las 14
  capas (ver regla 4) y se acorto la intro de 680 a **480dvh** (menos scroll a dedo).

Si persiste en un dispositivo: probar en pestana privada (descarta cache) y
verificar si la escena de superficie aparece ESTATICA (JS no corre) o en blanco.

### Mapas lentos en movil
Cada iframe es una app React+MapLibre completa; el mapa **conflicto** baja
`concesiones_excel.json` (~2.4 MB) + 6 archivos mas. Pendiente: optimizar esa
carga (recortar columnas/derivar del topojson). Los iframes ya usan
`loading="lazy"`.
