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

## Intro scrollytelling

Documentación detallada y **reglas para no romperla** en
`wordpress/scroll-oficial/README.md`.

> Nota: el `CLAUDE.md` (carpeta padre del local) quedó desactualizado respecto al
> flujo VPS porque el local está inaccesible. Este `DEPLOY.md` + la memoria del
> agente son la referencia vigente del flujo.
