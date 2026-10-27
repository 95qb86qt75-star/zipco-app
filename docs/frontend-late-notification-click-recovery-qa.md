# Recuperación del clic de notificación — frontend QA

Clasificación: solo frontend, navegación local sobre el contrato push existente. Traspaso leído: `C:/dev/zipco-backend-qa/docs/testing/late-initial-notification-click-handoff-qa.md`. No cambia el envío push, sus destinatarios, permisos ni acciones de negocio.

## Evidencia y corrección

Prueba física reportada: iPhone en segundo plano abre Inicio al tocar la consulta; entrando manualmente a Solicitudes → Por responder, la consulta existe. No se dispone del recorrido interno de ese clic; no se atribuye su causa exacta sin esa evidencia.

La reproducción con App y RequestsScreen reales encontró que una consulta pendiente tiene estado `pending`, mientras la selección del filtro de respuestas solo reconocía propuestas. La categoría se abría pero sus tarjetas quedaban ocultas. Ahora se usa el mismo resumen de atención que clasifica la consulta para seleccionar Por responder y enfocar su tarjeta.

Además, la deduplicación identificaba una nueva pulsación de una notificación ya atendida como si fuera una repetición de transporte. Cada clic físico recibe ahora un identificador local `notificationClick`, compartido por mensajes, URL y caché del mismo intento. El evento estable sigue deduplicando la presentación del aviso. Un acuse antiguo no borra el destino de un clic posterior.

Al reanudar se recuperan la URL de lanzamiento, el destino pendiente y la caché del worker. Los mensajes repetidos se agrupan y el destino solo se consume después de cargar sesión/lista y enfocar la tarjeta visible. No se reenvía la consulta ni se modifica el pedido.

## Contrato conservado

Push: `order-late-initial-event`, `eventType: ASK_LATE_REQUEST_NEED`, URL `/?open=requests-customer&orderId=<id>`, tag de outbox existente. `notificationClick` es metadato de navegación local; no es un campo API ni se envía al backend.

Se mantienen las lecturas existentes, incluida GET `/orders/my-orders`, con negociación de contrato actual y `requestProcess.lateInitialResponse`. No se crean endpoints, datos persistentes del servidor, estados, migraciones ni permisos. Esta reparación no llama a acciones `/actions/`.

## Archivos

- `public/push-sw.js`: revisión `notification-click-attempt-v8` e identidad por clic.
- `src/app/notifications/notificationNavigation.ts`: valida la identidad local y conserva compatibilidad con URLs anteriores.
- `src/app/App.tsx`: recuperación del destino al reanudar y tras sesión tardía.
- `src/app/screens/RequestsScreen.tsx`: selección del filtro y tarjeta de la consulta.
- `scripts/build-app.mjs`, `qaNotificationClickTrace.ts` y `QaNotificationClickTracePanel.tsx`: habilitación temporal del recorrido saneado solo en Preview QA; revisión esperada y texto del panel.
- `notificationLifecycle.test.ts`, `RequestsScreen.notificationNavigation.test.ts` y `scripts/check-notification-click-app.mjs`: regresiones de navegación.

## Validación

- 1.471 pruebas / 119 archivos aprobados.
- Siete escenarios de navegador con App y RequestsScreen reales: segundo plano/primer clic, nueva pulsación del mismo aviso tras Inicio, otro pedido, recuperación de URL en app montada, mensaje perdido con caché, lista tardía y entrega repetida, arranque con sesión y lista tardías. Transporte y HTTP sintéticos; cero mutaciones reales.
- Worker real probado en las pruebas de ciclo de vida, incluyendo acuse antiguo frente a clic nuevo.
- Build QA/PWA aprobado con instrumentación temporal. Permanece el aviso conocido de bundle mayor de 500 kB. No se presentan TypeScript/lint independientes como ejecutados.

## Comprobación física pendiente

Publicar en Vercel QA por integración GitHub y comprobar versión de frontend y worker v8. En Solicitudes, el panel «Recorrido del clic externo QA» registra etapas aunque no haya un error de carga; no contiene teléfonos, tokens ni contenido del pedido.

Con ZIPCO en segundo plano, tocar una notificación existente disponible debe abrir Solicitudes → Por responder y expandir la consulta correcta. Si la notificación ya fue consumida, coordinar una prueba de transporte sin repetir la acción de consulta. La reproducción Chrome no acredita el resultado físico iOS.

Railway QA no requiere cambios. No se modifican flags ni pedidos. Rama `qa`; main y producción intactos. Los seis documentos locales previos ajenos permanecen fuera de esta entrega.
