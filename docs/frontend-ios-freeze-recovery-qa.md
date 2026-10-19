# QA-IOS-RECOVERY-01 — Contención del bloqueo de Solicitudes

Fecha: 2026-10-19. Clasificación: frontend QA; diagnóstico y contención, causa pendiente.

Bastián confirmó que cerró completamente la PWA del iPhone y volvió a abrirla después de publicar la retirada `d01b5a5`. Continúa viendo «Cargando pedidos…» sin poder tocar ni desplazar la pantalla. Android no presenta el bloqueo informado. La retirada del encuadre automático no acredita recuperación. No se conoce todavía el SHA efectivamente abierto en ese iPhone.

## Cambio mínimo

- `src/app/screens/RequestsScreen.tsx`: mostrar junto al título el SHA corto del build cuando está habilitado el diagnóstico QA. No requiere abrir el panel.
- Pausar el registro temporal del clic exclusivamente mediante el comando de este despliegue Preview:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
- Conservar el diagnóstico original de fallos de lectura, limitado a los seis campos acordados, y todo el código del recorrido. No borrar cachés, sesiones, suscripciones ni documentos.

La pausa permite aislar el registro; no demuestra que haya causado el bloqueo. No cambia contratos push, peticiones, recargas, permisos, acciones, datos ni comportamiento de pedidos. No incorpora endpoints ni campos API. Railway QA no requiere cambios. La arquitectura nueva de notificaciones sigue pausada y el encuadre completo de tarjeta sigue pendiente.

## Comprobaciones

46 pruebas aprobadas en cinco archivos: navegación de RequestsScreen, selección READY, RequestsScreen2A, ciclo de notificaciones y panel loadOrders. Build QA aprobado con trace=0; no se emite `qa-notification-click-trace.js`. Verificar también ausencia del colector en los bundles antes del envío. El aviso de tamaño de bundle de Vite continúa siendo una advertencia.

Publicar desde Git real, SHA exacto y rama `qa`, solo Preview. Mantener sin cambios el build global, `main` y producción. Los documentos locales anteriores permanecen fuera de este commit. Registrar el resultado del despliegue mediante un añadido, conservando este historial.

## Comprobación en iPhone

Abrir el acceso QA habitual. Leer la etiqueta `QA <SHA corto>` junto a Solicitudes y comprobar si responden los controles y termina la carga, sin ejecutar acciones del pedido. Si no aparece esa versión, investigar la actualización del bundle/worker instalado; si aparece y continúa bloqueado, investigar la interfaz y las lecturas de esa versión. No declarar recuperado por el solo hecho de que Vercel indique READY.

El worker sin colector conserva su revisión funcional; el campo build del sondeo puede ser nulo al no cargar el auxiliar temporal. La etiqueta visible identifica el bundle frontend. No confundir esa ausencia con una prueba de worker obsoleto.

## Retirada futura

Cuando se confirme recuperación y causa, acordar si hace falta reactivar el registro en un nuevo Preview QA. Retirar la etiqueta y el diagnóstico temporal mediante una actualización nueva validada, conservando los avances. No volver automáticamente a un despliegue anterior ni borrar historial.
