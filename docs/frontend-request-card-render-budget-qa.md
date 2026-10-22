# PERF-REQUEST-CARDS-01 — Menor carga decorativa en Solicitudes

2026-10-21. Clasificación: solo frontend. Usuario reporta lentitud en iPhone al
deslizar Solicitudes y capturar pantalla; no se atribuye sin medición al arranque.

## Evidencia y alcance

ProposalChat solo se monta al abrir Revisar propuesta. En cambio, las tarjetas de
la lista mantienen luces con filter:blur, sombras pulsantes y reflejos infinitos.
La prueba local de 20 ProcessOrderCard negociando encontró 140 animaciones CSS
infinitas, 109 fuera del viewport según bounds del target, que seguían activas
tras estabilizar. Esto demuestra carga sostenida; no demuestra toda la causa
del síntoma en el iPhone ni equivale a medir Safari o la captura del sistema iOS.

Antes: fondos/blobs animados con desenfoque y filtros de fondo superpuestos,
bucles ilimitados incluso en listas largas. Después: luces de tarjeta estáticas
mediante gradientes radiales, acabado de vidrio sin backdrop-filter superpuesto,
reflejos breves y pulsos limitados. Animaciones decorativas de respuestas plegadas
desactivadas. Conserva colores, contenido, geometría, controles y navegación.
Notificación conserva marcador y enfoque animado finito; loaders no modificados.
No cambia el diseño H del chat ni los botones de confirmación fuera de las tarjetas.

Archivos: src/styles/index.css; scripts/check-request-render-budget.mjs;
esta ficha y frontend-ui-design-catalog.md. Sin cambios en React/lógica/API.
Sin campos/endpoints nuevos o modificados. Lecturas, allowedActions, estados,
confirmaciones, idempotencia y fotos existentes intactos. Sin backend/Railway
necesarios; main y producción no modificados. Avances conservados.

## Medición reproducible

Build QA; node scripts/check-request-render-budget.mjs baseline (guardar CSS
anterior antes del cambio), luego baseline-replay y optimized. Referencia funcional
bb0820b. Chrome headless, GPU deshabilitada, CPU 4x, viewport 393x852/DPR2,
20 tarjetas sintéticas. Ventana de métricas de 3 s tras 1,2 s; 3 capturas CDP;
comprobación posterior de estabilización y desplazamiento. Sin API/pedidos reales.

| Medida | Referencia | Ajuste final |
| --- | ---: | ---: |
| Animaciones infinitas | 140 | 0 |
| Animaciones activas tras estabilizar | 140 | 0 |
| TaskDuration, ventana 3 s | 2991 ms | 2140 ms |
| RecalcStyleDuration | 880 ms | 322 ms |
| Mediana de 3 capturas CDP | 558 ms | 542 ms |

Los tiempos de captura variaron entre ejecuciones; no se promete un porcentaje
de mejora en el iPhone. Evidencia robusta: desaparición de bucles persistentes y
reducción del trabajo de estilo en esta carga controlada. Capturas comparadas
visualmente; sin desborde y acabado suavizado. Datos locales en
node_modules/.cache/request-render-budget (artefactos de prueba ignorados por Git).

## Validación

1146 pruebas/98 archivos aprobados. Build QA/PWA aprobado; advertencia de bundle
grande existente. 234 verificaciones Chrome de tarjetas: 12 estados, 320/393/400 px,
claro/oscuro, cliente/negocio, legacy, historial, apertura ordenada, borradores,
foco de notificación y movimiento reducido. 23 recorridos de negociación
sintéticos aprobados: acciones, conflictos, recuperación y fotos.
Último ajuste de stops de gradientes verificado con build/medición/captura;
sin cambios de layout o comportamiento desde las regresiones.
Sin acciones ni uploads reales. Pendiente prueba física en el iPhone:
entrar a Solicitudes, esperar unos segundos, deslizar varias tarjetas y capturar.
No se da por solucionada la lentitud en dispositivo antes de esa prueba.
Reintentos fiables de notificaciones siguen pendientes.

Código funcional `9be29ca279e8e99bfd3d0dbd9acf5162839f1dc9`, origin/qa.
Preview `dpl_D4QVqgYpuTktdBPernctJT3mXmqS` READY y alias habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
SHA/ref qa exactos, Backend QA confirmado en preflight; build global null y
productionBranch main conservados. Build override:
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Resultado guardado en cierre documental publicado con el mismo código/opciones.
No equivale a conformidad física: pendiente prueba del usuario en el iPhone.
