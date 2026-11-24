# UI-BUSINESS-PENDING-RESPONSES-01 — Respuestas plegadas y cierre visible

2026-10-21. Clasificación: **solo frontend**. Rama `qa`.
Base limpia y sincronizada: `b5369eff5defdb33437cb9939f481753e77e113c`.

## Antes / Después

Antes: en Mi Negocio → Pedidos, la tarjeta nueva plegada mostraba Proponer
alternativa y Rechazar solicitud. Al desplegar, Ocultar detalle quedaba entre
Aceptar pedido y esas otras dos acciones.

Después: en AWAITING_BUSINESS_RESPONSE del negocio, Proponer alternativa y
Rechazar solicitud están ocultos mientras la tarjeta está plegada. Revisar y
responder despliega el detalle y los controles en este orden:

1. Aceptar pedido, cuando esté permitido.
2. Proponer alternativa, cuando esté permitido.
3. Rechazar solicitud, cuando esté permitido.
4. Ocultar detalle, al final, con flecha ascendente, borde y brillo estático.

Se conserva el mismo toggle, incluido teclado/clic de la tarjeta. Ocultar
detalle vuelve al resumen plegado. El brillo no introduce una animación continua.
No se habilita ninguna acción que el contrato no permita.

## Archivos y decisiones

- `src/app/screens/requests/ProcessOrderCard.tsx`: agrupa las respuestas en un
  contenedor con hidden para la solicitud inicial del negocio; coloca el cierre
  después de las respuestas y mantiene la aceptación dentro del detalle.
- `src/styles/index.css`: presentación del cierre, foco visible y contraste de
  avisos de recuperación/error dentro del grupo sobre el fondo Aurora.
- `src/app/screens/requests/processCardVisualFlow.test.ts`: regresión de
  plegado/desplegado, orden, permanencia de componentes y ausencia de acciones.
- `scripts/check-order-card-aurora.mjs`: añade seis recorridos de plegado con
  formularios reales sobre datos sintéticos y robustez del lector de Chrome.
- Esta ficha y catálogo; conformidad anterior del botón rojo registrada aparte.

Se usa hidden en lugar de desmontar ProposalNegotiation/PendingRejectionActions.
Así se conservan referencias, borradores, motivo elegido, bloqueos y recuperación
de operaciones ante un plegado del padre. No se cambian sus handlers ni permisos.
Los diálogos mantienen sus portales y comportamiento actual.

No se ocultan las respuestas de negociación posteriores del cliente o negocio,
ni la autorización de contacto o acciones de coordinación. Se preservan los
diseños verdes/rojos aprobados, Aurora, acordeón del cliente, historial y pedidos
legacy. No se cambia el posicionamiento o la navegación de notificaciones.

## Contrato y validación

Sin campos, endpoints, payloads, estados o permisos nuevos/modificados.
Se conservan state/allowedActions, processContract=alternatives-v1, lecturas de propuestas y
las acciones existentes accept-fixed-order, propose-alternative y
reject-pending-request bajo `/request-processes/:id/actions/*`. Plegar/desplegar
no ejecuta esos POST. No requiere backend ni Railway QA.

- **1138 pruebas / 97 archivos aprobados**.
- **Build QA y generación PWA aprobados**; aviso habitual de bundle grande.
- Chrome local con React real/CSS compilado: **234 comprobaciones**, incluidas
  228 regresiones de tarjetas y seis recorridos nuevos (320/393/400 px,
  claro/oscuro): botones ocultos al inicio, orden de los cuatro controles,
  cierre con brillo, motivo y borrador conservados al plegar, cero POST.
- Regresiones de cliente/negocio, estados, historial, enfoque por notificación,
  movimiento reducido y gesto de historial conservadas.
- Solo datos y respuestas sintéticas; sin acciones o lecturas contra Backend QA,
  ni fotos reales. Capturas en node_modules/.cache/order-card-aurora-browser.
- Diff revisado: código de envío, formularios, API y configuración sin cambios.

Prueba física pendiente: negocio → Pedidos → Pendientes; comprobar tarjeta
plegada, pulsar Revisar y responder, revisar detalle y orden, pulsar Ocultar
detalle y abrir de nuevo. No confirmar pedidos/propuestas/rechazos únicamente
para revisar el diseño. No se acredita todavía conformidad móvil de este bloque.

Sin cambios en backend, Railway QA, worker, main o producción. Arquitectura nueva
de notificaciones pausada y reintentos fiables mantienen sus pendientes previos.

## Publicación

Commit/push a origin/qa y Vercel Preview QA con Backend QA y override vigente:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Registrar READY en cierre documental posterior, también respaldado y publicado.

## Publicación comprobada — 2026-10-21

Código `350ccd99fdf2afb5181047bcd1ccbfe373537d70`, enviado a origin/qa.
Preview funcional **READY**, `dpl_3dfTmU87R76jETGNUzEX4pysugZS`, URL propia
https://zipco-cri439u7i-zipco-s-projects.vercel.app. Por API se comprobaron
GitSource/SHA exacto, rama qa, target Preview y alias QA habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app apuntando a ese despliegue.
Backend QA y override vigentes conservados; build global null y rama de
producción main sin cambios. Git limpio y sincronizado al publicar el código.

El resultado y catálogo se guardan en un commit documental posterior, que se
publica con idéntico código funcional/opciones. Su SHA es la versión visible
final. La validación visual fue local; conformidad física de esta disposición
pendiente. No se modificó ni repitió ninguna acción de pedidos reales.

## UI-BUSINESS-PENDING-REVEAL-01 — Apertura suave y ordenada — 2026-10-21

Clasificación: solo frontend. Base limpia QA `39b7bdffd4d28e0607737bfd31c283ccd94f1a6e`.
Bastián confirmó que el plegado funciona, pero reportó que Proponer alternativa
y Rechazar solicitud aparecían antes del detalle y Aceptar pedido. La conformidad
con el plegado no se interpreta como aprobación de esa secuencia de animación.

Causa comprobada en ProcessOrderCard: detalle/aceptación estaban dentro de
AnimatePresence mode=wait y su motion.div de altura/opacidad, mientras el grupo
externo de respuestas retiraba hidden inmediatamente al cambiar isExpanded.
El grupo inferior aparecía mientras todavía terminaba la salida del acceso
plegado y empezaba la animación separada del detalle.

Corrección: detalle, foto, aceptación, propuesta, rechazo y cierre comparten
un único contenedor de revelado. Su fila CSS Grid pasa de 0fr a 1fr en 360 ms,
con opacidad de 240 ms y recorte común desde arriba. El acceso plegado ya no
introduce un AnimatePresence separado para la solicitud inicial del negocio.
No hay temporizadores ni demoras independientes por botón.

Se conservan los componentes montados al plegar, incluido el detalle. Aria-hidden
y el atributo nativo inert impiden anunciar/enfocar/operar controles plegados.
Los portales conservan borrador y motivo si se pliega desde el padre. Un margen
interno de recorte conserva los brillos de los botones. Movimiento reducido
elimina la transición manteniendo el orden. Cliente, negociación posterior,
coordinación, permisos, envíos y navegación no cambian.

Archivos: ProcessOrderCard.tsx y src/styles/index.css; regresión existente en
processCardVisualFlow.test.ts y scripts/check-order-card-aurora.mjs. El detalle
se extrae a un nodo compartido para evitar dos versiones de sus datos/acciones.

Validación: **1138 pruebas / 97 archivos**, build QA/PWA y **234 comprobaciones
de navegador** aprobadas. Las seis aperturas de negocio a 320/393/400 px en ambos
temas muestrean fotogramas: existen alturas intermedias y ningún control inferior
se revela antes de sus anteriores. Se verifican orden final, foco bloqueado al
cerrar, formularios conservados y transición anulada con movimiento reducido.
Sin POST ni acceso al backend en la matriz sintética. Prueba física pendiente.

Sin campos/endpoints/payloads nuevos o modificados; mismo contrato y Backend QA.
No requiere Railway ni cambios en worker, main o producción. Se conservan los
pendientes generales de notificaciones. Guardar commit/push en qa y publicar
Preview con el override QA vigente; registrar READY en el cierre documental.

### Publicación de la apertura suave — 2026-10-21

Código `0f71fd36fa5fb4a374e232867dd5f545f79a0239`, enviado a origin/qa.
Vercel Preview **READY**, `dpl_DqSsF6opXfEqYiKieoDVh7UNKYEc`, URL propia
https://zipco-jh2mg20r6-zipco-s-projects.vercel.app. GitSource/SHA exacto, ref qa,
target Preview y alias habitual comprobados por API. Se mantienen Backend QA,
override de build, build global null y rama de producción main sin cambios.

Este resultado y catálogo se guardan en un commit documental posterior,
publicado con idéntico código funcional y build QA. Su SHA es la versión final.
La conformidad de la nueva animación desde el celular sigue pendiente.
