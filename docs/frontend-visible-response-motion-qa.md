# UI-RESPONSE-MOTION-01 — Movimiento de respuestas visibles

2026-10-22. Clasificación: solo frontend. Rama qa.

## Causa y resultado

PERF-REQUEST-CARDS-01 limitó globalmente los efectos de las tarjetas a una o dos
pasadas para aliviar la lentitud del iPhone. También alcanzó los botones de
negocio en Android: terminada la animación inicial quedaban estáticos.

Ahora Aceptar pedido, Proponer alternativa y Rechazar solicitud repiten el
movimiento de luces y brillo solo desplegados y dentro de la vista. Un
IntersectionObserver por tarjeta observa los tres botones por separado;
visibilitychange y prefers-reduced-motion detienen los efectos. Al plegar o
desmontar se desconecta y se limpian atributos y listeners. Sin listeners de
scroll ni actualizaciones React por frame. Sin observer disponible se conserva
el diseño estático. La preferencia de movimiento reducido se respeta.

Se mantienen los fondos de tarjetas estáticos, sin backdrop-filter en la lista,
y los gradientes suaves sin blur animado. No se restauran halos de box-shadow
continuos. Se conservan diseño, orden, permisos, formularios y handlers.
Mismo criterio de visibilidad en Android e iOS, sin detección de plataforma.

## Archivos y contrato

- src/app/screens/requests/useVisibleResponseMotion.ts: ciclo de visibilidad.
- src/app/screens/requests/ProcessOrderCard.tsx: ref y activación al desplegar
  el pedido pendiente del negocio.
- src/styles/index.css: movimiento continuo acotado a botones visibles.
- scripts/check-order-card-aurora.mjs: regresión Chrome con datos sintéticos.
- Esta ficha y docs/frontend-ui-design-catalog.md.

Campos/endpoints nuevos o modificados: ninguno. Backend y Railway innecesarios.
Sin acciones sobre pedidos reales. main y producción intactos.

## Validación y publicación

1147 pruebas/98 archivos y build QA/PWA aprobados. Advertencia de bundle grande
preexistente. Navegador: 234 casos de tarjeta en 320/393/400 px, claro/oscuro,
cliente/negocio y legacy. Comprobaciones adicionales: cada botón visible tiene
luces y brillo repetidos; fuera de pantalla, app oculta, tarjeta plegada y
movimiento reducido detienen los efectos. Apertura ordenada y borradores
conservados. Sin acceso real a backend ni acciones de pedido.

Presupuesto visual aprobado: 20 tarjetas de cliente, 0 animaciones infinitas,
0 fuera de pantalla, 0 decoraciones activas al estabilizarse; scroll hasta 900
sin solicitudes de red. Chrome sintético con CPU 4x, no medición de WebKit/iPhone.
Pendiente antes del cierre: publicación exacta Vercel QA.
Pruebas físicas Android/iPhone pendientes. Los reintentos fiables de
notificaciones siguen pendientes para el cierre general.
