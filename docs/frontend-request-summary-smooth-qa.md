# UI-REQUEST-SUMMARY-SMOOTH-01 — Desplazamiento suave desde las campanitas

Fecha: 2026-10-20. Clasificación: solo frontend; animación de navegación local.

Bastián confirmó «está funcionando super bien» el recorrido publicado de las campanitas y pidió conservarlo añadiendo una transición suave, como deslizar hacia las tarjetas. Referencia de la entrega anterior: código `723674f`, cierre publicado `ee070a99dcc733d2f4321fb2cdfa0cb826d14e93`. La confirmación no especificó comprobación independiente de ambos dispositivos y no constituye aprobación global de todas las pantallas.

## Cambio

Se conserva selección, destino, espacio inferior necesario y separación de 12 px bajo el encabezado de UI-REQUEST-SUMMARY-SCROLL-01. El comando de scroll utiliza ahora `scrollTo({ top, behavior: 'smooth' })` del navegador. Cuando el usuario tiene movimiento reducido activado se usa `instant`, a través de la preferencia ya leída por RequestsScreen.

La velocidad y curva son nativas del navegador; no se fija una duración artificial. No se añaden bucles, observadores, temporizadores ni seguimiento de la posición. El recorrido sigue siendo una sola solicitud por clic, para cliente y negocio, sin expandir tarjetas o acuerdos. No se modifica el recorrido desde una notificación externa.

## Archivos

- `src/app/screens/requests/requestSummaryScroll.ts`: scroll suave o instantáneo según preferencia.
- `src/app/screens/RequestsScreen.tsx`: transmite la preferencia de movimiento reducido.
- `src/app/screens/requests/requestSummaryScroll.test.ts`: conserva cobertura de rango de scroll y verifica movimiento reducido con el mismo destino.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`: entorno de pruebas compatible con el método nativo scrollTo.
- `scripts/check-request-summary-scroll.mjs`: verifica posiciones intermedias de una transición real y llegada al destino, además de su variante sin animación.
- Esta ficha y la confirmación añadida al registro anterior; catálogo y resultado de despliegue en el cierre documental.

## Validación

**934 pruebas aprobadas en 85 archivos**, build QA aprobado y **24 casos táctiles en Chrome aprobados**: ambos roles, tres tamaños sin movimiento reducido y un tamaño adicional con la preferencia activada. El navegador mostró posiciones intermedias antes de llegar al mismo destino; con movimiento reducido llegó sin animación. La comprobación del desplazamiento manual admite un píxel de redondeo nativo.

La prueba Chrome usa la pantalla y CSS reales con datos sintéticos, perfil aislado y backend deshabilitado, mediante `scripts/check-request-summary-scroll.mjs`. No acredita la animación de Safari en un iPhone físico; revisión de la nueva transición por Bastián pendiente. No se repiten acciones reales de pedidos ni START_WORK para comprobar el movimiento.

## Contrato y entrega

Sin campos/endpoints nuevos o modificados, peticiones, recargas, permisos, estados o acciones adicionales. Backend/Railway QA no requiere cambios. Registro temporal del clic y arquitectura nueva de notificaciones siguen pausados. Sin cambios en `main`, producción ni configuración global.

Publicar únicamente Preview QA desde Git real, rama `qa` y SHA exacto, con Backend QA existente y el comando exclusivo por despliegue:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

Guardar código, pruebas y ficha; después de comprobar READY, SHA y alias, guardar también el resultado y nombre+commit en un cierre documental enviado a Git. No dejar notas locales pendientes.

## Prueba en celular

Comprobar el nuevo SHA en QA habitual. Pulsar una campanita desde el inicio: debe seleccionar la categoría y deslizar suavemente hasta la fecha/primera tarjeta, sin abrirla. Deslizar manualmente después y repetir el clic. Si «Reducir movimiento» está activado en el sistema, debe conservar el desplazamiento directo sin animación. No crear ni modificar pedidos como parte de esta comprobación.
