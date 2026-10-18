# Confirmaciones del cliente — implementación local QA

Fecha: 2026-10-17. Seguimiento: RECEIPT-01. Rama `qa`, base frontend
`dbf5bd96f3f4ccfa99cbf59d873c43b87e5556e0`.

Clasificación: frontend sobre contrato coordinado frontend + backend. Contrato
leído de `C:/dev/zipco-backend-qa/docs/testing/request-process-customer-receipt-qa.md`,
publicado en Backend QA `385de884000cff7ba92caa791a8084ad40090dfd`, según el
documento y la confirmación de Bastián. Sin cambios de backend ni acciones reales.

## Modificaciones de este bloque

1. Se reconocen `ACK_READY_NOTICE`, `CONFIRM_RECEIPT` y el booleano opcional
   `requestProcess.readyNoticeAcknowledged`. Se conserva su ausencia sin inventar
   false o true; valores presentes de otro tipo invalidan el proceso.
2. En cliente/producto READY, **Confirmar aviso** sustituye WhatsApp cuando el
   backend ofrece esa acción. Abre un popup que explica que confirma haber visto
   el aviso y que retirará según lo coordinado; no acredita recepción. Solo el
   botón **Sí, confirmar aviso** envía la acción.
3. Tras el acuse, conserva READY/ready, Listos, acuerdo y contador. Cuando el
   booleano es true, muestra **Pendiente de retiro** y seguimiento del retiro.
   Este texto no crea un estado ni un modo nuevo de pedido.
4. **Confirmar recepción**, únicamente con permiso del backend y acuse true,
   abre otro popup. Indica confirmar solo cuando ya tenga el producto y que
   finalizará el pedido. Solo **Sí, ya recibí mi pedido** envía esa acción.
5. La recepción válida aplica COMPLETED/completed a ambas listas, deja de contar
   como listo e integra Historial. Conserva acceso al acuerdo aceptado; no añade
   pagos, reseñas, recordatorios ni confirmaciones de entrega push.
6. Negocio/producto READY retira WhatsApp del panel y presenta el acuse del
   servidor: esperando confirmación, cliente confirmó el aviso, o estado del
   aviso no disponible. No deduce el acuse por ver READY. Ante ausencia del
   booleano ofrece actualización de lectura; no permite recepción por inferencia.
7. El resumen seleccionado del cliente usa verde teal oscuro y texto blanco;
   antes usaba ámbar/naranja. Incluye `aria-pressed`. En pedidos su selección
   conserva Listos como categoría; los textos y selección de servicios mantienen
   su comportamiento anterior. No se cambian pedidos antiguos ni sus acciones.
8. Reutiliza bloqueo de doble toque, intención persistida y UUID/cuerpo exactos
   para reintentos deliberados. Un GET fallido después de confirmar no repite el
   POST. Las intenciones recuperadas requieren conciliación. Las confirmaciones
   prefieren el GET reciente al recibo antiguo; un replay sin booleano no borra
   el acuse ya leído en la misma versión. Al completar no se reutiliza navegación
   WhatsApp recuperada.

Los popups usan AlertDialog de Radix ya instalado, con portal, título/descripción,
foco modal y botón Volver. Se bloquea el cierre mientras se confirma. La revisión
visual final con Bastián queda pendiente, incluidos foco, scroll y áreas seguras
en celulares.

## Campos y rutas

- `POST /request-processes/:id/actions/ack-ready-notice`.
- `POST /request-processes/:id/actions/confirm-receipt`.
- `:id` es requestProcess.id; `Idempotency-Key` UUID mediante el mecanismo actual.
- Cuerpo exacto para ambas: `{ expectedVersion, confirmationAccepted: true }`.
- Recibo: `orderId`, `orderStatus`, `requestProcess` con estado, versión,
  propuesta/acuerdo, allowedActions y booleano opcional. Se tolera ausencia del
  booleano en recibos históricos y se concilia con las lecturas existentes.
- Lecturas de conciliación: `GET /orders/my-orders` y
  `GET /orders/business/:businessId`. El acuerdo conserva su GET autorizado.

Sin cambios en START_WORK, MARK_READY, recargas generales, instrumentación temporal
de loadOrders, configuración, credenciales, backend, alias ni proveedores.

## Inventario de archivos

Código:

- `src/app/screens/RequestsScreen.tsx`
- `src/app/screens/requests/CoordinationActions.tsx`
- `src/app/screens/requests/CustomerReceiptDialog.tsx` (nuevo)
- `src/app/screens/requests/ReadyOrdersSummary.tsx` (nuevo)
- `src/app/screens/requests/ProcessHistoryCard.tsx`
- `src/app/screens/requests/coordinationApi.ts`
- `src/app/screens/requests/coordinationIntent.ts`
- `src/app/screens/requests/requestProcess.ts`
- `src/app/screens/requests/requestStatusGrouping.ts`
- `src/app/screens/requests/useCoordination.ts`
- `src/app/screens/requests/useRequests.ts`

Pruebas:

- `src/app/screens/requests/CoordinationActions.test.ts`
- `src/app/screens/requests/CustomerReceiptDialog.test.ts` (nuevo)
- `src/app/screens/requests/ReadyOrdersSummary.test.ts` (nuevo)
- `src/app/screens/requests/coordinationApi.test.ts`
- `src/app/screens/requests/coordinationIntent.test.ts`
- `src/app/screens/requests/processCardVisualFlow.test.ts`
- `src/app/screens/requests/requestProcess.test.ts`
- `src/app/screens/requests/useCoordination.test.ts`
- `src/app/screens/requests/useRequestsContract.test.ts`

Documentación: este archivo (nuevo). Los cuatro documentos con cambios locales
anteriores quedan preservados y fuera de este bloque.

## Estado de entrega

Comprobaciones locales terminadas:

- `npm.cmd test`: **836 pruebas en 77 archivos, todas correctas** (39 pruebas
  adicionales frente a la base de este bloque).
- Build QA con diagnóstico temporal habilitado:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa --outDir node_modules/.cache/customer-receipt-qa-build`.
  Correcto; advertencia habitual de bundle superior a 500 kB.
- `git diff --check` correcto. Staging vacío; `dist/index.html`, configuración
  Vite y archivos de instrumentación de loadOrders sin cambios.
- Cobertura sintética: rutas/cuerpo/clave, permisos y booleano opcional, popups
  deliberados y bloqueo mientras hay POST pendiente, distinción Listos/Historial,
  acuerdo en ambas vistas, respuesta perdida, fallo del GET posterior, intención
  recuperada, almacenamiento, recibos históricos sin booleano, lectura más reciente
  y bloqueo de navegación WhatsApp después de completar. Pruebas de UI con
  harness/mocks; no equivalen a validación visual ni de foco real en celulares.

Implementación local; sin staging, commit, push ni publicación. Vercel QA conserva
el frontend publicado anteriormente. Railway QA no se modifica. Pruebas con datos
sintéticos, sin confirmar aviso/recepción sobre pedidos QA. El estado y la
publicación indicados aquí no son una aprobación visual ni de producción.

Pendientes tras una futura publicación autorizada: cliente y negocio en Android
e iPhone; confirmar aviso y permanencia en Listos; confirmar recepción e Historial;
volver/cerrar popups, contraste claro/oscuro, acuerdo y convivencia con pedidos
antiguos. No prometer recepción push; el trabajo de outbox sigue pendiente antes
de usuarios reales. `main` y producción permanecen intactos.

## Publicación QA autorizada — 2026-10-17

Bastián autorizó publicar este bloque tras las 836 pruebas y el build QA.
Se preparan únicamente las 21 rutas de código, pruebas e informe de este bloque.
Los cuatro documentos anteriores con cambios locales se preservan fuera del
commit. Destino exclusivo: Preview `zipco-app`, equipo `zipco-s-projects`, rama
`qa`, con Backend QA y el acceso habitual
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.

Se conserva el diagnóstico temporal mediante override exclusivo del despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`. No se cambian ajustes
globales, backend ni producción. Este registro de autorización no acredita aún
despliegue terminado ni pruebas móviles; el resultado se añadirá después.
