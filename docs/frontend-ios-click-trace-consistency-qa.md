# QA-PUSH-IOS-06 — Comparación de recorridos y consistencia del diagnóstico

Fecha: 2026-10-19. Clasificación: **solo frontend QA, diagnóstico**. Rama `qa`.
Código: `99eabfe77b16f937b9e1de7b73d17cf6f72d2746` (`99eabfe`).

## Estado del problema funcional

Los puntos **1 y 4 siguen abiertos**. La arquitectura nueva de notificaciones permanece pausada. Este bloque no cambia el recorrido externo ni interno, deduplicación funcional, estados, acciones, recargas, contadores, permisos ni suscripciones. Corrige únicamente una pérdida reproducible de evidencia del diagnóstico.

## Casos aportados por Bastián

Ambos reportes identifican frontend `228bcf39cb86a05590bc70eee8437e3c8a63a783`, controlador y activo `ios-click-trace-v4` del mismo SHA, trazado habilitado y almacenamiento disponible.

### CASE-IOS-COLD-01 — app completamente cerrada: éxito confirmado

La secuencia aportada muestra:

1. `push-received` y `system-shown` con identidad disponible.
2. `click-received`, `target-normalized`, `launch-requested`, destino e identidad presentes.
3. `windows-found` con `hasClient: false`: no había una ventana existente en ese momento.
4. `target-saved`, arranque de app con destino y sesión, montaje de Solicitudes y recepción de mensajes/cache.
5. Espera de listas; después, `screen-target` disponible, `card-focused` y `app-target-ack`.
6. `notice-suppressed` y `ack-consumed`.

Del clic (`1792391469979`) al foco (`1792391471736`) transcurrieron aproximadamente **1,8 segundos**. Esto confirma ese intento exitoso, no la estabilidad con app suspendida.

`app-target-ignored` con destino pendiente no prueba pérdida: la navegación existente ignora entregas repetidas del destino que ya está pendiente. En este caso el foco posterior confirma que continuó.

Después de consumir aparece `ack-mismatch`: App confirma tanto al controlador como al activo, que pueden ser el mismo worker. El primer ACK consume; el segundo encuentra el registro ya retirado y el guard lo ignora. En esta secuencia no demuestra otro fallo ni un error HTTP.

### CASE-IOS-WARM-01 — app suspendida en catálogo: fallo observado

Bastián pulsó la notificación externa y permaneció en el catálogo. El reporte correspondiente registra retorno visible, sesión disponible y versiones coincidentes, pero las lecturas responden `hasTarget: false`; no aparecen `push-received`, `click-received` ni recepción de destino en la app consultada. El montaje posterior de Solicitudes no tiene destino.

No se puede concluir que iOS no despachó el clic: el reporte identifica el worker consultado después, no acredita por sí solo que sea la misma instancia o contexto que procesó la notificación.

## Defecto confirmado del instrumento anterior

Los historiales aportados difieren también en etapas antiguas: por ejemplo, el reporte exitoso contiene recepción/presentación en `1792391178894`/`1792391178918`, dentro del intervalo del fallido, que no estaban en el historial de worker que devolvió aquel reporte. No se consideran capturas idénticas de una única historia solo porque tengan el mismo SHA. Una limpieza, distintos contextos o pérdida del registro deben distinguirse antes de atribuir ausencias al sistema.

La revisión de código confirmó que v1 guardaba una lista completa por actor con lectura-modificación-escritura. La cola protegía una sola instancia JavaScript, sin coordinar instancias independientes. Se ejecutó una reproducción local de solo lectura sobre el código anterior con dos almacenes compartiendo caché: se escribieron dos etapas concurrentes y el reporte persistido conservó **una**. Esto confirma un defecto del diagnóstico, **no su ocurrencia concreta ni la causa del fallo de navegación en el iPhone**.

## Corrección mínima del registro

- Cada etapa se escribe en una clave independiente. Se evita sobrescribir una lista completa leída antes de la escritura de otra instancia.
- La lectura reúne las etapas de todas las instancias del mismo actor y conserva las 50 más recientes y vigentes. Se mantiene el límite de una hora, saneamiento, memoria de respaldo y ausencia de envío externo automático.
- Las claves internas usan un nonce aleatorio local y un contador de almacenamiento. Nunca se exportan; no identifican usuarios, pedidos, contactos o suscripciones.
- El reporte agrega únicamente el booleano **`currentContext`**: indica si esa fila la produjo la instancia del almacén que responde. `false` puede corresponder a una vida anterior del worker; **no demuestra otra instalación, otro usuario o un origen diferente**.
- Se usa caché diagnóstica `zipco-qa-click-trace-v2` para no mezclar formatos. La caché v1 anterior no se borra ni se reescribe; los reportes ya aportados permanecen como evidencia. El botón actual limpia exclusivamente el registro v2, sin tocar cachés funcionales.
- Worker nuevo: **`ios-click-trace-v5`**. No representa una corrección funcional de navegación.

## Archivos, contrato y validación

Código modificado:

- `src/app/notifications/qaNotificationClickTraceStore.js` y `.test.ts`.
- `src/app/notifications/qaNotificationClickTrace.ts`: revisión esperada.
- `public/push-sw.js`: revisión declarada, sin cambio del recorrido.
- `src/app/notifications/notificationLifecycle.test.ts`: comprobación de revisión.

**907 pruebas aprobadas en 84 archivos**. Las regresiones nuevas comprueban que dos instancias concurrentes preservan ambas etapas en una lectura nueva, que el reporte distingue contextos sin exponer sus claves, y que la unión de memoria/caché no recupera filas caducadas. Se mantienen las pruebas anteriores de límites, saneamiento, fallos, navegación y contadores.

Build QA aprobado. Comprobación local de producción: colector, import QA y panel de recorrido excluidos incluso solicitando las banderas. Sin publicación de producción; advertencia existente de tamaño de bundle.

No se agregan campos ni endpoints backend. No se ejecutaron acciones de pedidos, START_WORK ni cambios de datos. Railway QA no fue necesario. Los documentos locales pendientes anteriores permanecen fuera de estos commits.

## Publicación y siguiente evidencia

Publicar exclusivamente Preview QA desde Git real y SHA exacto, conservando el override por despliegue:

```text
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=1 npm run build -- --mode qa
```

Equipo `zipco-s-projects`, proyecto `zipco-app`, rama `qa`, alias habitual `https://zipco-app-git-qa-zipco-s-projects.vercel.app`. No cambiar ajustes globales, `main`, producción, conexiones o backend.

Para una siguiente prueba, usar el mismo acceso instalado de QA en iPhone cliente; comprobar el SHA desplegado, controlador/activo `ios-click-trace-v5` y ambas banderas de trazado verdaderas. Limpiar el registro v2 y aislar un clic de aceptación con la app suspendida. Si falla, no pulsar el aviso interno: ir manualmente a Solicitudes y copiar el recorrido. No hace falta repetir otra vez el caso cerrado que ya tiene una secuencia exitosa, ni forzar START_WORK.

Hasta recoger esa evidencia no se atribuye el fallo a sesiones, listas, iOS, origen de la suscripción ni backend. No silenciar avisos globalmente ni inferir el destino desde el primer pedido que cambió de estado.
