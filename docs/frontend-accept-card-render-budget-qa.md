# PERF-ACCEPT-CARD-01 — Apertura rápida de confirmación sin borde intermitente

2026-10-22. Solo frontend, qa. Base 4a8946b. El usuario reportó lentitud al
abrir Aceptar contrapropuesta y un pestañeo periódico en la tarjeta. Confirmó
que el problema ocurre al abrir, no esperando el POST ni durante Cierre exitoso.

## Diagnóstico y cambio

Abrir la tarjeta ejecuta estado React local; el POST solo se inicia al confirmar.
El CSS entregado tenía entrada 3D de 550ms, flotación continua de toda la tarjeta,
desplazamiento cíclico del gradiente del borde, rayos filtrados giratorios y
sombras animadas. La revisión inferior continuaba animando sus botones y adornos
debajo del segundo overlay con backdrop-filter.

La escena sintética mostró 24 efectos activos en la fase de tarjeta, 16 en la
revisión cubierta. Esto evidencia carga innecesaria, pero no prueba por sí solo
la causa exacta del pestañeo en el Android físico.

Ahora la entrada usa opacidad/desplazamiento de 6px en 180ms; el borde permanece
estable y la tarjeta completa deja de flotar. Se mantienen la paleta, el vidrio,
el orbe, anillos, brillo suave y campos originales. Los rayos quedan estáticos,
la sombra del botón se mantiene fija y su movimiento es una pasada de luz por
transform. Se pausa la animación CSS de la revisión mientras está cubierta y
se reanuda al cerrar. Overlay acotado a esta confirmación: blur 9px → 5px.
No se cambian los botones glass de las tarjetas de pedido ni otros diálogos.
Movimiento reducido respetado. Cierre exitoso conserva duración y diseño.

## Archivos y contrato

- src/app/screens/requests/AcceptAuthorizeCard.tsx: clase del overlay específico.
- src/app/screens/requests/ProposalNegotiation.tsx: atributo de revisión cubierta.
- src/styles/index.css: entrada, borde, efectos pequeños y pausa temporal.
- scripts/check-deal-flow-render-budget.mjs: medición sintética real UI, sin API.
- scripts/check-alternative-negotiation.mjs: entrada rápida, pausa y reanudación.
- Esta ficha, catálogo y diagnóstico separado del pedido de autorización negocio.

API, campos, payloads, estado de aceptación, permisos y reintentos sin cambios.
Railway innecesario; backend, main y producción intactos.

## Evidencia y límites

Chrome headless con GPU desactivada, viewport393x852 DPR2 y CPU4x; misma escena
con componentes reales y snapshots sintéticos. Baseline CSS preservado en caché
ignorada; modo baseline-replay permite compararlo sin sobrescribirlo.

| Fase tarjeta, ventana ~1.8s | Antes | Después |
|---|---:|---:|
| Efectos activos | 24 | 5 |
| Efectos activos bajo revisión cubierta | 16 | 0 |
| TaskDuration (ms) | 1468 | 541 |
| RecalcStyleDuration (ms) | 707 | 148 |
| LayoutDuration (ms) | 0 | 0 |
| Frames muestreados | 105 | 98 |
| Intervalos >33ms | 6 | 10 |

La medición demuestra menor trabajo de estilo en esa muestra, no mejora
uniforme de FPS ni tiempos de Android/iPhone. Capturas685/608ms y el muestreo de
frames son variables. Cierre exitoso se observó como referencia, sin cambios;
no atribuirle una optimización en este bloque. Pendiente validación física de
apertura fluida, borde estable, cierre y retorno a la revisión.

Build QA/PWA aprobado, advertencia de bundle grande preexistente. 1153 pruebas
en 99 archivos y 38 recorridos de negociación Chrome aprobados, incluida
entrada180ms del negocio y pausa/reanudación de la revisión del cliente y negocio.
Medición optimizada aprobada: 5 efectos pequeños, 0 bajo revisión cubierta, sin
bucles de flotación de tarjeta, gradiente móvil del borde o sombras variables.
Publicación exacta: en cierre. No pedidos, uploads ni red
backend real en verificaciones locales. Reintentos fiables de notificaciones
siguen pendientes.

La nueva solicitud de cambiar el botón/mensaje del negocio a aceptar y autorizar
contacto queda separada y pendiente de coordinación contractual:
[Diagnóstico para backend](frontend-business-counter-contact-contract-diagnostic-qa.md).
