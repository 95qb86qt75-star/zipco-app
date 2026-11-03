# Una fuente de diseño por tarjeta

La pantalla selecciona las tarjetas mediante
`shared/layout/ProcessOrderCard.tsx`. Su lógica conserva el contrato existente.
Los archivos de entrada y los controladores no son diseños alternativos: componen
la única vista correspondiente.

## Cliente

- **Pendiente:** `customer/pending/CustomerPendingCard.tsx`.
- **Disponible, antes de continuar por WhatsApp:** `AvailableWhatsappDesign` en
  `../shared/availability-design/AvailabilityDesign.tsx`; estilos CliU18 en
  `availability-design.css`, acotados a `.zipco-av-available-wa`. Su conexión real
  vive en `shared/availability/AvailabilityFlowCard.tsx`.
- **Disponible, antes de continuar con retiro local:** `AvailablePickupDesign`
  en el mismo `AvailabilityDesign.tsx`, estilos `.zipco-av-available-pk` / `.zipco-avpk-*`.
  `AvailableRequestDesign` selecciona ambas modalidades; comparten estado, permiso
  y control de detalle. La decisión de reserva mantiene su diálogo real.
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
  Variante B Línea: solo pago previo advisory pendiente de confirmación. La
  selecciona CustomerReceiptFlowCardView mediante lineDesign; detalle en
  CustomerPickupLineDetails dentro de CustomerReceiptDetails.tsx. Otros estados
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

- **Inicial, producto aceptado por WhatsApp antes de consultar coordinación:**
  `BusinessInitialCard` en `shared/coordination/InitialCoordinationCardView.tsx`.
  Cabecera `business-initial` de CoordinationCardShell; estilos B·Vidrio `.zipco-bi`
  en coordination-flow.css. Solo business, no embedded y producto WHATSAPP.
  Controlador y ventanas compartidas intactos; cliente/servicios/retiro no cambian.

- **Disponibilidad confirmada, esperando cliente:**
  `business/availability/AvailabilityWaitingCard.tsx`.
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
  Opción A: BusinessInProgressCard solo para producto IN_PROGRESS por WhatsApp,
  no embedded. Cabecera business-progress de ProgressCardShell, estilos .zipco-bp.
  SlideToNotify y controlador permanecen reales; READY/recibido, servicios,
  retiro y embebidos conservan su composición.
- **Fuera de hora:** `shared/late-initial/LateInitialCard.tsx` y su CSS.
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
