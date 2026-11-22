# Una fuente de diseño por tarjeta

E205: el horario vencido se presenta dentro del diálogo canónico
`forms/proposal/ProposalNegotiation.tsx`, con campos en `ExpiredProposalSchedule.tsx`.
La política vive en `domain/expiredProposalSchedule.ts`; no es otra tarjeta de lista.

La pantalla selecciona las tarjetas mediante
`shared/layout/ProcessOrderCard.tsx`. Su lógica conserva el contrato existente.
Los archivos de entrada y los controladores no son diseños alternativos: componen
la única vista correspondiente.

## Retiro con pago previo pendiente (contrato E209)

E221, antes de existir una reserva/acuerdo: disponibilidad V3 LOCAL_PICKUP vencida
usa `shared/availability/AvailabilityScheduleCard.tsx` y `availability-schedule.css`,
conectados por AvailabilityFlowCard. Cliente solicita fecha; negocio renueva con
condiciones explícitas. Controlador `application/useAvailabilitySchedule.ts` y
API/normalizador dedicados. Activación solo por capacidad y resumen servidor;
agrupación única por categorías del participante. Tras renovar se reutilizan la
tarjeta y aceptación ordinarias de propuesta. No es otra implementación de la
reserva, del pago o de la contrapropuesta E205.

El selector horario de la solicitud del cliente y de Proponer alternativa tiene
una única implementación en `shared/time/TimePicker.tsx` y `time-picker.css`.
El formulario E221 conserva su nota y envío; la confirmación de hora propia de
las alternativas permanece en AlternativeChangeEditor.

E209 reserva con pago pendiente: `shared/reservations/PickupPrepaymentCard.tsx`
es la composición funcional de espera para ambos roles. Usa ReservationPanel
real, sin slider de preparación ni cierre por swipe de En curso. Selección por
`pickupPrepaymentFor`, contrato/capacidad/fase del servidor, antes de progreso.
Al confirmar y releer READY_FOR_PREPARATION se usa la tarjeta de progreso vigente.
La variante negocio AWAITING_PAYMENT_AND_HOLD usa el diseño blanco canónico y
`shared/reservations/pickup-prepayment.css`, importado por el manifiesto de tarjetas.
ReservationPanel expone piezas con render opcional y conserva sus ventanas reales.
`requests/shared/reservations/ReservationReasonChoices.tsx` presenta motivos en el
reasonDetail existente. Cliente y otras fases conservan su composición vigente.

E214: cliente AWAITING_PAYMENT_AND_HOLD usa `CustomerPrepaymentView.tsx` y
`customer-pickup-prepayment.css` (Aurora Pro). `useCustomerPaymentProof` posee la
declaración explícita y recuperación por UUID, separadas de `useReservation` y
del regreso WhatsApp. `customer-payment-proof-v1` es opt-in por capacidad de sesión;
el agrupador compartido presenta En espera solo tras declaración canónica.
La composición del negocio y las demás fases conservan sus propietarios.

E211: la espera de PREPAYMENT se ubica en Por responder cliente / Esperando
respuesta negocio. El acceso a WhatsApp se prepara en los controladores existentes
y se presenta mediante `shared/reservations/ReservationWhatsappNavigationHost.tsx`
montado en AppShell. `application/reservationWhatsappNavigation.ts` mantiene solo
estado UI temporal y relectura GET al regresar; no es otra tarjeta ni otro comando.
El host usa el acabado Aurora para Aclarar reserva únicamente desde la tarjeta
del negocio con pago/apartado pendientes; otros accesos mantienen su presentación.
appearance/returnFocus son metadatos locales efímeros, no un contrato de servidor.

## Retiro directo informativo (contrato E200)

`shared/local-pickup-information/LocalPickupInformationCard.tsx` y su CSS poseen
la consulta sin reserva admitida explícitamente por backend. Negocio: Historial
desde disponibilidad informada; cliente: decisión por la tarjeta Disponible
actual, después indicaciones/acuse y finalmente Historial con las mismas
instrucciones. No usa preparar/Listo/recepción física. Selección exclusivamente
por `requestProcess.localPickupInformation`, nunca solo por modalidad o importe.
La lógica de transporte/UUID permanece en `useCoordination` y la agrupación por
participante en `domain/requestStatusGrouping.ts`. Los pedidos antiguos conservan
sus propietarios actuales.

## Cliente

- **Propuesta por responder y conversación:** ProposalWaitingCard.tsx / .zipco-pw,
  ProposalChat.tsx y ProposalNegotiation.tsx / .zipco-pz; CSS en shared/proposal.
  Negocio conserva su rama. CustomerProposal es solo presentación de oferta,
  sin modificar contratos. Al aceptar usa ReservationChoiceFields variant=cards
  e hideSummary; contrapropuesta mantiene plain. Aviso sin reserva condicionado
  a NONE. Presupuesto decorativo acotado.

- **Pendiente:** `customer/pending/CustomerPendingCard.tsx`.
- **Disponible, antes de continuar (WhatsApp y retiro local):** una composición
  canónica `AvailableRequestDesign` en `../shared/availability-design/AvailabilityDesign.tsx`.
  Aurora Pro claro, estilos `.zipco-avpro*` en `availability-design.css`: misma
  cabecera, producto/total, oferta/modalidad, detalle y acciones siempre visibles.
  Distingue WhatsApp, sin reserva, FREE y PREPAYMENT con datos y controles reales.
  El contrato antiguo conserva nota, condiciones completas y acción de reserva;
  el simplificado mantiene la elección en ReservationDecisionDialog. Contacto
  visible antes de continuar cuando no lo recoge ese diálogo. Conexión real en
  `shared/availability/AvailabilityFlowCard.tsx`, sin cambios de contratos o callbacks.
  No contiene diseños anteriores alternativos. Otros estados conservan sus tarjetas.
- **Aceptado, antes de abrir WhatsApp:**
  `customer/whatsapp/initial/CustomerInitialCoordinationCard.tsx`.
  Su CSS y `CustomerStepsSheet.tsx` están en esa misma carpeta.
- **¿Coordinación lista?, confirmar Falta y negativa guardada:**
  `customer/whatsapp/CustomerCoordinationQuestionCard.tsx`.
  El detalle vive en `CustomerCoordinationDetail.tsx`; los estilos son
  `customer-coordination.css` y `customer-coordination-detail.css`.
  Diseño B de declined: banda/cabecera y aviso de actor en QuestionCard;
  recorrido/acciones, detalle único y opciones en CoordinationDetail.
  Mantener la identidad de Providers entre modos para no interrumpir WhatsApp.
- **En curso / listo / recibido por WhatsApp:**
  `customer/progress/CustomerWhatsappProgressCard.tsx`.
  Su estilo principal es `customer-receipt-card.css`.
  Esperando respuesta al primer Sí propio y preparando: rama `.zipco-wa-w`, detalle mediante
  `waitingDesign` en CustomerReceiptDetails; estilos propios en los dos CSS de
  progress. Una composición visual, con textos distintos según estado. Carril
  y controles conservan identidad al pasar a preparando. Listo/recibido conservados.
- **Retiro local, preparando / listo / recibido:**
  `customer/local-pickup/CustomerPickupCard.tsx` y `customer-pickup.css`.
  Variante B Línea: pago previo advisory pendiente de confirmación (`lineDesign`).
  Reserva gratuita advisory confirmada en IN_PROGRESS, sin modelo listo/recibido:
  `confirmedFreeDesign`, con boleto verde y CustomerPickupConfirmedDetails.
  Retiro sin reserva explícita en IN_PROGRESS y sin modelo listo/recibido:
  `arrivalDesign` reutiliza esa composición con indicaciones y Por orden de llegada,
  sin boleto de reserva. No altera LocalPickupInformationCard del contrato E200.
  Las selecciona CustomerReceiptFlowCardView; detalles en CustomerReceiptDetails.tsx. Otros estados
  usan la composición estándar. Reserva y ventanas siguen siendo componentes reales.
- **Detalle de los pedidos de producto:**
  `customer/progress/CustomerReceiptDetails.tsx`,
  `customer-receipt-details.css` y los controles compartidos de disponibilidad
  indicados abajo. Es parte del diseño completo; no entregar únicamente la
  cabecera al pedir un rediseño del retiro.
  El default corresponde a WhatsApp; `CustomerPickupDetails` es la composición de
  retiro con pestañas, cuyos estilos viven en `customer/local-pickup/customer-pickup.css`.
- **Servicios en curso:**
  `customer/service/CustomerServiceProgressCard.tsx`, con sus estilos en esa carpeta.
  Conserva el recorrido de servicios; no es una versión antigua del producto.

`CustomerReceiptFlowCardView.tsx` compone el retiro o WhatsApp con los diálogos
reales. Su controlador está en `customer/progress/application`. La consulta de
coordinación usa `customer/whatsapp/application`; las decisiones de negocio y
permisos siguen en los hooks de `requests/application` y en la API.

## Negocio

- **Agenda de En curso (lista):** screen/components/BusinessAgendaToolbar.tsx,
  BusinessAgendaRow.tsx y business-agenda.css; reglas puras domain/businessAgenda.ts.
  Solo Mi Negocio/Pedidos/active. Envuelve tarjetas reales sin duplicarlas;
  screen/application/useAgreedScheduleResolver.ts obtiene horarios del acuerdo
  con lectura compartida application/sharedAgreementRead.ts y useAgreement.
  No usar fechas originales ni el resumen opcional de propuesta como acuerdo.

- **Inicial, producto aceptado por WhatsApp antes de consultar coordinación:**
  `BusinessInitialCard` en `shared/coordination/InitialCoordinationCardView.tsx`.
  Cabecera `business-initial` de CoordinationCardShell; estilos B·Vidrio `.zipco-bi`
  en coordination-flow.css. Solo business, no embedded y producto WHATSAPP.
  Controlador y ventanas compartidas intactos; cliente/servicios/retiro no cambian.

- **Disponibilidad confirmada, esperando cliente:**
  `business/availability/AvailabilityWaitingCard.tsx`.
  Diseño CliU27 único para WhatsApp/retiro; estilos exclusivos `.zipco-aw*`
  en `shared/layout/availability-card-foundation.css`. Error siempre visible,
  fotos y confirmación de retirada reales. Controlador sin cambios.
- **Consulta de coordinación y respuesta negativa:**
  `business/coordination/BusinessCoordinationWaitingCard.tsx` y
  `BusinessPendingCoordinationDetail.tsx`; estilo `business-coordination-pending.css`.
  Diseño B de `declined`: cabecera/aviso en WaitingCard, recorrido/acciones/detalle
  y menú flotante en PendingDetail. Condiciones y opciones usan sus controles reales;
  sin cambios en los controladores ni las demás variantes.
  Consulta B (question/confirm/ownPending): cabecera en WaitingCard; detalle
  BusinessAskDetail en shared/coordination/InitialCoordinationCardView.tsx,
  estilos business-ask en coordination-query*.css. Condiciones y acciones reales.
- **Coordinación inicial compartida donde la composición es idéntica:**
  `shared/coordination/InitialCoordinationCardView.tsx`.
  La variante inicial del cliente producto se separa en su carpeta indicada arriba.
- **Preparando / notificar listo:**
  `business/progress/BusinessProgressCardView.tsx` y sus CSS.
  BusinessInProgressCard compartida por producto IN_PROGRESS por WhatsApp o retiro
  local, no embedded. Cabecera business-progress de ProgressCardShell con channel
  real para franja/icono; estilos .zipco-bp compartidos.
  SlideToNotify y controlador permanecen reales; READY/recibido, servicios,
  pedidos sin modalidad y embebidos conservan su composición. Retiro mantiene
  AvailabilityPostActions y ReservationPanel reales sin el aplanado visual del pie
  exclusivo de WhatsApp. No confundir con localPickupInformation.
- **Fuera de hora:** `shared/late-initial/LateInitialCard.tsx` y su CSS.
  Cliente AWAITING_CUSTOMER: `CustomerQuery` (CliU28), estilos exclusivos
  `.zipco-late-card--query` / `.zipco-lq-*`. Negocio y STILL_NEEDED conservados.
  Controlador, ventanas y recuperación permanecen compartidos y reales.
- **Propuesta:** `shared/proposal/ProposalWaitingCard.tsx` y su CSS.
- **Historial:** `shared/history/CompactHistoryList.tsx`, `ProcessHistoryCard.tsx`;
  las listas de pedidos y cotizaciones y sus normalizadores tienen archivos propios.

## Dependencias visuales que se conservan

- `shared/layout/DetailReveal.tsx`: pliegue y apertura accesibles.
- `shared/layout/availability-card-foundation.css`: superficie, miniatura y anillo.
- `shared/layout/detail-chevron.css`: control compacto de detalle.
- `shared/coordination/CoordinationVisualPrimitives.tsx`: pasos y efectos comunes.
- `shared/availability/AvailabilityPostActionsView.tsx`: controles de retiro,
  permiso y reserva; su controlador conserva las acciones existentes.
  `AvailabilityPostActions.tsx` admite un render opcional de piezas para el retiro
  del cliente; el default sigue compartido. `PickupInstructions.tsx` es la única
  fuente del bloque de instrucciones para ambas presentaciones.
- `../shared/feedback/StatusRail.tsx`, `ReadyPanel.tsx` y sus CSS: progreso y
  recepción compartidos entre retiro y WhatsApp.
- `../shared/conditions/CoordinationSheets.tsx`: Condiciones aceptadas y las
  otras ventanas reales; conservarlas salvo un rediseño explícito de esa ventana.
- `../shared/product-preview/ProductPreviewControl.tsx`: miniatura y producto.

Los manifiestos `shared/layout/availability-card-styles.css` y
`coordination-card-styles.css`, más `src/styles/index.css`, solo ordenan imports.
No contienen una segunda tarjeta. No recrear los archivos CSS retirados al
integrar paquetes cuyo nombre anterior era `coordination-v2.css`.
