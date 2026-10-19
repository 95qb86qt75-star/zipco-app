# QA-PUSH-IOS-05 — Evidencia del clic externo en iPhone

Fecha: 2026-10-19. Rama: `qa`. Clasificación: **solo frontend, diagnóstico del contrato vigente**.
Código: `adc73d6fcf7a310219f42869bbdf1a110d18dd2f` (`adc73d6`).

## Estado: puntos 1 y 4 ABIERTOS

Bastián repitió la prueba: la notificación externa de aceptación dejó ZIPCO en Inicio y apareció «Pedido aceptado» dentro de la app. El recorrido no es estable aunque haya funcionado una vez. Este bloque prepara evidencia; **no declara corregidos los puntos 1 y 4**, ni sustituye la navegación interna que sí funciona.

Al comenzar, el alias QA apuntaba a `dpl_Cysq5DuinvQAEisJa1c4X9irP6G8`, URL propia `https://zipco-26wxo5gb2-zipco-s-projects.vercel.app`, SHA `59ff1cbe279595d11f0b1f8f86a13665f1ec1c54`, rama `qa`, Preview READY. Comando del despliegue: `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`. La revisión fuente era `ios-click-direct-v3`.

Esto comprueba lo publicado. La versión del frontend y del worker **que ejecutó el iPhone durante el fallo sigue sin comprobarse**. La captura no contiene esa evidencia y no puede reconstruirse retrospectivamente el recorrido que no se registró. No se atribuye el fallo todavía a caché, WebKit, backend ni a un worker antiguo.

## Evidencia incorporada y límites

Se conserva el comportamiento funcional de `QA-PUSH-IOS-04`, incluida la navegación interna, espera de sesión/listas/tarjeta, confirmación tras foco, deduplicación semántica, recargas y contadores. No se incrementan tiempos de navegación ni se introduce otra estrategia de apertura. Las únicas operaciones nuevas son lecturas y escrituras locales de diagnóstico y mensajes de consulta al worker.

El worker instrumentado se identifica como **`ios-click-trace-v4`**, una revisión de evidencia, no una declaración de arreglo. Cuando el build QA incluye el módulo temporal, responde además con su SHA y si el trazado está habilitado. El reporte distingue:

- SHA real del frontend.
- Revisión, SHA y bandera de trazado del **worker controlador** de la página.
- Revisión, SHA y bandera del **worker activo de la registración**. Pueden diferir durante una actualización; no se infiere uno a partir del otro.
- Etapas de worker: recepción de push, presentación del sistema, recepción del clic, destino normalizado, solicitud/resultado/error de apertura, ventanas encontradas, mensaje enviado, persistencia del destino, solicitudes de recuperación y confirmación/consumo.
- Etapas de app: inicio, retorno visible, cambio de controlador, lectura de caché, recepción/validación/aceptación del destino, ruta solicitada, montaje/listas de Solicitudes, foco, confirmación y decisión de presentar o suprimir el aviso interno.

Se registra únicamente **hora generada por el dispositivo, etapa predefinida, origen app/worker, SHA y booleanos predefinidos**. No se guardan URLs, claves semánticas del evento, identificadores de pedidos/personas, títulos, cuerpos, teléfonos, contactos, JWT, cabeceras, suscripciones, endpoints push, excepciones completas ni entidades. Las consultas de versión responden únicamente revisiones, SHA y booleanos. El reporte de seis campos de loadOrders conserva su contrato y botón original.

Para sobrevivir a la suspensión/reinicio se usa **caché local independiente**, hasta 50 filas de app y 50 del worker, con memoria de respaldo. Las lecturas/escrituras descartan filas de más de una hora. Las lecturas repetidas de recuperación con iguales booleanos se resumen durante diez segundos para no desplazar las etapas importantes. Los clics repetidos se registran individualmente. No hay envío externo automático ni telemetría de servidor. Copiar requiere pulsar el botón; limpiar afecta solo a este diagnóstico.

Si Cache API falla o queda esperando, el reporte puede devolver la memoria dentro de un plazo diagnóstico limitado y marca almacenamiento no confirmado. Si el worker no responde, lo informa. **Ausencia de una etapa no demuestra por sí sola que no ocurrió**: se debe comprobar primero versión, trazado habilitado, almacenamiento, vigencia y que se aisló una sola prueba.

## Activación exclusiva del Preview QA

El trazado está desactivado por defecto. Requiere simultáneamente modo `qa`, la protección existente que habilita el diagnóstico exclusivamente fuera de producción, `ZIPCO_QA_LOAD_DIAGNOSTICS=1` y **`ZIPCO_QA_NOTIFICATION_TRACE=1`**.

Para esta publicación, override por despliegue:

```text
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=1 npm run build -- --mode qa
```

Vite emite `qa-notification-click-trace.js` únicamente con ese opt-in QA y lo importa antes de `push-sw.js`. El módulo de almacenamiento/panel de la página también queda fuera de builds sin opt-in. Los puntos de consulta comunes del worker son inertes sin el módulo QA: no crean almacenamiento ni recolectan datos.

Se publica exclusivamente desde Git real, SHA exacto de la rama `qa`, proyecto `zipco-app`, equipo `zipco-s-projects`, entorno Preview y alias habitual. No se cambia configuración global, permisos, conexiones, suscripciones, `main`, producción ni Railway QA.

## Cómo obtener evidencia en el iPhone

1. Abrir el acceso QA habitual: `https://zipco-app-git-qa-zipco-s-projects.vercel.app`. Dejar que se complete su actualización normal y entrar a Solicitudes.
2. Expandir **Diagnóstico temporal QA — Solicitudes → Recorrido del clic externo QA** y pulsar **Leer recorrido**. El frontend debe coincidir con el SHA desplegado informado. El controlador y el activo deben mostrar `ios-click-trace-v4`, SHA del mismo build y `traceEnabled: true`. Si difieren, copiar primero ese resultado; no borrar datos, permisos ni suscripciones para disimular la diferencia.
3. Si las versiones coinciden, pulsar **Limpiar recorrido** y comprobar su confirmación. Volver a Inicio y dejar ZIPCO en segundo plano. Aislar una sola notificación nueva de aceptación del flujo normal QA; no repetir START_WORK ni forzar acciones para activar el diagnóstico.
4. Pulsar la notificación del sistema. Si queda en Inicio o aparece el aviso interno, **no pulsar ese aviso**: alteraría la evidencia de la navegación que queremos observar.
5. Entrar por la barra inferior a **Solicitudes**, abrir el panel y pulsar **Copiar recorrido**. Compartir ese JSON saneado. Si no se puede copiar, el texto queda seleccionable. La entrada manual a Solicitudes queda visible como un montaje posterior sin destino.

También se puede recoger un recorrido que funcione para compararlo con uno que falle; limpiar entre pruebas. La prueba física y su evidencia siguen pendientes: el equipo no tiene acceso remoto al worker del iPhone.

## Cómo interpretar el corte sin inventar una causa

| Evidencia | Siguiente comprobación |
|---|---|
| SHA/revisión diferentes o trazado no habilitado | Resolver primero qué versión ejecutó cada contexto. |
| `system-shown` sin `click-received` | Comprobar worker ejecutor, vigencia y disponibilidad del registro antes de inferir que iOS no entregó el clic. |
| `click-received` sin `target-normalized` | Revisar normalización del destino en el handler. No se expone su contenido. |
| `launch-requested` seguido de `launch-failed` | Investigar rechazo de apertura; no se recoge la excepción completa. |
| Destino guardado/mensaje enviado sin recepción ni lectura en app | Revisar comunicación y recuperación del contexto reanudado. |
| `app-target-received` con `hasTarget: false` | Revisar validación del destino recibido con datos booleanos, sin inventar campos del backend. |
| `app-target-accepted` pero sin ruta/montaje de Solicitudes | Revisar estado de pantalla y sesión de la app. |
| Montaje sin tarjeta o con carga/error | Revisar carga/lista y categoría; conservar el destino pendiente. |
| Foco sin confirmación/consumo | Revisar ACK; un ACK viejo no debe eliminar destinos nuevos. |
| `notice-delivered` sin marca de presentación recibida | Revisar el punto anterior donde faltó la identidad/presentación; no silenciar todos los avisos del pedido. |

Estas son pautas de lectura, no causas confirmadas del fallo de Bastián.

## Archivos y validación

Inventario de código:

- `public/push-sw.js`.
- `vite.config.ts` y `src/vite-env.d.ts`.
- `src/app/App.tsx` y `src/app/screens/RequestsScreen.tsx`.
- `src/app/screens/requests/LoadOrdersDiagnosticsPanel.tsx`.
- `src/app/notifications/BusinessNotificationMonitor.tsx` y `notificationDelivery.ts`.
- `src/app/notifications/notificationWorkerVersion.ts` y `.test.ts`.
- `src/app/notifications/notificationLifecycle.test.ts`.
- `src/app/notifications/notificationClickTrace.ts`.
- `src/app/notifications/QaNotificationClickTracePanel.tsx`.
- `src/app/notifications/qaNotificationClickTrace.ts` y `.test.ts`.
- `src/app/notifications/qaNotificationClickTraceStore.js` y `.test.ts`.

**905 pruebas aprobadas en 84 archivos**. Casos nuevos: saneamiento, límites, reinicio de worker, limpieza independiente, fallos y espera de Cache API, resumen de lecturas repetidas sin eliminar clics, builds controlador/activo diferentes y checkpoints de worker sin payloads. Las pruebas anteriores conservan navegación interna/externa, sesión/listas tardías, clic repetido, aceptación, READY, avisos posteriores y contadores.

Build QA con opt-in aprobado y módulo clásico del worker ejecutado en entorno de prueba. Build QA sin la bandera comprobado: módulo, almacenamiento y panel de recorrido ausentes. Build de producción comprobado localmente incluso solicitando ambas banderas: módulo QA, import del worker, panel y almacenamiento de trazado ausentes. No se publicó producción. Se conserva la advertencia existente de tamaño del bundle.

El contrato backend sigue usando los campos existentes de push (`type`, `tag`, `url`, `orderId`/`quoteId`) y las mismas lecturas de listas. No se cambian endpoints, payloads, estados ni permisos. Railway QA no requiere modificación para esta evidencia. Los documentos pendientes anteriores se conservan fuera del commit.

## Retirada futura

Después de identificar la causa y validar una corrección estable en iPhone, proponer un nuevo commit que retire este trazado y sus mensajes QA, elimine el asset/import y quite `ZIPCO_QA_NOTIFICATION_TRACE=1` del override exclusivo del nuevo Preview QA. La caché diagnóstica puede limpiarse mediante su botón antes de retirar la herramienta. No borrar suscripciones, cachés funcionales ni avances; no hacer rollback de diseños. Mantener el registro documental y decidir por separado la retirada del diagnóstico anterior de loadOrders.

Hasta entonces, puntos 1 y 4 pendientes; arquitectura nueva de notificaciones pausada.
