# QA-PUSH-IOS-04 — Clic externo de aceptación en iPhone

Fecha: 2026-10-19. Clasificación: **solo frontend sobre contrato existente**. Rama `qa`.
Código: `c4ea554b8aa779fd5045e96f1b62155b72a158ed` (`c4ea554`).

## Reporte y versión inicial

Bastián informó que, con ZIPCO en segundo plano en iPhone, pulsar la notificación de aceptación abría la pestaña anterior y repetía un aviso interno. El aviso interno sí llevaba al pedido correcto. Esa navegación interna se conserva.

El alias habitual QA apuntaba a `dpl_AUFRBLCYqLebT4ES2DuBKrX5Mv7h`, READY, SHA `4981d898886c8b72c2ec8c6f081f390be8e7d90b`, rama `qa`, entorno Preview. Su worker fuente tenía la revisión `contact-authorized-open-v2`. Esto comprueba lo publicado, **no permite afirmar qué worker estaba ejecutando el iPhone**.

## Causa comprobada y límite de evidencia

Dos pruebas nuevas fallaron sobre el código anterior:

1. `notificationclick` esperaba la persistencia del evento y del destino antes de invocar `clients.openWindow` en Apple. Por tanto, el lanzamiento dependía de operaciones asíncronas de disco y podía llegar después de la activación del clic. La prueba verifica directamente que la invocación no ocurría durante el manejador del clic; no simula todas las restricciones reales de WebKit.
2. Si `openWindow` devolvía un cliente, la rama Apple enviaba el destino solo a ese cliente y retornaba antes del envío a las ventanas existentes. La ventana suspendida que el sistema podía mostrar quedaba sin destino ni marca de presentación por mensaje. La prueba reproduce esa rama y confirma cero mensajes a la ventana existente.

Son fallos comprobados del recorrido externo compatibles con lo observado. La pérdida concreta de activación o la ventana elegida en el iPhone de Bastián no se pueden confirmar remotamente. Se requiere comprobar la revisión activa y repetir la prueba física después de publicar; no se declara resuelto el dispositivo solo por pasar las pruebas.

Referencias primarias: [Clients.openWindow y activación](https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow), [WebKit: ventana inicial temporalmente inerte](https://bugs.webkit.org/show_bug.cgi?id=252544).

## Cambio mínimo aplicado

- En iPhone se invoca la apertura del enlace existente directamente durante `notificationclick`, antes de esperar caché. Se conserva el pathname específico y los parámetros ya usados, incluida la identidad del evento.
- La persistencia del destino y de la presentación continúa dentro de `waitUntil`, en paralelo al lanzamiento y comunicación; un error o demora en Cache API deja disponibles URL y mensajes.
- Todas las ventanas del mismo origen reciben la marca del evento ya presentado y el destino explícito, incluso si `openWindow` devuelve otro cliente. La app utiliza su navegación existente y su filtro de avisos por evento.
- Se conserva la cola de escrituras: una confirmación no elimina un destino nuevo ni se adelanta a su persistencia. El destino solo se consume después de enfocar la tarjeta, con sesión y listas disponibles.
- No se aumentaron temporizadores. Se mantienen reintentos existentes, navegación interna, actualización de listas/contadores y avisos futuros diferentes del mismo pedido.
- Revisión nueva del worker: **`ios-click-direct-v3`**. Responde por MessageChannel a una consulta de versión del worker controlador. La respuesta contiene solo la revisión; no suscripciones, payloads, cuerpos, credenciales ni datos de pedidos.
- El panel temporal QA muestra el SHA real del build y permite **Comprobar versión del worker**. Esta consulta no registra suscripciones ni ejecuta acciones, peticiones de pedidos o actualizaciones del worker. No añade campos al reporte de seis campos de loadOrders. Un worker viejo sin respuesta se informa como no comprobado; no se confunde con la versión publicada.

## Contrato conservado

Backend consultado solo en lectura: `src/notifications/push-notifications.service.ts` y `push-acceptance-2a.spec.ts`. La aceptación ya entrega `type: order-accepted`, `tag: order-:id-accepted`, `orderId` y `url: /?open=requests-customer&orderId=:id`. El cuerpo/título se presentan normalmente como notificación del sistema; no se usan para inferir la navegación ni la identidad.

No se agregan campos, endpoints ni reglas de backend. Los mensajes entre worker y app siguen usando el destino explícito y la confirmación existente; la única consulta nueva es local de revisión del worker. Las lecturas normales de pedidos/cotizaciones se conservan. No se ejecutaron acciones de pedidos ni START_WORK.

La arquitectura nueva de notificaciones continúa pausada. No se implementa el objetivo pendiente de seleccionar canales solo por visibilidad o presencia guardada. En Apple, un push recibido continúa mostrándose visiblemente; no se propone ocultarlo como solución.

## Archivos y comprobaciones

- `public/push-sw.js`: lanzamiento, comunicación a ventanas existentes y revisión consultable.
- `src/app/notifications/notificationLifecycle.test.ts`: seis regresiones nuevas además de los casos anteriores.
- `src/app/notifications/notificationWorkerVersion.ts` y `.test.ts`: consulta saneada y tres pruebas.
- `src/app/screens/requests/LoadOrdersDiagnosticsPanel.tsx`: versión frontend y consulta manual QA.
- Este documento: reporte, evidencia, alcance y prueba móvil.

**896 pruebas aprobadas en 82 archivos**. Cubren clic repetido, inicio cerrado, aceptación y READY, sesión/listas tardías, confirmación después del foco, caché lenta o fallida, varias ventanas y avisos posteriores distintos. Build QA aprobado. Build de producción comprobado localmente con exclusión del panel y sus nuevos textos, incluso con la bandera temporal solicitada; no se publicó producción. Se conserva la advertencia existente de tamaño del bundle.

Publicación prevista exclusivamente desde Git real de `qa`, SHA exacto del commit documental que contiene este código. Mantener `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa` como override del despliegue, Backend QA y alias habitual. Sin configuración global, `main`, producción ni Railway QA. Los documentos locales anteriores permanecen fuera de estos commits.

## Comprobación desde el iPhone

1. Abrir el acceso QA habitual `https://zipco-app-git-qa-zipco-s-projects.vercel.app`, dejar que se actualice y entrar a Solicitudes.
2. Expandir **Diagnóstico temporal QA — Solicitudes**. Verificar que **Versión frontend** coincide con el SHA desplegado informado al terminar la publicación. Pulsar **Comprobar versión del worker**; debe responder **ios-click-direct-v3**. Si aparece sin respuesta, no asumir actualizado ni borrar permisos/suscripciones: volver a abrir tras la actualización normal y volver a comprobar.
3. Con esa versión confirmada, dejar ZIPCO en segundo plano en otra pestaña. Al recibir una notificación nueva de aceptación del flujo QA, pulsar la del sistema: debe abrir directamente el pedido en Coordinación, enfocado y sin repetir el aviso interno de aceptación. No hace falta repetir START_WORK ni forzar acciones para comprobar versiones.
4. Comprobar que la navegación de un aviso interno recibido mientras se usa la app conserva su comportamiento y que un aviso posterior distinto, como READY, no queda silenciado. El objetivo completo de canal único con app visible permanece fuera de esta fase.
5. Si falla, informar solamente SHA frontend, revisión del worker, tipo de evento y si quedó la pestaña anterior o apareció el aviso; sin datos de contacto, claves, cuerpos ni información personal.

La comprobación física y la aprobación de Bastián quedan pendientes.
