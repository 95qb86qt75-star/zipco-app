# E166: correlación y persistencia del clic físico de iPhone

2026-10-27. Clasificación: frontend + backend coordinados, implementación frontend/worker QA. Contrato y diagnóstico leídos: C:/dev/zipco-backend-qa/docs/testing/availability-notification-identity-navigation-contract-qa.md, secciones E164 y E166. Backend 26ee14b sin necesidad de otra publicación.

## Evidencia y límites

El usuario volvió a mostrar el banner de disponibilidad en segundo plano del iPhone y el catálogo conservado tras tocarlo. Según E166, app/controlador/activo de la traza anterior eran 89b8e10/v9. El extracto no contenía el push, presentación o clic del banner mostrado. No es evidencia de una instalación antigua ni de que el parser o el handler sean la causa física. QA confirmado por el usuario; no se atribuye a producción.

En código v9, traceClick iniciaba store.record con void y no incluía explícitamente su finalización en el evento; un throw antes de event.waitUntil también dejaba un hueco. Esto es un defecto del diagnóstico, no una causa acreditada del fallo de navegación.

## Implementación v10

- Push, clic y mensajes locales conservan el trabajo funcional y adjuntan las escrituras diagnósticas a event.waitUntil. El handler se invoca síncronamente: openWindow de Apple sigue ejecutándose durante el evento físico, antes de esperar almacenamiento. No se cambia el algoritmo de lanzamiento, caché, reenvíos, normalización o ACK.
- Errores síncronos y asíncronos del handler generan push-failed/click-failed/worker-message-failed y vacían las escrituras antes de completar/rechazar el evento. Solo etapa, hasError y correlación aleatoria; no mensaje/stack/URL del error. Los fallos de almacenamiento conservan las limitaciones/fallback existentes y no se interpretan como inexistencia del clic.
- La copia de la página espera las escrituras ya solicitadas, incluidas las del módulo cargado bajo demanda, con límite de 1.200 ms y pageFlushCompleted explícito. El lector del worker espera sus escrituras antes de responder. Las colas de página están en módulo independiente para evitar ciclos de inicialización.
- Solo con instrumentación QA, los próximos banners comienzan con QA y ocho caracteres aleatorios de qaTraceId. En NotificationOptions.data local se conserva ese UUID, build y revisión de quien lo presentó. No se añaden campos al payload backend, a enlaces, suscripciones o pedidos. Sin instrumentación, título y datos del aviso se conservan.
- Inventario local de hasta ocho registros y veinte avisos pendientes por registro usando getRegistrations/getNotifications. Informa banderas de origen propio/scope raíz/script esperado/activo controlador, identidad del worker, presencia de destino válido e identidad semántica, código aleatorio y build/revisión del presentador si existen. No exporta origen, scope, scriptURL, title/body/tag, IDs de pedido/proceso, URL de destino, endpoint, claves o contactos.
- También lee trazas de un activo distinto del controlador. Si no puede enumerar, conserva el registro raíz conocido e informa registrationEnumerationAvailable=false. Inventario no disponible es distinto de inventario vacío. Un aviso cerrado puede desaparecer: ausencia en el inventario posterior no prueba ausencia de presentación. Registrar copiedAt permite ordenar la evidencia.
- Sigue compatible con avisos anteriores sin código/build, URL mínima y estados actuales autorizados; no navega al último pedido ni al último push cuando falta destino.

## Archivos

public/push-sw.js; src/app/notifications/notificationClickTrace.ts, notificationClickTraceQueue.ts, qaNotificationClickTrace.ts, qaNotificationClickTraceStore.js, qaNotificationInventory.ts, QaNotificationClickTracePanel.tsx; notificationLifecycle.test.ts, qaNotificationClickTrace.test.ts, qaNotificationInventory.test.ts; scripts/check-whatsapp-notification-click.mjs (mock de revisión v10).

## Contrato conservado

type=order-availability-event, orderId, processId, processVersion, tag=order-{orderId}-availability-{processVersion}, url=/?open=requests-customer&orderId={orderId}. Identidad requests-{customer|business}:order-{orderId}-availability-{version}. GET de pedidos y permisos existentes intactos. No endpoints nuevos, POST comerciales, cambios de estado, suscripción/presencia backend, autenticación, flags ni migraciones. Ninguna lectura de endpoints/keys de suscripciones reales.

## Validación

- 1.574 pruebas aprobadas, 123 archivos, conservando la regresión anterior de controlador/activo distintos. Pruebas nuevas de escritura diferida seguida de reinicio del registro de trazas, excepciones tempranas de close/normalización, exclusión de datos privados y correlación de banner/inventario; no equivalen a reiniciar físicamente iOS.
- Once escenarios de navegador con App real y red sintética aprobados: mensaje/URL/caché, dos pedidos, repetición física, sesión/lista tardías y aviso propio desde Inicio/Perfil/catálogo. Sin pushes reales, sin repetir CONFIRM_AVAILABILITY y sin modificar pedidos.
- Build QA/PWA correcto y build local sin instrumentación correcto. Comprobado que este último excluye panel/inventario/chunks de diagnóstico y que un push sintético conserva título y no lleva metadatos QA. No publicación de producción. Advertencia habitual de tamaño de bundle; no se afirma lint/tsc independiente. git diff --check correcto.

## Publicación y prueba física pendiente

Entrega solo en rama qa mediante git push origin qa; commit de implementación es el que incorpora esta ficha. Verificar Ready, SHA y worker v10/artefactos del alias Vercel QA y entregar resultado al usuario. Railway y main sin cambios; main conserva 8295ab8c6024ab20851ebd371308d2f299b4668f. Los ocho diagnósticos locales anteriores no se incluyen en el commit.

El incidente físico sigue abierto. Al actualizar a la entrega v10, tocar un aviso ya disponible si existe, sin repetir la confirmación ni reinstalar. Si conserva la pantalla, entrar manualmente a Solicitudes, abrir Diagnóstico temporal QA (también con cero errores), Recorrido del clic externo QA y Copiar recorrido inmediatamente. Para el siguiente aviso legítimo, conservar el código QA visible del banner junto con esa copia. También puede leerse el inventario mientras el aviso sigue pendiente, entrando por el icono sin tocar ni cerrar el aviso. No generar otro pedido/push como reproducción automática. El código visible y los registros permitirán ubicar presentación/handler/persistencia/entrega/foco; si no hay coincidencia, mantener ese tramo sin causa acreditada.
