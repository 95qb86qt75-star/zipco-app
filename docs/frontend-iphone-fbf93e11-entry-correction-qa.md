# iPhone QA fbf93e11: entrada del clic y conservación del destino

2026-10-29. Clasificación final: **solo frontend**, corrección del manejador local y diagnóstico compatible con el contrato coordinado E168. La alternativa de navegación nativa descrita abajo requiere coordinación previa y no se implementa aquí.

## Evidencia conservada

Adjunto original copiado sin editar a [evidence/iphone-system-fbf93e11-v11.json](evidence/iphone-system-fbf93e11-v11.json). SHA-256: `69d3f7c650d6477468f305e100d7bddce28424f063eee10a83fc89973b443c5d`.

Frontend, worker controlador y activo del adjunto: `03f0e8b8204a4661902f74e2f45238f3ca3d3fe8`, revisión `notification-click-attempt-v11`; standalone=true, expectedQaAlias=true, un registro de origen propio/scope raíz/script esperado. Almacenamiento de página y worker disponible en la lectura. Diez avisos enumerados, todos sin correlación/build/revisión diagnósticos. No se sabe si alguno corresponde al aviso ya tocado; no acredita que se hayan perdido los datos de fbf93e11.

El usuario comunica que la sesión remota de **fbf93e11** contiene DELIVERY_ATTEMPTED y PROVIDER_ACCEPTED a las 23:38:39 y PUSH_RECEIVED/SYSTEM_SHOWN a las 23:38:42; no CLICK_RECEIVED. Estos resultados remotos son evidencia aportada por el usuario, no una lectura autenticada nueva de Railway desde este workspace.

La traza local tampoco incluye click-received; la app reanuda sin destino. Los dos ack-mismatch aparecen antes del envío referido y no se atribuyen al intento. El historial limita cincuenta entradas por origen y puede descartar etapas previas; los reportes remotos también pueden faltar por red, vencimiento o reinicio. La causa física sigue sin confirmar.

## Revisión y corrección concreta

La búsqueda local encuentra una llamada showNotification y un manejador notificationclick en `public/push-sw.js`, registrado sincrónicamente por el script importado de Workbox. No hay un segundo proveedor/handler local de notificaciones del sistema que explique el banner.

En v11 anterior, antes de escribir click-received local se ejecutaban el helper remoto begin/report y varias lecturas de Notification.data. Una excepción en ese tramo podía impedir la entrada registrada y la navegación. Después de close() se volvía a leer Notification.data para normalizar el destino y construir su identidad; una excepción de close() abortaba el resto. El catch de tracedEvent también volvía a leer Notification.data para la correlación, pudiendo ocultar el error original. Son defectos verificables de aislamiento y conservación; no se ha observado que hayan ocurrido en este iPhone.

Cambios:

- Registrar **click-entered** local antes de leer Notification.data o invocar el diagnóstico remoto. No contiene payload ni correlación inventada. click-received sigue registrando las banderas/correlación disponibles después de la lectura. Una lectura fallida marca hasError sin exportar mensaje ni stack.
- Capturar una sola vez datos y tag antes del cierre. Usar esa copia para URL, orderId/quoteId, identidad versionada, bloque diagnóstico y navegación. Cerrar el banner pasa a ser una operación de mejor esfuerzo: su excepción no elimina el destino ya capturado.
- Aislar las llamadas sincrónicas a los helpers remotos mediante observe(). Su fallo no impide showNotification/openWindow/postMessage ni enmascara click-failed. Los fetch/ACK/reintentos y su timeout conservan E168.
- El catch usa la correlación del evento ya guardada y no vuelve a acceder a Notification.data. Sin datos válidos no se deduce el pedido por tag, último push, último pedido o pantalla previa.
- Se mantiene **v11** porque la API remota admite solo v10/v11. El SHA distingue la corrección. La única etapa nueva es local; no se envía a backend ni exige ampliar su allowlist.

El bloque privado sigue únicamente en Notification.data y memoria del worker: no se guarda copia del receiptToken en caché, página, URLs, inventario o exportaciones. No se recupera un comprobante ausente inventándolo. La corrección no puede hacer que el sistema despache un evento que nunca entrega.

## Contrato, archivos y pruebas

Contrato conservado: URL `/?open=requests-customer&orderId={orderId}`, orderId/processId/processVersion y tag `order-{orderId}-availability-{processVersion}`. Se mantienen normalización, nonce por clic, URL de lanzamiento de Apple, mensajes/reintentos acotados, recuperación por URL/caché y foco real tras cargar la lista. Aviso interno intacto.

No se añade/modifica ningún endpoint o campo de API. Se conservan las rutas E168 `/qa/push-observations/sessions`, `/qa/push-observations/sessions/:sessionId` y `/qa/push-observations/events`, JWT/comprobante separados y las nueve etapas remotas existentes. Sin cambios en estados, permisos, pedidos, suscripciones, activación o variables Railway.

Archivos funcionales: `public/push-sw.js`, `src/app/notifications/qaNotificationClickTraceStore.js`. Pruebas: `notificationLifecycle.test.ts`, `qaPushObservationWorker.test.ts`. Esta ficha y el JSON son la documentación/evidencia. Documentos locales previos ajenos quedan excluidos.

Validación local:

- **1.615 pruebas en 126 archivos aprobadas**. Casos nuevos: getter de Notification.data fallando antes del diagnóstico, datos que dejan de estar disponibles al cerrar, close() que lanza y helpers begin/report/bind/metadata/posted/flush que lanzan. Se mantiene la prueba de reinicio del worker, caché indisponible, privacidad, transporte y ACK real.
- **Once escenarios de navegador con App real aprobados**, incluyendo Inicio/Perfil/catálogo, app ya montada, URL/caché, sesión/lista tardías, dos pedidos, clic repetido y aviso interno. API/worker sintéticos; cero pushes, pedidos o mutaciones reales. No equivale a comprobar el clic físico de iOS.
- Build QA/PWA verificado antes de publicar; advertencia conocida por bundle mayor de 500 kB. No se afirma ejecución de lint/tsc independiente.
- Publicación autorizada solo por rama `qa` → GitHub → Vercel QA, identificada en la entrega final con SHA y estado. Railway no necesita despliegue para esta corrección. `main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta.

## Propuesta concreta para coordinar con backend si persiste

WebKit admite `navigate` en NotificationOptions, además de `data`: [IDL oficial](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/notifications/NotificationOptions.idl) y [implementación de Notification](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/notifications/Notification.cpp). El [explainer de WebKit, Activating a Notification](https://github.com/WebKit/explainers/blob/main/DeclarativeWebPush/README.md#activating-a-notification) describe que una URL de acción puede abrirse directamente y omitir notificationclick. Esto es una alternativa técnica, no evidencia de un defecto de iOS en este caso.

Propuesta pendiente de acuerdo: probar exclusivamente en QA la URL nativa de la notificación, construida con el destino ya contratado y validación estricta de origen/ruta/identidad, conservando el manejador legacy y el aviso interno para navegadores sin soporte. No sería necesario inventar un nuevo pedido ni reemplazar el destino por el último aviso. La compatibilidad física y posibles duplicaciones deben probarse antes de activarla.

Aunque esta opción de showNotification no requiere por sí sola nuevos campos del servidor, **sí cambia el significado del diagnóstico**: podría haber navegación exitosa sin CLICK_RECEIVED ni ACK al worker. Antes de implementarla hay que acordar cómo distinguir ese camino, qué correlación pública transporta y cómo acreditar foco sin exponer comprobantes ni fingir un clic del worker. Cualquier etapa/campo/revisión nuevos requiere actualizar el contrato y la allowlist backend primero. No introducirlos como texto libre.

Si se evalúa además push declarativo completo, cambia el payload backend (`web_push: 8030`, notification/navigate); requiere un contrato separado, compatibilidad legacy, política de presentación sin duplicados y backend QA publicado antes del frontend. No se modifica el payload actual aquí.

Para el siguiente aviso legítimo, sin repetir confirmaciones ni crear pedidos/pushes, comparar el prefijo QA con el informe remoto y copiar pronto el recorrido local. click-entered distinguirá entrada al handler de la lectura de datos; su ausencia todavía no descarta pérdida/recorte del reporte ni confirma causa iOS. No borrar instalaciones ni evidencia para reproducir.
