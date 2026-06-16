# Plan — Alinear la intro de ESCRITORIO a la secuencia de junio

> Estado: pendiente. A ejecutar 2026-06-17 (manana por la manana).
> Objetivo: que la rama `render()` (escritorio) use el diseno de junio
> (`SCROLL_VISUAL_JUNIO/DESKTOP_1/`), igual que ya se hizo en movil con
> `renderMobile()` + capas `m1-*`.

## Contexto

La intro tiene dos ramas independientes en `wordpress/post-standalone.html`:

| Rama | Funcion | Capas | Estado |
|------|---------|-------|--------|
| Movil   | `renderMobile()` (linea ~546) | `m1-*` (9:16, junio)  | LISTO (cutaway fiel) |
| Escritorio | `render()` (linea ~503)    | `of-*` (entrega vieja) | DESACTUALIZADO |

El escritorio sigue con las `of-*` del "scroll oficial" anterior y otra coreografia.
Hay que reconstruirlo con `DESKTOP_1`.

## Material de origen (local)

- `SCROLL_VISUAL_JUNIO/DESKTOP_1/ASSETS_INDIVIDUALES/` — 15 capas PNG **16:9**
  (10667x6000): Avion, Camion, Fiordo_1, Fiordo_1_pedacito, Fiordo_2, Fondo_Mar,
  Fondo_Mar_Buzo, Jaula_1/2/3, Mar_con_Jaulas, Mar_con_Jaulas_2, Montana_1,
  Montanas_2, Wellboat.
- `SCROLL_VISUAL_JUNIO/DESKTOP_1/SECUENCIA_ARMADA/` — 13 frames = **spec visual**
  (replicar 1:1, como se hizo con los 12 frames de movil).

## Pasos

1. **Assets**: exportar las 15 capas PNG -> webp optimizado (mismo criterio que
   `m1-*`). Nombrarlas `d1-*` (consistente con `m1-*`). Subir a WP en
   `/wp-content/uploads/scroll-assets/` (via docker cp + wp media, o el flujo que
   se uso para `m1-*`). NO pisar las `of-*` (dejarlas hasta confirmar).
2. **HTML**: en el bloque `.sv-frame.sv-frame-d`, reemplazar las `<img ... of-*>`
   por las nuevas `d1-*` con `data-src` (lazy-load por dispositivo ya existe:
   `.sv-d` se cargan solo en escritorio). Capas submarinas DESPUES de las de
   superficie en el orden del DOM (z-index: jaula/fondo se dibujan encima).
3. **JS `render()`**: reescribir la coreografia replicando lo de movil:
   - Superficie persistente (fiordos + montanas + Mar_con_Jaulas a opacidad 1 toda
     la secuencia; NO fundir a 0).
   - Jaulas APILADAS (jaula1/2/3 entran y se quedan; no fundir hacia afuera) ->
     siempre hay capa submarina opaca cubriendo la superficie.
   - Fondo/buzo: fundido SIMPLE en su lugar (sin translateY que barra la jaula).
   - Vehiculos (camion/wellboat/avion): transitan y se van (como movil).
   - Texto: hero fade rapido; beats sincronizados con cada escena.
4. **Encuadre**: el arte es 16:9. La rama escritorio ya usa `object-fit:cover`
   (linea ~96) + `.sv-frame` a 100%/100% en `@media min-width:768px`. Con 16:9 y
   viewport de escritorio ~16:9, cover llena bien; en pantallas mas anchas/altas
   recorta poco. Revisar `object-position` por escena si hace falta.
5. **Oscurecimiento del lecho**: reutilizar `.sv-dark` (ya es gradiente pesado
   abajo) — aplica a ambas ramas, deberia funcionar igual.
6. **QA**: navegador de escritorio REAL, recorriendo la intro completa, contra los
   13 frames de `SECUENCIA_ARMADA`. Verificar que no se asome la superficie en las
   transiciones (el bug que tuvimos en movil) ni overflow horizontal.

## Gotchas aprendidos en movil (NO repetir)

- **Superficie que desaparece**: si se funden a 0 los fiordos/superficie al bajar,
  se pierde el cutaway. Mantenerlos a opacidad 1.
- **Superficie que se asoma en transiciones**: si las jaulas se cruzan con fundido
  (una sale mientras otra entra, ambas parciales), se transparenta y se ve el
  paisaje de atras. Solucion: APILAR (no fundir hacia afuera).
- **Jaula lavada/fantasma**: el `translateY` del fondo barria su cuerpo (red rota)
  por encima de la jaula. Solucion: fundido en su lugar, sin translateY.
- **Oscurecimiento en el lugar equivocado**: `.sv-dark` debe ser gradiente pesado
  ABAJO (transparente arriba), no overlay uniforme, o se oscurece el cielo.
- **Overflow / franja blanca a la derecha**: NO clipear en `html` global (expone el
  gutter de la scrollbar en DevTools). Clip local en `.sv-intro` + ocultar la barra
  (`html{scrollbar-width:none}` + `::-webkit-scrollbar{display:none}`). `.story-wrap`
  debe quedar `overflow:visible` (o se rompe el sticky).
- **QA**: el modo dispositivo de DevTools MIENTE en encuadre (gutter de scrollbar).
  Validar en navegador/pantalla real.

## Deploy y rollback

- Deploy del post: `cat wordpress/post-standalone.html | docker exec -i salmones-wp wp post update 70 - --allow-root`
- Iterar contra el post 70 (movil ya validado; no romperlo: tocar solo `render()`
  y las capas `.sv-d`, NUNCA `renderMobile()` ni `.sv-m`).
- Rollback: `git revert` del commit, o redesplegar la version previa del post.

## Decisiones abiertas (confirmar con cris antes de cerrar)

- Una vez validado escritorio, decidir si se elimina el set `of-*` viejo.
- Cuando movil + escritorio esten listos, decidir publicacion en `cip.udp.cl`
  (produccion, gestionada por UDP — NO tocar sin coordinar).
