# UI-ACCEPT-ORDER-PARITY-01 — Aceptar pedido con el vidrio de Aceptar propuesta

2026-10-22. Solo frontend, rama qa. Bastián confirmó que se refiere al botón
Aceptar pedido de Mi Negocio (Android), usando Aceptar propuesta del cliente
como referencia visual.

## Antes y después

Ambos usan AcceptGlassButton, pero PERF-REQUEST-CARDS-01 simplifica sus efectos
en las tarjetas. UI-RESPONSE-MOTION-01 recuperó luces y brillo visibles, con
gradientes sin blur, sin halo ni pulso del check. El usuario confirmó que se
mueven, pero solicitó el diseño y animación completos de Aceptar propuesta.

Se recuperan para Aceptar pedido los gradientes originales, blur de luces,
vidrio, halo verde 2.6s, check 2.6s, luces de 6/7/5s y brillo 3.2s con demora .6s.
Solo mientras está desplegado, dentro de la vista, con documento visible y sin
movimiento reducido. Se reutiliza el observer existente sin lógica nueva.
Proponer alternativa y Rechazar conservan la versión aprobada anterior.
La optimización de los fondos/listas y los demás botones permanece vigente.

Archivos: src/styles/index.css; scripts/check-order-card-aurora.mjs; esta ficha;
docs/frontend-ui-design-catalog.md. AcceptGlassButton.tsx, acciones, confirmación,
permisos, importes y estados conservados. Campos/endpoints nuevos o modificados:
ninguno. Backend/Railway no necesarios. main y producción intactos.

## Validación y publicación

1147 pruebas/98 archivos y build QA/PWA aprobados; aviso de bundle grande
preexistente. 234 casos visuales Chrome en 320/393/400 px, claro/oscuro,
cliente/negocio, legacy, despliegue ordenado, borradores y movimiento reducido.
Comparación adicional de CSS calculado con una instancia original del componente
fuera de la tarjeta: coinciden nombres, duración, demora, repetición y curva de
animaciones, gradientes, filtros y radios de halo/check/luces/botón/brillo.
Se excluye color heredado de wrappers decorativos, que no pinta contenido.
Halo, check y backdrop-filter se detienen al salir de pantalla. Sin acciones
ni acceso real a backend. Presupuesto visual aprobado: 20 tarjetas de cliente,
0 animaciones infinitas/fuera de pantalla y 0 decoraciones activas al estabilizar;
scroll 900 sin red (Chrome CPU 4x, no WebKit).

Código `d242267592fc808391b732c4c44d968f7a03bf7e` enviado a origin/qa.
Vercel `dpl_B5b68jxzLvJ69esdtv5d83zCNUW8` READY; SHA/ref y alias habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app verificados por API.
Build preview: ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0
npm run build -- --mode qa. Preflight confirmó backend QA, build global null y
productionBranch main conservados. Cierre documental con el mismo código y
opciones QA; aún sin aprobación física del usuario para este ajuste.
Pendiente prueba física en Android y regresión de fluidez en iPhone después de
publicar. Restaurar efectos en el botón visible tiene un coste visual mayor que
la versión simplificada; la medición sintética de listas no demuestra su coste
en WebKit real. Reintentos fiables de notificaciones siguen pendientes.
