# Embed: Concesiones salmoneras según empresa (`?embed=concesiones`)

Pictograma de peces: concesiones por empresa/holding sobre un total de 1.346.
Cada pez equivale a 20 concesiones (los restos se dibujan como pez recortado).
Reproduce de forma profesional el prototipo `animacion/Grafico 1.html` del equipo UDP
(agosto 2026): mismos datos, misma paleta, sin CDNs externos.

- **Datos**: hardcodeados en `GraficoConcesiones.jsx` (entregados por UDP; fuente
  declarada: Subpesca + SMA vía Ley de Transparencia).
- **Animación**: los peces entran en cascada al hacerse visible el gráfico
  (IntersectionObserver, threshold 0.15).
- **Responsive real**: en pantallas angostas la etiqueta pasa arriba de la fila
  (sin scroll horizontal ni layout desktop forzado).

## Iframe para WordPress

```html
<div class="alignfull" style="padding:0;">
  <iframe src="https://crishernandezmaps.github.io/salmones-viz/?embed=concesiones"
    width="100%" height="760" frameborder="0"
    style="border:0; display:block; background:#fff;" title="Concesiones salmoneras según empresa"></iframe>
</div>
```

Altura sugerida: ~760 px escritorio / ~1000 px móvil (o usar un resizer si se necesita exacto).
