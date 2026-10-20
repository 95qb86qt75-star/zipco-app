# UI-BUSINESS-PENDING-REJECT-01 — Rechazar solicitud inicial

Fecha: 2026-10-20. Clasificación frontend + backend; backend ya publicado.
Esta integración modifica únicamente frontend QA. Contrato:
`C:/dev/zipco-backend-qa/docs/testing/business-pending-rejection-qa.md`,
REQ-BUSINESS-REJECT-PENDING-01, Backend QA
`772b78a31d08f9a205d3be553547f15c15b659e2`.

## Diagnóstico y compatibilidad

Frontend c505bae rechazaba el resumen completo si allowedActions contenía
REJECT_PENDING_REQUEST, añadido por Backend 772b78a. normalizeOrderProcess
marcaba requestProcessInvalid y el agrupador enviaba el pedido a Por coordinar,
mostrando «Estado del proceso no disponible». Se reprodujo con datos sintéticos
ejecutando el código anterior; no se capturó la respuesta real del pedido de la
captura y no se atribuye un HTTP/código público a ese caso particular.

Ahora se reconoce esa acción explícita. La respuesta válida con
AWAITING_BUSINESS_RESPONSE y permisos ACCEPT_FIXED_ORDER/REJECT_PENDING_REQUEST
permanece en Pendientes y conserva ambas acciones. No se alteran datos o estados
reales para reparar su presentación. Acciones desconocidas siguen activando el
resguardo; no se elimina la validación ni se conceden permisos por Order.status.

## Comportamiento y contrato

- Solo negocio participante, pedido disponible, estado inicial, acuerdo null y
  allowedActions con REJECT_PENDING_REQUEST: botón Rechazar solicitud. No cliente,
  coordinación, cotizaciones o historial. Se mantiene la aceptación y diseño
  anterior de tarjetas, colores, datos originales y desplazamiento de campanitas.
- Primer popup selecciona uno de los seis motivos del contrato: unavailable,
  cannot_meet_schedule, outside_service_area, insufficient_information,
  no_capacity, other. Otro motivo exige explicación de 1 a 1000 caracteres tras
  recortar extremos. No se envía explicación para los otros motivos.
- Continuar no envía. Confirmación «¿Confirmas que deseas rechazar esta solicitud?»
  con Volver / Confirmar rechazo. Volver/cerrar no ejecuta; cierre y controles
  bloqueados durante el envío; foco restaurado si el control sigue presente.
- POST `/request-processes/:id/actions/reject-pending-request`, JWT existente e
  Idempotency-Key UUIDv4 de la intención. Cuerpo exacto expectedVersion,
  confirmationAccepted true, reasonCode y solo para other reasonDetail recortado.
  Sin PATCH antiguo, campos inventados ni timestamps generados por frontend.
- Recibo 200 validado: mismo pedido/proceso, versión esperada + 1, propuesta
  original conservada, rejected/CLOSED, acuerdo null, acciones vacías, cierre
  BUSINESS con autor/fecha válidos y motivo/detalle coincidentes con la intención.
- Historial de cliente y negocio: Rechazada, motivo y explicación cuando existe,
  Ver solicitud y detalle original. Texto libre como texto escapado. No se
  consulta un acuerdo inexistente ni se representa como condiciones aceptadas.
- Misma infraestructura de intención por sesión/rol/proceso, misma clave/cuerpo
  en reintento incierto; restauración requiere leer primero. El cuerpo exacto
  contiene el motivo y explicación aprobados, no credenciales ni contactos.
  No se añaden registros de consola o diagnósticos con ese texto libre.
- Conflictos STALE_VERSION/INCOMPATIBLE_STATE actualizan estado y explican que
  no se rechazará automáticamente; sin cambiar a otra acción. Se conservan los
  manejos seguros 400/401/403/404/409 y los permisos backend. POST confirmado
  seguido de GET fallido conserva Historial y recibo; reintentar solo lectura.
  Una respuesta antigua no revierte el cierre conocido.
- Aviso cliente genérico acordado: «El negocio no pudo aceptar tu solicitud» /
  «Revisa el motivo en ZIPCO.». Sin motivo/detalle en el aviso. Identidad existente
  order-ID-rejected coincide con tag backend; su clic usa navegación existente
  a Historial/tarjeta y supresión de repetición, incluso con sesión/listas tardías.
  Sin cambios en service worker, recepción push o arquitectura pausada.

## Archivos y validación

Producción de UI/contrato: requestProcess.ts, coordinationApi.ts,
coordinationIntent.ts, useCoordination.ts, PendingRejectionActions.tsx,
ProcessOrderCard.tsx, ProcessHistoryCard.tsx, requestStatusGrouping.ts y
useRequests.ts en src/app/screens/requests; src/app/screens/RequestsScreen.tsx;
src/app/notifications/orderNotice.ts.

Pruebas/fixtures: PendingRejectionActions.test.ts, pendingRejectionApi.test.ts,
pendingRejectionFixtures.ts, coordinationIntent.test.ts, useCoordination.test.ts,
processCardVisualFlow.test.ts, useRequestsContract.test.ts en requests;
RequestsScreen.notificationNavigation.test.ts y notificationLifecycle.test.ts.

**1021 pruebas en 89 archivos aprobadas**, build QA aprobado (advertencia habitual
de bundle >500 kB). 24 regresiones táctiles Chrome del scroll de campanitas con
datos sintéticos y backend bloqueado, sin acciones reales. Pruebas nuevas de
permisos, Pendientes y botones, seis motivos, validación/cierre, Historial de ambas
partes, conflictos, doble toque, respuesta perdida, intención restaurada, POST
confirmado/GET fallido, lecturas antiguas y navegación/supresión del aviso.

## Publicación y comprobación física

Publicar desde Git real y SHA exacto en qa, Vercel Preview zipco-app del equipo
zipco-s-projects. Único override por despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Backend QA conservado. Sin ajustes globales, Railway, migraciones, main o
producción. Registrar después resultado y nombre+commit en cierre documental.

**Prueba física Android/iPhone pendiente**, no sustituida por READY:
1. Actualizar acceso QA habitual. Solicitud inicial válida visible en Pendientes,
   con detalle/aceptación y botón Rechazar; sin tarjeta de resguardo por esta acción.
2. Abrir rechazo, seleccionar y volver/cerrar: no cambia el pedido.
3. En solicitud ficticia autorizada, confirmar: Historial de ambos, motivo y datos
   originales; Otro motivo requiere explicación. No repetir acción confirmada.
4. Cliente en segundo plano: abrir aviso genérico y comprobar enfoque de la tarjeta
   en Historial sin aviso superior repetido. También probar con app cerrada.
5. Competencia aceptar/rechazar/anular solo coordinada con solicitudes ficticias
   distintas: un único ganador, el otro actualiza sin rechazo automático.

No se ejecutaron acciones reales QA al implementar, validar o publicar. La deuda
de entrega fiable/reintentos de avisos del backend sigue pendiente; no se inicia
outbox ni se declara completado el objetivo global de notificaciones en iPhone.

## Resultado de publicación — 2026-10-20

Código, pruebas y ficha (21 rutas) guardados y enviados a origin/qa en
`6778c2ad4ff8b72647f44ea12db75a105bfb4be0`.
Preview funcional READY `dpl_Cr4NRMPUen5hpuifzpeYmsS2yp41`, URL propia
https://zipco-oksc6ynay-zipco-s-projects.vercel.app.
Fuente GitHub real, SHA exacto, rama qa y entorno Preview verificados.
Alias habitual https://zipco-app-git-qa-zipco-s-projects.vercel.app apunta a ese
despliegue al comprobarlo. Build en modo qa completado, diagnóstico de lecturas
habilitado, traza de clic deshabilitada y su asset ausente. Backend Preview
verificado como https://zipco-backend-qa.up.railway.app. Build global null y rama
de producción main conservados. Sin modificaciones en Railway o pedidos reales.

Este resultado, catálogo y registro se conservan en un cierre documental posterior
en qa; su publicación usa exactamente el mismo código funcional y override QA.
El SHA visible final será el de ese cierre documental. No hay aprobación física
Android/iPhone todavía; READY y pruebas automatizadas no la sustituyen.
