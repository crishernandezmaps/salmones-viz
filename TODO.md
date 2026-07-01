# TODO — Salmones Viz

_Actualizado 2026-06-30._

## Estado

- **Intro movil (post 70, `salmones-movil-v15`)**: aprobada por la clienta, iterando
  detalles. NO tocar `renderMobile()` ni `.sv-m`.
- **Intro de ESCRITORIO ADITIVA (secuencia junio)**: CONSTRUIDA y desplegada al post 70,
  activable con **`?introd=junio`** en escritorio. Rama `renderDesktopJunio()` + capas
  `.sv-d2` (`d1-*`). Sin el flag, el post se ve identico. **EN PAUSA** esperando los
  assets FINALES de la disenadora (los `d1-*` actuales son preliminares de `DESKTOP_1`).

## Pendientes

### Intro de escritorio (al llegar assets finales)
- [ ] Rehacer/re-encuadrar con los assets oficiales de la disenadora.
- [ ] Pulir el solape ~p=0.55 (la jaula submarina entra sobre la superficie aun plena).
- [ ] Decidir si se elimina el set viejo `of-*`/`render()` una vez validado escritorio.

### Otros (de sesiones previas)
- [ ] BD de sobreproduccion ajustada (cris la manda; actualiza `?embed=conflicto`).
- [ ] Portadas y buzo apuntando al frente: assets de la disenadora (no codigo).
- [ ] Copy de la seccion del mapa nuevo (lo ajusta UDP).

## Gotcha critico — WordPress escapa `&` en el `<script>`

WP convierte `&` a `&#038;` dentro del contenido del post, incluido el `<script>`. Eso
rompe `&&` (-> `&#038;&#038;`, SyntaxError) y ABORTA todo el motor de la intro (movil
incluido). **PROHIBIDO `&`/`&&` en el JS de `post-standalone.html`**: usar `indexOf` +
ternarios en vez de `&&`, y evitar `&` en regex. Verificar post-deploy con
`curl -s <URL> | grep "var useJunio"` (no debe aparecer `&#038;`).

## Deploy
Ver `DEPLOY.md`. Resumen: editar `wordpress/post-standalone.html` -> push a `main`
(mapas/assets via Pages) + `wp post update 70` (post). Detalle en `.claude/infra.md` (local).
