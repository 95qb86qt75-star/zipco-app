# QA-PUSH-OPEN-03 — No volver a anunciar pedidos pendientes antiguos

Fecha: 2026-10-18, America/Santiago. Clasificación: solo frontend QA.

## Identificación

- Nombre estable: referencia de estados de negocio al abrir notificaciones.
- Código: `e5417db7b8fe7dbf072ca7348bc2051e16a3f962`.
- Rama: `qa`.
- Punto de partida: `644b70758a1758f850a3bf7d82a75dca820996a5`.
- Estado inicial de este registro: corrección implementada y validada;
  publicación y comprobación móvil posterior pendientes de registrar.
- Arquitectura nueva de notificaciones: continúa **pausada**.

## Evidencia que cambió el diagnóstico

Bastián entregó una captura Android del aviso interno **«Nuevo pedido recibido»**.
La descripción del aviso corresponde a un solicitante distinto del mostrado
en la tarjeta enfocada con «Abierta desde la notificación». No se transcriben
nombres, contactos ni datos personales de la imagen.

Esto permitió identificar el emisor en `BusinessNotificationMonitor.tsx` y
reproducir el fallo con el monitor real y datos sintéticos. La nueva regresión
falló antes de corregir el código: al abrir el pedido sintético 92 desde su
notificación, el monitor emitía `order-91-created` para otro pendiente antiguo.
Tras la corrección, esa misma prueba pasa y conserva el contador de dos pedidos.

El filtro del consentimiento implementado en QA-PUSH-OPEN-02 reconocía el
evento abierto, pero no impedía este aviso de otro pedido mal considerado nuevo.
Las pruebas anteriores no incluían varios pendientes de negocio al arrancar
con una referencia guardada exclusivamente de cliente.

## Causa comprobada en código y prueba

La referencia persistida `zipco-request-status-snapshot-v1` guardaba solo los
estados de pedidos y cotizaciones del cliente. Al recuperarla, activaba una
bandera global de referencia disponible. Las referencias en memoria de negocio
seguían vacías después de reiniciar o remontar el monitor.

Al leer los pendientes de negocio, el monitor encontraba que sus identificadores
no estaban en ese mapa vacío y los anunciaba como nuevos. El último aviso podía
corresponder a otro pedido anterior, aunque la navegación hubiera enfocado
correctamente el pedido de la notificación pulsada.

No se atribuye este fallo a un worker antiguo: se reproduce con el código
revisado incluso cuando el evento abierto está identificado y filtrado.

## Corrección mínima

1. Separar la disponibilidad de la referencia de negocio de la del cliente.
2. Conservar también los pares de identificador/estado de negocio en la misma
   caché técnica local existente, vinculados al negocio activo. Se incluyen
   pedidos y cotizaciones porque ambos usaban el mismo arranque incorrecto.
3. Si la caché es anterior, falta, pertenece a otro negocio o sus pares son
   inválidos, la primera lectura válida establece la referencia sin anunciar
   todos los pendientes ya existentes como si acabaran de llegar.
4. Restaurar esa referencia al volver a montar el monitor. Los identificadores
   nuevos respecto de una referencia válida siguen generando su aviso normal.
5. Conservar una pista explícita `new-order` recibida durante la primera lectura,
   para avisar únicamente de ese pedido nuevo, sin anunciar los demás. Estas
   pistas son temporales, limitadas a 100 y se consumen al aparecer en la lista.
   Un evento de consentimiento no cuenta como pista de pedido nuevo.
6. No convertir una respuesta de lista con estructura inválida en una referencia
   vacía: esperar una lectura válida antes de establecerla.

Se mantienen consultas, intervalos, navegación, filtro por evento presentado,
marcas y actualización de contadores. No se silencian todos los avisos de un
pedido ni los pedidos nuevos posteriores. No cambia la política de presentación
de Web Push ni el worker de push en este commit.

## Archivos y contrato

- `src/app/notifications/BusinessNotificationMonitor.tsx`.
- `src/app/notifications/BusinessNotificationMonitorFlow.test.ts`.

La ampliación `business` es exclusivamente representación interna de la caché
de estados del navegador. Guarda identificadores y estados ya recibidos por
API, no nuevas entidades o datos autoritativos del servidor. No se agregan
campos a payloads ni endpoints, permisos, acciones o transiciones backend.

Se mantienen las lecturas existentes `GET /orders/business/:businessId`,
`GET /orders/my-orders`, `GET /quotes/business/:businessId`, `GET /quotes/my-quotes`
y la presencia existente `/push/presence`. No se ejecutaron acciones de pedidos
ni START_WORK. Railway QA no requiere cambios.

## Validación

- Regresión reproducida primero contra el código anterior: falló anunciando un
  pendiente antiguo distinto del pedido abierto. Pasó después de la corrección.
- Pendientes antiguos al arrancar con caché anterior: sin aviso falso.
- Pedido genuinamente nuevo posterior: aviso una vez y contador actualizado.
- Push `new-order` durante primera lectura: solo avisa del pedido indicado.
- Push de consentimiento durante primera lectura: no convierte pendientes en nuevos.
- Reinicio del monitor: restaura la referencia sin repetir pendientes.
- Nuevo pedido entre reinicios: anuncia el nuevo, conserva los anteriores.
- Abrir un pedido ya presentado por el sistema: no repite ese ni los antiguos;
  después permite otro pedido nuevo.
- Caché de otro negocio o inválida: inicializa con seguridad.
- Respuesta de lista inválida: espera lectura válida, sin falsas novedades.
- Suite completa: **887 pruebas aprobadas en 81 archivos**.
- Build QA con diagnóstico temporal anterior habilitado: aprobado.
- `git diff --cached --check`: aprobado.
- Advertencia habitual de bundle superior a 500 kB; build completado.

Los datos de las pruebas son sintéticos. La comprobación física de Bastián
después de publicar sigue pendiente y no se sustituye por el resultado automatizado.

## Publicación y comprobación en Android

Publicar únicamente Preview QA desde Git real y SHA exacto, conservando el
diagnóstico temporal anterior mediante override de ese despliegue. No modificar
configuración global, protección, backend, `main` ni producción.

Después de actualizar el acceso QA habitual:

1. Abrir una notificación del sistema con varios pedidos antiguos pendientes.
2. Comprobar que se enfoca el pedido correcto sin un aviso «Nuevo pedido recibido»
   correspondiente a esos pendientes antiguos.
3. Volver a abrir Solicitudes y comprobar que no se vuelven a anunciar.
4. Recibir un pedido realmente nuevo mediante el flujo QA autorizado y comprobar
   su aviso normal y actualización del contador.

Los documentos locales pendientes anteriores se conservan fuera de estos commits.
Los resultados del despliegue se añadirán después de verificarlos.

## Publicación comprobada — 2026-10-18

- Commit fuente: `cf2fbd24546aaa05c9539e9f1813a06c888c534f`, que incluye código
  `e5417db7b8fe7dbf072ca7348bc2051e16a3f962` e informe.
- Preview `dpl_4TnJem9NJjyVqqHexzUHEyd6okKd`: **READY**.
- URL propia: <https://zipco-cor0o1mfe-zipco-s-projects.vercel.app>.
- Alias habitual comprobado apuntando a ese despliegue:
  <https://zipco-app-git-qa-zipco-s-projects.vercel.app>.
- Origen GitHub, rama qa, SHA exacto y entorno Preview verificados.
- Logs: modo QA, build y despliegue completados.
- Diagnóstico temporal conservado por override exclusivo del despliegue:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
- Configuración pública Backend QA comprobada sin modificarla. Build global,
  protección y rama de producción intactos; sin cambios de backend ni Railway QA.
- Los dieciséis documentos pendientes anteriores conservaron sus hashes y no
  entraron en estos dos commits. Staging vacío y HEAD igual a origin/qa.
- Worker de push sin cambios en este bloque; el build incorpora el monitor
  corregido. No se afirma haber inspeccionado el controlador activo del Android.
- Confirmación física de Bastián después de actualizar: **pendiente**.
- Arquitectura nueva pausada; acciones de pedidos, `main` y producción sin cambios.
- Este añadido posterior al despliegue queda local hasta un futuro commit
  documental. No se realizó otro push que reemplazara el Preview verificado.
