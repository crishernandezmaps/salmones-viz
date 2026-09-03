# Embed: Solicitudes de relocalización por empresa (`?embed=solicitudes`)

Barras horizontales: 177 solicitudes de relocalización (2010 a junio de 2026) por
empresa. Las empresas con 5 o menos solicitudes se agrupan en "OTRAS EMPRESAS" (22).
Reproduce de forma profesional el prototipo `animacion/Gráfico 2.html` del equipo UDP
(agosto 2026): mismos datos, paleta de la diseñadora, sin D3 ni CDNs (React + CSS).

- **Datos**: hardcodeados en `GraficoSolicitudes.jsx` (18 empresas; fuente declarada:
  Subpesca vía Ley de Transparencia).
- **Animación**: las barras crecen en cascada al hacerse visible el gráfico; las
  cifras `N (x,x%)` aparecen después.
- **Responsive real**: en pantallas angostas la etiqueta pasa arriba de la barra.

## Iframe para WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=solicitudes"
    width="100%" height="680" frameborder="0"
    style="border:0; display:block; background:#fff;" title="Solicitudes de relocalización por empresa"></iframe>
</div>
```

Altura sugerida: ~680 px escritorio / ~900 px móvil.
