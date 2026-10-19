# QA-PUSH-NAV-01 — Avisos duplicados y navegación desde notificaciones

Nota 2026-10-19: este es el diagnóstico histórico del SHA indicado abajo.
La implementación posterior está en [frontend-push-navigation-fix-qa.md](frontend-push-navigation-fix-qa.md)
y las fichas posteriores del [cierre QA-DOC-CLOSURE-01](frontend-qa-documentation-closure.md).
Las expresiones «sin implementar» y «local» siguientes describen aquella etapa;
este cierre respalda el informe sin borrar sus conclusiones originales.

## Registro y alcance

- Fecha del registro: 2026-10-18.
- Nombre estable: diagnóstico de presentación de notificaciones y navegación al pedido.
- Clasificación del registro: documentación frontend QA. La corrección inicial
  propuesta es frontend; el objetivo completo de entrega requiere coordinación
  frontend + backend.
- Carpeta revisada: `C:\dev\zipco-app-qa`.
- Rama: `qa`.
- SHA del código revisado: `8835e7b5786abfe8f3780aea2d66d76014f8a0dd`.
- Estado: diagnóstico terminado; propuesta sin implementar. Causa del recorrido
  concreto en el celular todavía pendiente de traza.
- Bastián confirmó que ya compartió la información con Backend QA. Esto no
  constituye respuesta de backend, contrato acordado ni autorización de implementación.
- Este registro está guardado localmente, sin commit propio ni publicación.

Usar este documento como referencia consultable para este bloque, sin depender
del historial del chat. Añadir nuevos resultados con su fecha, evidencia y SHA,
conservando los hallazgos anteriores y distinguiendo propuestas de cambios realizados.

## Comportamiento informado y objetivo

Observado por Bastián:

1. En segundo plano llega la notificación del celular.
2. Al pulsarla, abre ZIPCO y reaparece el aviso superior interno.
3. La aceptación enfoca el pedido correcto.
4. «Pedido listo» abre la app, pero no enfoca el pedido correspondiente.

Objetivo solicitado:

- App visible: únicamente aviso interno.
- Segundo plano: notificación del sistema.
- Al abrir la notificación: no repetir el aviso interno y enfocar el pedido correcto.

Backend ya comprobó, según la información aportada por Bastián, que entrega el
push aunque la presencia guardada indique app abierta. No bloquear la entrega
únicamente por ese dato: puede estar desactualizado.

## Contrato actual observado en código

El servicio backend `src/notifications/push-notifications.service.ts` construye
para aceptación y pedido listo un payload con `type`, `title`, `body`, `tag`,
`orderId` y `url`. La variante de coordinación también incluye
`requestProcessId`. No se guardaron valores reales ni cuerpos de respuestas.

- Aceptación: tipo `order-accepted`, etiqueta por pedido y aceptación.
- Pedido listo del proceso nuevo: tipo `order-ready`, etiqueta por pedido y
  coordinación lista.
- Ambas rutas dirigen a Solicitudes con la vista destinataria y el pedido.
- No se identificó un identificador único de evento o versión de proceso en
  esos payloads de push. La etiqueta distingue los tipos de aviso revisados;
  su suficiencia como identidad estable debe comprobarse antes de implementar.

El service worker conserva en `notification.data` solamente `url`, `orderId`
y `quoteId`; al comunicar navegación transmite tipo de mensaje y URL. No
transmite una identidad de presentación compartida con el monitor.

La presencia se actualiza mediante `/push/presence` con `isForeground`.
El monitor consulta pedidos y cotizaciones de cliente y negocio:

- `GET /orders/my-orders`.
- `GET /orders/business/:businessId`.
- `GET /quotes/my-quotes`.
- `GET /quotes/business/:businessId`.

Son referencias al código y plantillas de rutas, no una captura de tráfico
del celular. No se ejecutaron acciones de pedidos ni se obtuvieron respuestas
reales para este diagnóstico.

## Hallazgos confirmados en frontend

### Presentación duplicada

`public/push-sw.js` muestra la notificación del sistema si no encuentra una
ventana visible y enfocada. Si la encuentra, envía el payload a la app y
retorna sin mostrar notificación.

Al volver a primer plano, `BusinessNotificationMonitor.tsx` actualiza los
pedidos y compara estados con su referencia anterior. Puede emitir el aviso
interno por la misma transición que ya presentó el sistema.

No existe un registro compartido entre service worker y app que indique que
ese evento ya fue presentado o que se abrió desde una notificación del sistema.
La deduplicación interna utiliza conjuntos en memoria y una clave de pedido
más estado. El componente Toast evita ciertos duplicados mientras el aviso
está vigente, pero no conoce la presentación del sistema.

El monitor conserva una referencia de estados en
`zipco-request-status-snapshot-v1`; esa referencia no es un registro de avisos
del sistema y su clave no está separada por usuario.

### Navegación: aceptación frente a READY

`customerOrderNotice` contempla `COORDINATION_PENDING` cuando existe el proceso
nuevo, pero devuelve `null` para `READY`. El monitor vincula su recuperación
alternativa de navegación a la emisión de un aviso interno. Por eso recupera
la aceptación y no recupera READY por ese mecanismo.

Esto no significa que el enlace directo de READY sea incorrecto: el código
backend revisado incluye el destino, y Solicitudes contempla la categoría
Listos y el identificador DOM de la tarjeta.

Hay además dos problemas generales en la atención del enlace:

1. `App.tsx` envía `ZIPCO_NOTIFICATION_NAVIGATED` antes de comprobar que la
   sesión, las listas y la tarjeta estén listas. El service worker puede
   eliminar entonces el destino pendiente de su caché.
2. `RequestsScreen.tsx` busca el pedido cuando llegan las listas, cambia la
   categoría y usa un temporizador de 150 ms para localizar la tarjeta.
   Elimina los parámetros de navegación incluso si no encontró el elemento.
   No confirma el renderizado antes de consumir el destino.

La navegación aplica desplazamiento y resaltado si encuentra el elemento;
no ejecuta un enfoque DOM explícito. Las repeticiones de mensajes pueden
reiniciar la pantalla sin una identidad de navegación que las haga idempotentes.

### Comunicación, recargas y ciclo de vida

- El service worker guarda un destino temporal en memoria y caché, con
  vencimiento de cinco minutos, y reenvía mensajes tras abrir o enfocar la app.
- La app recupera ese destino al iniciar y al recibir eventos de regreso,
  incluidos visibilidad, foco y `pageshow`.
- El monitor consulta cada 15 segundos y reporta presencia cada 5 segundos.
- El regreso a primer plano dispara una consulta del monitor con recuperación
  de navegación; el inicio con una referencia guardada también puede hacerlo.
- Los mensajes del service worker disparan consultas del monitor sin filtrar
  primero los tipos de mensaje.
- La cola serializa y combina disparadores dentro del monitor. No coordina
  todas las lecturas de Solicitudes.
- Solicitudes recarga por visibilidad y `pageshow`, y también cuando el monitor
  emite `zipco-requests-refresh`.
- El mecanismo de actualización del service worker puede recargar la app al
  cambiar de controlador; no se comprobó que ocurriera en el incidente.

Hay lecturas repetidas confirmadas en código. No hay evidencia suficiente para
atribuirles el fallo concreto del celular. La navegación por el primer cambio
detectado al regresar también podría competir con el pedido pulsado: es un
riesgo del diseño actual, no una reproducción confirmada de este incidente.

## Límites de la conclusión

Confirmado: faltan coordinación entre presentaciones, recuperación READY y
confirmación de navegación después del renderizado.

Pendiente: determinar si en el celular se perdió el enlace original, se
consumió antes de renderizar o intervino otro recorrido. No se verificó el
SHA activo ni la versión efectiva del service worker en cada dispositivo.
El SHA arriba identifica el código local revisado.

## Propuesta mínima, todavía no implementada

Para la corrección frontend inicial:

1. Compartir una identidad mínima del evento y su presentación entre service
   worker y app; registrar la presentación del sistema después de que tenga
   éxito. Suprimir únicamente el aviso interno del mismo evento, manteniendo
   las actualizaciones de listas y contadores.
2. Mantener el destino explícito del pedido separado de la generación del
   texto del aviso. Contemplar READY y evitar navegar por un cambio ajeno al
   pedido pulsado.
3. Esperar sesión, datos y tarjeta renderizada antes de confirmar la atención
   del destino. No consumirlo mediante un temporizador fijo cuando no exista
   el elemento.
4. Hacer idempotentes los mensajes de navegación y distinguir mensajes de
   actualización, presentación y apertura.
5. Revisar la coordinación de recargas sin atribuirles una causa no demostrada.

No silenciar todos los avisos de un pedido ni usar un intervalo de silencio
que oculte transiciones posteriores. No inventar campos de API. Si hace falta
un identificador de evento o versión nuevo, acordarlo primero con backend.

## Coordinación necesaria para el objetivo completo en iPhone

La suscripción actual usa `userVisibleOnly: true`. WebKit exige notificación
visible al recibir Web Push. La rama actual que recibe el push y solo envía
un mensaje a una ventana enfocada no es una solución general válida para iPhone.
Tampoco se propone mostrar y cerrar inmediatamente la notificación como evasión.

Referencia oficial: [WebKit — Meet Declarative Web Push](https://webkit.org/blog/16535/).

Si el push ya fue enviado, frontend no puede garantizar en iPhone el objetivo
de «solo aviso interno» suprimiendo su presentación visible. Para el objetivo
completo se propuso acordar con backend una entrega con confirmación activa
por evento/dispositivo y alternativa mediante push cuando falte confirmación.
La presencia guardada puede ser una señal, nunca la única prueba para omitirlo.

Ese mecanismo es una propuesta: no existe contrato nuevo aprobado en este
registro, ni garantía de ausencia absoluta de carreras entre canales. Backend
debe evaluar identidad de evento, entrega, confirmaciones y compatibilidad
antes de implementar cambios de servidor.

## Archivos involucrados

| Archivo | Responsabilidad revisada |
| --- | --- |
| `public/push-sw.js` | Push, notificación del sistema, clic, caché y mensajes de destino. |
| `src/app/App.tsx` | Recepción del destino, recuperación al regresar y confirmación al worker. |
| `src/app/notifications/BusinessNotificationMonitor.tsx` | Consultas, presencia, comparación de estados y avisos. |
| `src/app/notifications/orderNotice.ts` | Texto por estado y deduplicación interna del cliente. |
| `src/app/notifications/notificationRefreshQueue.ts` | Combinación y serialización de disparadores del monitor. |
| `src/app/screens/Toast.tsx` | Presentación y deduplicación temporal del aviso interno. |
| `src/app/notifications/pushNotifications.ts` | Suscripción y actualización de presencia. |
| `src/app/screens/RequestsScreen.tsx` | Categoría, localización y resaltado del pedido. |
| `src/app/screens/requests/useRequests.ts` | Carga de listas y recargas al regresar. |
| `src/main.tsx` y `vite.config.ts` | Registro, actualización e importación del worker de push. |
| Backend: `src/notifications/push-notifications.service.ts` | Referencia de payloads, rutas y envío; solo lectura. |

## Verificaciones y estado de entrega

Pruebas ejecutadas sobre el código revisado:

```text
npm test -- src/app/notifications/orderNotice.test.ts src/app/notifications/notificationRefreshQueue.test.ts src/app/notifications/BusinessNotificationMonitorFlow.test.ts
Resultado: 3 archivos aprobados; 19 pruebas aprobadas.
```

Estas pruebas no cubren el recorrido completo de notificación del sistema,
clic, espera de sesión y tarjeta renderizada. No acreditan una corrección.

- Diagnóstico: sin cambios de código, configuración, permisos o datos.
- Acciones de pedidos: ninguna; no se repitió START_WORK.
- Este trabajo documental: crea este informe y añade una referencia al
  documento de traspaso existente; conserva el resto del historial.
- Build: no ejecutado para este bloque de documentación.
- Commit nuevo: ninguno. Rama: `qa`.
- Vercel QA: sin publicación ni cambios en este bloque.
- Railway QA: sin despliegue ni modificaciones; coordinación pendiente.
- `main` y producción: sin modificaciones.
- Pendientes: respuesta de backend, contrato si corresponde, autorización de
  implementación, pruebas del recorrido completo y comprobación en celulares.
