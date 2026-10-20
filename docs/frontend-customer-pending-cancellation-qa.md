# UI-CUSTOMER-PENDING-CANCEL-01 — Anular antes de la primera respuesta

Fecha: 2026-10-20. Clasificación: frontend + backend; backend ya publicado, integración actual exclusivamente frontend QA.

## Contrato y alcance

Contrato leído en `C:/dev/zipco-backend-qa/docs/testing/customer-pending-cancellation-qa.md`, identificador backend `REQ-CUSTOMER-CANCEL-PENDING-01`. Publicación Backend QA documentada: `577c0c7cd0468ea68d9d8ffc2b1a8a63b46a90d1`. No se modifica ese repositorio ni se despliega Railway en este trabajo. La prueba física de integración sigue pendiente.

Botón **Anular solicitud** únicamente en la vista cliente de un pedido con proceso inicial válido y `allowedActions` que incluya `CANCEL_PENDING_REQUEST`. No se infiere el permiso de Order.status ni se modifica la anulación histórica o ANNUL_COORDINATION. Visible sin necesidad de desplegar primero el detalle del pedido.

Al pulsarlo abre **¿Confirmas anulación de tu pedido?**, botones **Sí / No**, sin motivo. No cierra el pedido al abrir el popup. No/Escape cierran sin ejecutar una acción; Sí confirma deliberadamente. Durante el envío se bloquean ambos botones y el cierre por Escape. Se restaura el foco cuando el control anterior sigue presente.

## Petición, recibo y recuperación

- POST `/request-processes/:id/actions/cancel-pending-request`, con el JWT de la sesión ya existente y `Idempotency-Key` UUID v4 de la intención. No registrar JWT, clave de sesión, contactos o respuestas completas.
- Cuerpo exacto: `expectedVersion` del proceso y `confirmationAccepted: true`. No motivo, estado solicitado, destinatario o campos adicionales. Validación local de enteros PostgreSQL y UUID antes del POST.
- Recibo válido: mismo pedido/proceso, Order cancelled, proceso CLOSED, versión esperada + 1, propuesta original conservada, acuerdo null y acciones vacías. Se valida el cierre CUSTOMER_CANCELLED_BEFORE_RESPONSE / CUSTOMER / reasonDetail null con fecha válida; se conserva el DTO recibido, sin inventar autor o timestamp.
- La solicitud confirmada pasa a **Historial** y conserva productos, total, fecha/hora, nota y foto originales disponibles en las listas. Rótulo **Anulada por el cliente**, acceso **Ver solicitud**. No se solicita un acuerdo para este cierre ni se presenta como condiciones aceptadas.
- La intención usa el mecanismo existente de almacenamiento acotado por identidad/participante/proceso: solo clave UUID, acción y cuerpo exactos; sin credenciales o contactos. Reintento incierto conserva la misma clave y cuerpo. Al restaurarla exige leer el estado antes de reintentar.
- Si una lectura prueba el cierre, se resuelve la intención y se muestra Historial sin repetir el POST. Un POST confirmado mantiene su recibo aunque falle el GET posterior; Historial sigue mostrando el cierre conocido y un aviso de fallo de actualización, con reintento de lectura.
- STALE_VERSION / INCOMPATIBLE_STATE actualizan el estado real y explican que el pedido cambió o el negocio respondió. No se cambia automáticamente a una anulación de coordinación. Otros conflictos, permisos, 401/403/404 y datos inválidos usan el tratamiento seguro existente. No asumir éxito por un conflicto o recibo incoherente.
- Una lectura antigua no puede revertir una versión confirmada. Doble toque, almacenamiento restaurado y acciones confirmadas usan las protecciones de intención ya existentes.

Sin borrado, archivo u ocultación para representar el cierre; sin motivo ni notificación nueva de anulación al negocio o cliente. El negocio ve el estado al refrescar. Los errores de operación conservan el mecanismo de explicación de errores existente; no se añaden avisos de éxito o eventos push por esta funcionalidad.

## Archivos de integración y pruebas

Aplicación:

- `src/app/screens/requests/requestProcess.ts`: acción, cierre mínimo tipado, normalización y etiqueta terminal.
- `src/app/screens/requests/coordinationApi.ts`: ruta, cuerpo, permiso y validación estricta del recibo.
- `src/app/screens/requests/coordinationIntent.ts`: recuperación de la acción nueva en el gestor existente.
- `src/app/screens/requests/useCoordination.ts`: envío, reconciliación, no repetición y explicación del conflicto.
- `src/app/screens/requests/PendingCancellationActions.tsx`: botón y popup Sí/No accesible, recuperación de intención incierta.
- `src/app/screens/requests/ProcessOrderCard.tsx`: integración solo cliente en fase inicial.
- `src/app/screens/requests/ProcessHistoryCard.tsx`: detalle original sin acuerdo para este motivo exacto.
- `src/app/screens/requests/requestStatusGrouping.ts`: CLOSED con ese cierre válido pertenece a Historial.
- `src/app/screens/RequestsScreen.tsx`: navegación tras recibo y conservación del cierre visible si falla la lectura posterior.

Pruebas y fixtures sintéticos:

- `pendingCancellationFixtures.ts`, `pendingCancellationApi.test.ts`, `PendingCancellationActions.test.ts` en requests.
- `coordinationIntent.test.ts`, `useCoordination.test.ts`, `processCardVisualFlow.test.ts`, `useRequestsContract.test.ts` en requests.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`.
- `src/app/notifications/BusinessNotificationMonitorFlow.test.ts`.

Esta ficha y las referencias documentales de cierre identifican el cambio; no se modifica código de notificaciones del monitor, service worker o backend.

## Validación

**975 pruebas aprobadas en 87 archivos**, build QA aprobado y diff sin errores. Cobertura nueva: No no envía; Sí envía la acción exacta; permiso/participante; recibos malformados; límites de enteros; cierre sin acuerdo en ambas listas; datos originales de Historial; conflictos; respuesta perdida, misma clave/cuerpo; reconciliación por GET; POST confirmado seguido de GET fallido; lecturas antiguas; almacenamiento confirmado; contadores sin nuevo aviso al negocio.

Regresión del recorrido anterior de campanitas: **24 casos táctiles en Chrome con datos sintéticos y backend bloqueado**, sin nuevas acciones de pedidos reales. Esta regresión no prueba el popup ni el backend en un teléfono físico. Advertencia habitual de tamaño del bundle de Vite. No se ejecutan CANCEL_PENDING_REQUEST, START_WORK u otras mutaciones reales para validar la publicación.

## Publicación y prueba pendiente

Guardar código, pruebas y documentación; publicar solo `qa` en Vercel Preview desde Git real y SHA exacto, con Backend QA. Mantener configuración temporal por despliegue, sin ajustes globales:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

Comprobar READY, SHA, rama y alias; guardar también resultado y nombre+commit en un cierre documental enviado a Git. Sin cambios en `main`, producción o Railway. Arquitectura nueva de notificaciones y recorrido temporal siguen pausados.

Prueba física coordinada por Bastián, **pendiente**: en una solicitud nueva con permiso, abrir el popup y pulsar No; comprobar que continúa pendiente. Volver a abrir y pulsar Sí; comprobar salida de Pendientes y presencia en Historial del cliente y, tras actualizar, del negocio, con datos originales y sin motivo/borrado/nuevo aviso. Una prueba controlada simultánea de aceptación/anulación debe mostrar un único resultado ganador y actualizar el otro celular, sin repetir acciones confirmadas. Este documento no acredita que esa prueba móvil ya se haya realizado.
