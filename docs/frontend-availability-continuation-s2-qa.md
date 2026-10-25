# Disponibilidad y continuación S2 — Frontend QA

## Alcance y coordinación

Clasificación: frontend + backend. Esta entrega integra únicamente frontend con
el contrato S2 ya implementado y publicado por backend; no modifica backend,
migraciones ni Railway. Contrato leído:
`C:/dev/zipco-backend-qa/docs/testing/availability-continuation-v1-implementation-qa.md`.
Backend `41f62ed26492b7857904917d001a2d33f30a8371`: estado GitHub Railway
success comprobado; lectura de la raíz QA HTTP 200. Esto no equivale a una
prueba autenticada completa de los nuevos endpoints.

El usuario aprobó preparar el recorrido completo 3–5 antes de activar nuevas
solicitudes. Las pantallas 1 y 2 ya cuentan con su aprobación física previa.
Esta entrega conserva sus diseños y cambia la creación de productos a S2.
Los pedidos existentes siguen su contrato legacy, incluso si registraron la
preferencia inicial S1. No se infiere S2 a partir de fechas o preferencias.

## Recorrido real de la app

| Paso | Actor y categoría | Estado del servidor | Acción y resultado |
| --- | --- | --- | --- |
| 1 | Cliente, catálogo → resumen del pedido | Creación nueva | Consulta y casilla inicialmente marcada; enviar crea S2 sin acuerdo ni permiso efectivo. |
| 2 | Cliente, Mis Pedidos → Pendientes | AWAITING_BUSINESS_RESPONSE | Tarjeta aprobada EN ESPERA; permite ver detalle y anular antes de respuesta. |
| 3 | Negocio, Mi Negocio → Pendientes | AWAITING_BUSINESS_RESPONSE | NUEVO PEDIDO; Confirmar disponibilidad abre el selector. Alternativa y rechazo permanecen operativos. |
| 4 | Negocio, selector local | Sin transición mientras se edita | WhatsApp o retiro; retiro admite mensaje, horario/dirección y permiso propio opcional. Guardar confirma disponibilidad sin acuerdo. |
| 5 | Cliente, Mis Pedidos → Por responder; negocio → Esperando respuesta | AWAITING_CUSTOMER_CONTINUATION | DISPONIBLE con plan exacto. Cliente continúa o declina; negocio puede retirar disponibilidad. |
| Continuar WhatsApp | Ambos, Por coordinar | COORDINATION_PENDING | Se crea el acuerdo y se evalúan consentimientos propios. No se construye ningún enlace local. |
| Continuar retiro | Ambos, En curso | IN_PROGRESS | Etiqueta D48: Pendiente de retiro en el local. No acredita reserva ni pago. |
| Cancelar retiro | Cliente o negocio, antes de Listo | CLOSED | Motivo obligatorio, Historial; conserva el acuerdo. |

Las tarjetas posteriores mantienen su diseño. Se agregan solamente la
presentación del plan de retiro, cancelación y controles del permiso propio
exigidos por S2. Abrir WhatsApp requiere que el servidor lo permita y devuelva
la navegación; ambos consentimientos efectivos siguen siendo necesarios.
No se entrega teléfono ni enlace antes del acuerdo. El botón anticipado de la
maqueta de retiro permanece deshabilitado.

## Endpoints, cuerpos y compatibilidad

- Creación: `POST /orders/availability-requests`, productos de precio fijo;
  cuerpo actual de creación más `customerContactPreference: { allowed,
  textVersion: 'availability-customer-whatsapp-v1' }` obligatorio. Se verifica
  `flowContract: 'AVAILABILITY_V1'` en la respuesta. Servicios/cotizaciones
  conservan sus rutas actuales.
- Lecturas de cliente/negocio y recuperación: `GET /orders/my-orders` y
  `GET /orders/business/:businessId`, con `?processContract=availability-v1`.
- Propuestas/acuerdo: `GET /request-processes/:id/proposals` y
  `GET /request-processes/:id/agreement`, con la misma opción de contrato.
- Nuevas acciones `POST /request-processes/:id/actions/confirm-availability`,
  `continue-request`, `decline-request`, `withdraw-availability`,
  `cancel-pickup` y `revoke-contact-consent`.
- Confirmar: `expectedVersion`, `proposalId`, `fulfillment` según camino.
  WhatsApp incluye consentimiento propio del negocio con versión
  `availability-business-whatsapp-v1`. Retiro sin contacto lo omite.
- Continuar: versión, propuesta e `availabilityConfirmationId` exactos,
  `conditionsAccepted: true` y preferencia final explícita del cliente.
  Fecha vencida requiere confirmación adicional `acceptPastSchedule: true`.
- Declinar/retirar: versión, propuesta y confirmación exactas. Cancelar retiro:
  versión y `reasonDetail` recortado, entre 3 y 1000 caracteres Unicode.
- Autorizar/abrir WhatsApp S2 agrega `consentTextVersion:
  'availability-contact-v1'`; el cuerpo legacy no cambia. Revocar retira solo
  el permiso del actor, sin cancelar ni cambiar la etapa del pedido.
- Alternativas/finales usan las rutas actuales y adjuntan `fulfillment`.
  Contrapropuesta hereda el plan y registra la preferencia del cliente.
  Aceptar propuesta registra su decisión final; aceptar contrapropuesta
  incluye consentimiento propio del negocio cuando el plan permite contacto.
  La aceptación ya crea el acuerdo y dirige a coordinación o retiro.
- Recibos verifican proceso, versión, propuesta, estado, acuerdo y plan.
  Después se relee la lista autorizada para recuperar `allowedActions`.
  No se inventan acciones ni se transforman pedidos legacy al flujo nuevo.
- Reintentos conservan clave y huella del cuerpo. No se persisten cuerpos,
  teléfonos ni textos libres en el almacén de intenciones de disponibilidad.
  Un recibo confirmado no dispara otro POST; una lectura autorizada de versión
  superior permite reconciliarlo. Cambio de sesión aborta tareas pendientes.
- FLOW_CONTRACT_REQUIRED muestra actualización de app; conflictos de versión
  o disponibilidad piden releer. No se ocultan listas ni se reintenta sin fin.

## Archivos principales

- `src/app/screens/CheckoutScreen.tsx`, `createOrderApi.ts`: creación S2.
- `src/app/screens/RequestsScreen.tsx`, `requests/useRequests.ts`,
  `requestStatusGrouping.ts`, `requestAttentionSummary.ts` y
  `src/app/notifications/BusinessNotificationMonitor.tsx`: lecturas, categorías
  y actualización de la pantalla del actor.
- `requests/AvailabilityFlowCard.tsx`, `availability-design/AvailabilityDesign.tsx`
  y su CSS: tarjetas 3/5 y selector 4 adaptados a datos y acciones reales.
- `requests/availabilityContract.ts`, `availabilityApi.ts`,
  `availabilityIntent.ts`, `useAvailability.ts`, `availabilityChoice.ts`:
  contrato, mutaciones, recibos, reintentos y elección de camino.
- `requests/AvailabilityPlanSummary.tsx`, `AvailabilityPostActions.tsx`:
  presentación del plan, cancelación y permiso propio.
- `requests/ProcessOrderCard.tsx`, `ProcessHistoryCard.tsx`,
  `BusinessCoordinationCard.tsx`, `BusinessProgressCard.tsx`,
  `CustomerProgressCard.tsx`: selección y continuidad del flujo.
- `requests/ProposalNegotiation.tsx`, `PendingAlternativeActions.tsx`,
  `ProposalChat.tsx`, `proposalApi.ts`, `proposalContract.ts`: negociación S2
  completa y conservación del camino por propuesta.
- `requests/requestProcess.ts`, `requestProcessApi.ts`, `agreement.ts`,
  `useAgreement.ts`, `AcceptedConditions.tsx`, `AgreementSheet.tsx`,
  `coordinationApi.ts`, `coordinationIntent.ts`, `useCoordination.ts`,
  `requestProcessErrors.ts`, `loadOrdersDiagnostics.ts`: lectura estricta,
  acuerdo inmutable, compatibilidad y errores seguros.
- Pruebas nuevas: `requests/availabilityContract.test.ts`, fixtures sintéticas
  `availabilityFixtures.ts` y `scripts/check-availability-flow.mjs`.
  Pruebas existentes actualizadas para la opción de lectura S2 y la ruta nueva.

Las rutas bajo `requests/` son relativas a `src/app/screens/requests/`.
No se copian controles de maqueta ni se requiere entrar a una galería de diseño.

## Validación

- **1339 pruebas / 112 archivos aprobados**; 23 casos dedicados al contrato S2.
- Build QA/PWA aprobado; advertencia habitual de tamaño del bundle conservada.
- **9 recorridos Chrome con HTTP simulado**, usando CheckoutScreen y tarjetas
  reales: retiro a 320/390/430 px, WhatsApp con preferencia final desmarcada,
  declinar sin acuerdo, retiro de disponibilidad por negocio, aceptación de
  alternativa para retiro, contrapropuesta WhatsApp aceptada por negocio y
  propuesta final que cambia WhatsApp a retiro.
- Regresiones de pantallas 1 y 2 aprobadas en 320/390/430 px. Incluyen reintento
  de creación con mismo cuerpo/clave, casilla, holograma único, notificaciones,
  detalle, anulación y animación con respeto a movimiento reducido.
- Capturas inspeccionadas en `node_modules/.cache/availability-flow`.
- Cero mutaciones contra pedidos reales durante estas pruebas. Chrome con
  viewport móvil no sustituye la prueba en Safari/iPhone o Android físicos.
- `git diff --check` aprobado. Main conserva HEAD
  `8295ab8c6024ab20851ebd371308d2f299b4668f`.

## Publicación y revisión pendiente

Base frontend `6acb167`, rama `qa`. Commit/push de la integración GitHub y estado
Vercel READY pendientes al preparar este documento. Conservar identidad anterior
del repositorio; sin cambiar correo global, usar alias de Apple o reescribir
historial. Alias habitual:
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.

Para comprobar pantalla 3, crear una **solicitud nueva** desde el catálogo de
productos QA. Un pendiente antiguo puede mostrar Aceptar pedido por compatibilidad.
Luego revisar Mi Negocio → Pendientes → Confirmar disponibilidad → camino;
Mis Pedidos → Por responder → continuar o declinar. Probar WhatsApp y retiro
en solicitudes separadas y verificar el resultado en ambos teléfonos.

La conformidad física de pantallas 3–5 y los endpoints autenticados reales
quedan pendientes del usuario después de publicar. No declarar aprobación ni
activar producción por resultados de pruebas sintéticas. Main y producción
no se modificaron. Tres documentos locales ajenos sin seguimiento se conservan
fuera de este commit.
