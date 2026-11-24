# QA-PUSH-OPEN-02 — No repetir el consentimiento abierto desde una notificación

## Identificación y alcance

- Clasificación: solo frontend QA sobre el contrato existente de Backend QA.
- Nombre estable: deduplicación al abrir `order-contact-authorized` en negocio.
- Código: `9539b30db35a06a3d76784479a8352e0a078596c`.
- Rama: `qa`.
- Estado inicial: implementado y validado localmente; publicación pendiente de registrar.
- La arquitectura nueva de notificaciones permanece **pausada**, por instrucción
  de Bastián. Este bloque amplía únicamente la protección existente frente a repetición.

## Situación informada y versión revisada

Bastián confirmó en Android negocio que, después del consentimiento del cliente,
la notificación del celular abre ZIPCO y el aviso vuelve a aparecer arriba.
También confirmó que usó el acceso QA habitual:
<https://zipco-app-git-qa-zipco-s-projects.vercel.app>.

Antes de este bloque, la API autenticada de Vercel confirmó que el alias apuntaba
al Preview `dpl_3gwUjhBPxu5oWsEfeCQsxBR9Rk2G`, READY, origen GitHub,
rama qa y SHA `6933d0fc73835b2824bde9635a59f01565b5d18b`.

El registro del worker se revisó en `src/main.tsx` y `vite.config.ts`:
`/sw.js` generado importa `push-sw.js`, comprueba actualizaciones al iniciar y
al volver a la app, y utiliza skipWaiting/clientsClaim y recarga al cambiar
de controlador. No se cambió esa política.

Límite de evidencia: la versión publicada y el código del worker se comprobaron;
no se dispone de acceso remoto al navegador Android para leer su controlador
instalado o capturar el emisor exacto del aviso del incidente. La confirmación
del enlace por Bastián no demuestra por sí sola qué worker conservaba el celular.
La comprobación física posterior sigue pendiente; no se declara realizada.

## Contrato existente

Se revisó, solo en lectura, `src/notifications/push-notifications.service.ts`
de Backend QA. El evento nuevo utiliza:

- `type`: `order-contact-authorized`.
- `tag`: plantilla `order-<id>-coordination-contact-authorized`.
- `orderId`, `requestProcessId` y `url` de Solicitudes para el destinatario.
- `title` y `body` de presentación; no se usan para reconocer identidades.

No se agregan campos, endpoints, estados, permisos o datos de servidor.
No se capturaron payloads reales, teléfonos, credenciales ni cuerpos sensibles.

## Hallazgos y corrección

La protección anterior cubría la emisión del monitor, pero App no filtraba
centralmente los avisos recibidos mediante `zipco-toast`, ni retiraba un aviso
igual que ya estuviera visible al abrir la notificación del sistema. Además,
la identidad con prefijo `coordination-contact-authorized` no se unificaba
con el nombre semántico `contact-authorized`.

La corrección:

1. Normaliza exclusivamente las variantes del evento nuevo, conservando vista,
   pedido y tipo. Aceptación, READY, otros pedidos y otros avisos permanecen distintos.
2. El worker reconoce `order-contact-authorized` por la etiqueta actual y
   también por tipo más pedido si falta etiqueta. Al abrir una notificación
   del worker anterior, recupera y normaliza su etiqueta e identidad.
3. La lectura del registro existente acepta identidades antiguas sin descartar
   datos ni crear una persistencia nueva. Se conservan 100 entradas y vigencia
   de 24 horas, únicamente con clave mínima y fecha.
4. App comprueba la identidad antes de mostrar el aviso. Al abrir la notificación
   o recibir la confirmación de presentación del sistema, retira únicamente un
   aviso visible del mismo evento. También verifica de nuevo una entrega pendiente
   si la apertura ocurrió durante la lectura de caché.
5. Se mantiene la navegación existente al pedido y su confirmación tras el foco.
   No se cambian consultas, intervalos, marcas ni publicación de contadores.
6. No se agrega una emisión interna nueva a partir del cuerpo del push ni se
   silencian todos los avisos del pedido. Mensajes no identificables conservan
   su comportamiento; no se comparan textos para ocultarlos indiscriminadamente.

Esto cierra huecos comprobados en código; la reproducción física concreta y
la confirmación de ausencia de repetición en Android todavía deben probarse.

## Archivos del commit de código

- `public/push-sw.js`.
- `src/app/App.tsx`.
- `src/app/notifications/notificationDelivery.ts`.
- `src/app/notifications/notificationLifecycle.test.ts`.
- `src/app/notifications/BusinessNotificationMonitorFlow.test.ts`.

## Pruebas y build

- Pruebas focalizadas de worker, monitor y Toast: 31 aprobadas.
- Suite completa: **878 pruebas aprobadas en 81 archivos**.
- Build QA con el diagnóstico temporal previo habilitado: aprobado.
- `node --check public/push-sw.js` y revisión de diff: aprobados.
- La copia de `push-sw.js` del build coincide con la fuente local.
- El SW generado importa y precachea la revisión nueva de `push-sw.js`:
  `4ad7e08da753c875f1dfa553a684c01e` en el build local comprobado.
- Marcador legible en la fuente del worker corregido:
  `contact-authorized-open-v2`. Es identificación de revisión, no arquitectura nueva.
- Advertencia habitual del build por bundle superior a 500 kB; build completado.

Las regresiones cubren push y clic Android de consentimiento, etiqueta anterior,
tipo sin etiqueta, aviso visible coincidente, entrega pendiente durante lectura,
aviso posterior READY distinto, otro pedido y mensajes ajenos. El monitor sigue
leyendo listas y publicando el contador de negocio al recibir el evento nuevo.
Todas las pruebas utilizan datos sintéticos; no ejecutan acciones reales de pedidos.

## Comprobación móvil tras publicar

1. Abrir y actualizar el acceso QA habitual para cargar la app y su worker nuevos.
2. En Android negocio, con ZIPCO en segundo plano, recibir una nueva notificación
   del consentimiento del cliente mediante el flujo normal QA autorizado.
3. Pulsarla: debe abrir el pedido correcto, sin repetir ese consentimiento arriba.
4. Comprobar listas y contadores y después un aviso distinto del mismo pedido.
5. Si reaparece, registrar dispositivo, enlace, versión y texto del aviso sin
   incluir contactos ni credenciales. No asumir que el worker se actualizó solo
   porque se abrió el enlace; distinguir revisión del bundle y controlador activo.

Para inspección técnica con DevTools conectado al dispositivo, revisar el worker
activo en Application/Service Workers y buscar el marcador de revisión en
`push-sw.js`. Desde aquí no se ha efectuado esa inspección del Android.

No se ejecutó START_WORK ni ninguna acción de pedidos. Campos y rutas de lectura
existentes (`/orders/my-orders`, `/orders/business/:businessId`, cotizaciones y
`/push/presence`) se conservan. Railway QA no requiere cambios.

Los documentos locales pendientes se conservan fuera de estos commits.
`main`, producción, configuración global y protección Vercel permanecen intactos.
El objetivo general de entrega entre canales y su arquitectura nueva siguen pendientes.

## Publicación comprobada

- Commit fuente publicado: `644b70758a1758f850a3bf7d82a75dca820996a5`
  (código `9539b30db35a06a3d76784479a8352e0a078596c` e informe).
- Preview `dpl_CJ9VRc4dDg7XDWbzfPrqfeNV9F7V`: **READY**.
- URL propia: <https://zipco-apnoqpvvo-zipco-s-projects.vercel.app>.
- Alias habitual verificado apuntando a ese despliegue:
  <https://zipco-app-git-qa-zipco-s-projects.vercel.app>.
- Origen GitHub, rama qa, entorno Preview y SHA exacto comprobados por API autenticada.
- Logs confirman modo QA, build y despliegue completados.
- El diagnóstico temporal anterior se conservó mediante override exclusivo:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
- Backend QA comprobado por configuración pública Preview; sin cambios de su
  valor. Build global y rama de producción permanecen intactos.
- Los quince documentos locales pendientes anteriores conservaron sus hashes
  y no entraron en estos dos commits. Staging vacío; HEAD igual a origin/qa.
- La protección Vercel se mantiene. La lectura anónima del Preview protegido
  no permite inspeccionar el navegador Android; no se creó acceso alternativo.
- Fuente del worker incluida en el build QA y registro automático comprobados;
  controlador realmente activo en el Android y prueba física tras actualizar:
  **pendientes de comprobación**, no confirmados por la publicación.
- Arquitectura nueva de notificaciones: sigue pausada. Railway QA, backend,
  acciones de pedidos, `main`, producción y configuración global: sin modificaciones.
- Este registro posterior al despliegue queda local, pendiente de commit documental
  futuro. No se hizo otro push que reemplazara el Preview comprobado.

## Reapertura por prueba de Android — resultado todavía no resuelto

Bastián informó que la notificación sigue apareciendo dentro de ZIPCO después
de pulsar la notificación del sistema con la app en segundo plano. Esta prueba
reabre el incidente: la publicación anterior y sus pruebas automatizadas no
acreditan que el problema esté resuelto en el dispositivo.

Se volvió a verificar por API autenticada que el acceso QA habitual apunta a
`dpl_CJ9VRc4dDg7XDWbzfPrqfeNV9F7V`, READY, rama qa y SHA
`644b70758a1758f850a3bf7d82a75dca820996a5`. La versión del controlador
instalado en Android continúa sin poder inspeccionarse remotamente desde aquí.

La búsqueda completa de los emisores muestra que el monitor de negocio actual
no emite un toast con el texto del consentimiento: ante ese tipo de push
actualiza las listas. Sí puede emitir otros avisos al recargar, incluidos
pedidos pendientes que no están en su referencia en memoria. No se debe
equiparar esos avisos al consentimiento ni silenciarlos por pertenecer al
mismo pedido sin identificar el evento.

Se solicitó el título exacto del aviso que reaparece, sin nombres, contactos
ni datos del pedido, para identificar el emisor antes de otra corrección.
También falta distinguir un toast de ZIPCO de un segundo aviso del sistema.
No hay una causa nueva confirmada del incidente físico ni un nuevo arreglo
publicado en esta revisión. No se atribuye el fallo a caché o versión antigua
sin evidencia. Arquitectura nueva: sigue pausada.
