# QA-PUSH-NAV-01 — Corrección inicial de avisos y navegación

Fecha: 2026-10-18, America/Santiago. Clasificación: frontend QA sobre el
contrato existente. Esta fase fue autorizada para implementar, validar y
publicar en Frontend QA. No modifica backend, permisos ni acciones de pedidos.

## Identificación para consultas posteriores

- Nombre estable: presentación única al abrir notificación y enfoque del pedido.
- Commit de código: `d49fcab8647b87571a10dc17617ae121df0e9100`.
- Rama: `qa`.
- Diagnóstico de partida: código `8835e7b5786abfe8f3780aea2d66d76014f8a0dd`.
- Estado de este registro inicial: implementado y validado localmente;
  publicación y comprobación física pendientes de registrar.
- Bastián informó que compartió el diagnóstico con Backend QA. No se interpreta
  ese envío como aprobación de un contrato adicional.

El informe local `frontend-push-navigation-diagnosis-qa.md` conserva el
diagnóstico original. Este documento registra la implementación posterior,
sin reescribir ese diagnóstico ni incorporar los documentos pendientes de
otros bloques en el commit de esta corrección.

## Problema y resultado implementado

Antes, el service worker podía mostrar una notificación del sistema y el
monitor emitir después otro aviso interno al detectar la misma transición.
La recuperación de navegación dependía de emitir un aviso: reconocía la
aceptación del proceso nuevo, pero no READY. La app confirmaba navegación
antes de disponer de la tarjeta; Solicitudes eliminaba el destino después
de 150 ms incluso si no encontraba el elemento.

Ahora:

1. Service worker y app comparten una identidad semántica por evento basada
   en las etiquetas ya entregadas por backend: vista destinataria, pedido o
   cotización y tipo de evento. Aceptación y READY son identidades diferentes.
   La variante `coordination-ready` y el estado frontend READY se normalizan
   al mismo evento listo. No es un identificador nuevo de evento del servidor.
2. Después de mostrar correctamente una notificación del sistema se registra
   su identidad; al abrir una notificación antigua también se recupera su
   etiqueta. El registro Cache API contiene exclusivamente clave y fecha,
   hasta 100 entradas con vigencia de 24 horas. No guarda cuerpos, contactos,
   credenciales ni entidades completas. Una referencia en memoria conserva
   las aperturas recientes aunque falle el acceso a caché.
3. El monitor consulta ese registro antes de emitir el aviso interno. Suprimir
   el aviso no suprime lectura de listas, referencia de estados, contadores,
   marcas de interacción ni el evento de actualización de Solicitudes.
4. El destino explícito se conserva con independencia del texto del aviso.
   El monitor deja de navegar por el primer cambio de estado al regresar:
   ese cambio podía pertenecer a otro pedido. READY tiene texto interno propio.
5. Solicitudes espera la lista correcta y su categoría. Un MutationObserver
   espera la tarjeta renderizada y visible, y comprueba que acepte foco real
   antes de desplazarla y confirmar atención. La comprobación exige sesión.
   El temporizador de 150 ms fue retirado. El resaltado visual conserva su
   duración limitada; ese temporizador visual no consume destinos.
6. La app confirma al worker únicamente tras el enfoque exitoso y consume la
   URL correspondiente. La confirmación contiene el destino exacto. El worker
   serializa escrituras y no permite que una confirmación vieja elimine el
   destino de otra notificación. La caché de navegación deja de caducar a los
   cinco minutos mientras la sesión o la carga siguen pendientes.
7. Repeticiones del mismo evento no remontan la pantalla ni repiten el foco.
   Si ya se atendió, se puede reiterar su confirmación sin volver a navegar.
   Los destinos ajenos al origen o sin vista/identificador válidos se rechazan.
8. Se conecta el callback de sesión expirada de Solicitudes con el manejo de
   sesión existente de App. Una autenticación posterior conserva el destino
   pendiente y vuelve a Solicitudes.

La identidad actual distingue los eventos semánticos del contrato existente;
no se agregó un ID de outbox ni una versión al push. Si backend permite en el
futuro varias ocurrencias distintas del mismo tipo por pedido, deberá acordarse
una identidad de servidor que las diferencie antes de ampliar este mecanismo.

## Límite explícito: app visible e iPhone

Esta fase corrige duplicación al abrir y navegación. No declara resuelto el
objetivo completo de «solo aviso interno con app visible».

En plataformas Apple, un push recibido se presenta visiblemente conforme a
`userVisibleOnly`; no se utiliza recibir y ocultar el push como solución.
La rama anterior que omitía la presentación al encontrar una ventana enfocada
ya no se aplica a los agentes Apple identificados, incluido iPad con agente
Macintosh. El mecanismo existente de aviso interno con ventana visible y
enfocada se conserva en las otras plataformas.

Backend debe acordar cualquier futura selección entre canales con confirmación
activa por evento/dispositivo y alternativa de entrega. La presencia guardada
no será la única condición para bloquear un push. No se implementó ese contrato
en esta fase.

## Archivos del commit de código

- `public/push-sw.js`.
- `src/app/App.tsx`.
- `src/app/notifications/BusinessNotificationMonitor.tsx`.
- `src/app/notifications/BusinessNotificationMonitorFlow.test.ts`.
- `src/app/notifications/orderNotice.ts`.
- `src/app/notifications/notificationDelivery.ts`.
- `src/app/notifications/notificationNavigation.ts`.
- `src/app/notifications/notificationLifecycle.test.ts`.
- `src/app/screens/RequestsScreen.tsx`.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`.

## Contrato y operaciones conservados

Se utilizan los campos push ya existentes `tag`, `type`, `url`, `orderId` y
`quoteId`, los estados de listas y el resumen `requestProcess`. `eventKey` y
`notificationEvent` son comunicación local worker/app y navegación; no son
campos nuevos de la API backend.

Se mantienen las lecturas `GET /orders/my-orders`,
`GET /orders/business/:businessId`, `GET /quotes/my-quotes` y
`GET /quotes/business/:businessId`, además de la actualización de presencia
existente `/push/presence`. Las lecturas repetidas al regresar no se declararon
causa del incidente ni se eliminaron indiscriminadamente.

No se enviaron acciones reales de pedidos, ni se repitió START_WORK.
Railway QA no requiere despliegue para esta fase.

## Pruebas y builds

- `npm.cmd test`: **872 pruebas aprobadas, 81 archivos**.
- Pruebas nuevas del worker real ejecutado en entorno simulado: presentación,
  clic, inicio sin ventanas abiertas, repetición de clic/mensajes, confirmación
  vieja frente a destino nuevo y compatibilidad con notificaciones anteriores.
- Espera de sesión, listas y elemento renderizado; ausencia de consumo si la
  tarjeta está oculta o no acepta foco; cancelación de observadores antiguos.
- Navegación de aceptación y READY en cliente y negocio mediante la pantalla
  real con hooks/DOM simulados. Ninguna prueba ejecuta acciones de pedidos.
- Monitor: aviso aceptado ya presentado se suprime, conserva actualización de
  contadores y permite el aviso posterior READY del mismo pedido.
- Apple: una ventana enfocada no evita la presentación visible del push.
- `node --check public/push-sw.js`: aprobado.
- Build QA con diagnóstico temporal existente habilitado: aprobado.
- Build producción y verificador con sentinel sintético: aprobados. Se comprobó
  exclusión del panel y la instrumentación del diagnóstico temporal en producción.
- Advertencia del build: tamaño de bundle superior a 500 kB; no bloqueó el build.

Estas verificaciones son automatizadas con datos sintéticos. No sustituyen
la comprobación de instalación PWA, permisos y navegación en dispositivos reales.

## Publicación prevista y comprobación en celular

Publicar exclusivamente desde Git real, rama `qa`, entorno Preview del proyecto
`zipco-app`, equipo `zipco-s-projects`, con el SHA exacto verificado. Mantener el
diagnóstico temporal previamente habilitado mediante override del despliegue:

```text
ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa
```

No modificar configuración global, producción ni backend. Mantener el alias QA
habitual `https://zipco-app-git-qa-zipco-s-projects.vercel.app` y conservar el
despliegue previo como referencia, sin reversión automática.

En Android y en iPhone con la PWA instalada y permisos concedidos:

1. Abrir el acceso QA habitual y actualizar normalmente para cargar la nueva
   app y el worker. Para esta comprobación usar notificaciones nuevas recibidas
   después de actualizar, sin borrar datos ni reinstalar de forma rutinaria.
2. Con la app en segundo plano, recibir una aceptación y pulsarla: debe abrir
   Solicitudes, seleccionar Coordinación y enfocar el pedido correspondiente,
   sin repetir arriba el aviso de aceptación ya presentado por el sistema.
3. Comprobar de la misma forma una nueva notificación «Pedido listo»: debe
   seleccionar Listos y enfocar ese pedido, sin repetir el aviso interno.
4. Repetir apertura con la app cerrada y con red lenta. Si hace falta iniciar
   sesión, completarla normalmente: el destino debe esperar y enfocarse cuando
   estén disponibles la lista y la tarjeta.
5. Verificar que las repeticiones del mensaje no reinicien la pantalla y que
   otros avisos posteriores del mismo pedido sigan siendo independientes.
6. Comprobar listas y contadores. No confundir aviso suprimido con una lista
   que no se actualiza.

La preparación de eventos para estas comprobaciones corresponde al flujo QA
normal autorizado de los participantes. El agente no ejecutó ni repetirá
acciones de pedidos para forzar la prueba.

## Pendientes

- Registrar despliegue efectivo, SHA, alias y verificación del build publicado.
- Confirmación de Bastián en Android/iPhone; no declararla realizada por las pruebas.
- Contrato adicional con backend para la entrega exclusivamente interna con
  la app visible; no resuelto en este bloque.
- Los documentos locales pendientes de otros bloques siguen fuera de estos commits.
- `main` y producción no se modifican.
