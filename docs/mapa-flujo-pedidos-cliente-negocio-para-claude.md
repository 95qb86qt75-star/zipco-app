# Mapa del flujo actual de pedidos: cliente y negocio

Fecha de revisión: 24 de octubre de 2026. Frontend QA: rama `qa`, commit `56fb0e97a66d24befa75889b50d2c5cd7bba396c`.

Este documento describe el comportamiento ACTUAL, no implementa el rediseño. No se modificó código de la aplicación ni datos. Las líneas corresponden a esta revisión; cambiarán si se edita el código. Backend consultado mediante código local, sin verificar el despliegue activo de Railway.

## 1. Cómo leer estados, categorías y pantallas

- Raíz frontend: `C:\dev\zipco-app-qa\`.
- En las tablas siguientes, `requests/Archivo.tsx` significa `src/app/screens/requests/Archivo.tsx`.
- `RequestsScreen.tsx` significa `src/app/screens/RequestsScreen.tsx`.
- `order.status` y `requestProcess.state` son distintos. `accepted` NO implica necesariamente En curso si existe RequestProcess.
- Para pedidos con proceso, `requestProcess.state` decide la categoría. El frontend además respeta `allowedActions` del actor autenticado.
- `folded`, `phase`, los hologramas, la pestaña seleccionada y las marcas de regreso de WhatsApp son presentación local; no sustituyen el estado del servidor.
- Este mapa se centra en pedidos con RequestProcess. Los registros antiguos sin proceso tienen tarjetas y reglas alternativas. Cotizaciones (`requestType='quotes'`) tienen otra rama y no deben confundirse con pedidos de productos o servicios.

### Mapa de categorías actual

| Momento | Order.status | RequestProcess.state | Cliente: Mis Pedidos | Negocio: Mi Negocio |
|---|---|---|---|---|
| Cliente acaba de enviar | `pending` | `AWAITING_BUSINESS_RESPONSE` | Pendientes | Pendientes |
| Negocio envía alternativa | `alternative_proposed` | `AWAITING_CUSTOMER_DECISION` | Por responder | Esperando respuesta |
| Cliente envía contrapropuesta | `alternative_proposed` | `AWAITING_BUSINESS_COUNTER_RESPONSE` | Por responder | Esperando respuesta |
| Negocio envía propuesta final | `alternative_proposed` | `AWAITING_CUSTOMER_FINAL_DECISION` | Por responder | Esperando respuesta |
| Se acepta original o propuesta | `accepted` | `COORDINATION_PENDING` | Coordinación | Por coordinar |
| Se registra primera apertura autorizada de WhatsApp | `accepted` | `COORDINATING` | Coordinación | Por coordinar |
| Negocio confirma comenzar | `accepted` | `IN_PROGRESS` | En curso | En curso |
| Negocio avisa que está listo | `ready` | `READY` | Listos | Listos para registros con proceso READY |
| Cliente confirma aviso | `ready` | `READY`, aviso confirmado | Listos | Listos |
| Cliente confirma recepción | `completed` | `COMPLETED` | Historial | Historial |
| Cualquiera anula durante coordinación | `cancelled` | `COORDINATION_CANCELLED` | Historial | Historial |
| Cliente anula antes de primera respuesta | `cancelled` | `CLOSED`, cierre de anulación previa | Historial | Historial |
| Negocio rechaza original o parte rechaza propuesta | `rejected` | `CLOSED`, cierre correspondiente | Historial | Historial |

**No confundir categoría con turno:** las tres rondas de negociación se agrupan en `waiting` para ambos. Que al cliente le figure Por responder no significa que pueda responder en todas las rondas. El turno efectivo lo determina `proposalAllowed` y los permisos del servidor.

| Regla | Archivo y líneas |
|---|---|
| Categoría según proceso; prioridad sobre estado antiguo | `requests/requestStatusGrouping.ts:9-35` |
| Filtro real de registros por categoría | `requests/requestStatusGrouping.ts:58-76` |
| Etiquetas de estado de tarjeta | `requests/requestProcess.ts:120-134` |
| Etiquetas de categorías del negocio | `requests/orderTabs.ts:7-15` |
| Selección de categorías de pedidos cliente/negocio | `RequestsScreen.tsx:1006-1042` |
| Registros de cliente o negocio | `RequestsScreen.tsx:136` |
| Aplicación de filtro por categoría a ambas listas | `RequestsScreen.tsx:266-271` |
| Vista separada por rol y tipo de solicitud | `RequestsScreen.tsx:85-86`, `352-355` |
| Resúmenes/atención pueden modificar qué lista se muestra | `RequestsScreen.tsx:286-311`; `requests/requestAttentionSummary.ts:21-55` |

## 2. Cliente envía una solicitud nueva

### Envío y datos

`src/app/screens/CheckoutScreen.tsx:216-233`: prepara negocio, ítems de catálogo y cantidades, nota y foto de referencia; envía `POST /orders`; muestra confirmación usando el total devuelto por el servidor.

`CheckoutScreen.tsx:72-78`, `701-747`: confirmación posterior al envío y llamada a `onOrderComplete`. Esa confirmación no es una aceptación del negocio.

Evidencia de creación del proceso en código backend: `C:\dev\zipco-backend-qa\src\request-process\fixed-order-foundation.service.ts:23-62`: crea `AWAITING_BUSINESS_RESPONSE`, versión 1, y propuesta `ORIGINAL_REQUEST` con productos/servicio, cantidades, precios, nota, foto y horario.

### Qué ve el cliente en Mis Pedidos > Pendientes

- Tarjeta de `ProcessOrderCard`, cabecera Aurora: nombre e imagen del negocio, monto solicitado, productos y cantidades, estado «Pendiente de respuesta» y «Esperando la primera respuesta del negocio.».
- Puede abrir «Tu pedido» / «Revisar pedido». El detalle incluye líneas de productos y subtotales, nota si existe, total, y foto válida si existe. Se muestra la disponibilidad solicitada.
- No ve Aceptar pedido. Puede anular si el servidor permite `CANCEL_PENDING_REQUEST`.
- Inicialmente el detalle está plegado; una apertura desde notificación puede desplegarlo.

| Qué decide o muestra | Archivo y líneas |
|---|---|
| Cliente con proceso usa ProcessOrderCard | `requests/MyOrderCard.tsx:38` |
| Listado, fecha y montaje de cada tarjeta cliente | `requests/MyOrdersTab.tsx:59-84` |
| Estado inicial, datos originales y perspectiva del encabezado | `requests/ProcessOrderCard.tsx:35-61` |
| Productos, cantidades, subtotales, nota, total y foto del detalle | `requests/ProcessOrderCard.tsx:74-89` |
| Mensaje de espera inicial del cliente | `requests/ProcessOrderCard.tsx:91-97` |
| Cabecera y disponibilidad | `requests/ProcessOrderCard.tsx:169-174` |
| Apertura «Tu pedido» y detalle | `requests/ProcessOrderCard.tsx:175-190` |
| Anulación exclusiva del cliente mientras espera respuesta | `requests/ProcessOrderCard.tsx:191`; `requests/PendingCancellationActions.tsx:19-45` |
| Dibujo del encabezado, estado, precio y productos | `requests/OrderCardAurora.tsx:6-32` |

### Qué ve el negocio en Mi Negocio > Pendientes

- La misma base ProcessOrderCard con `business=true`: nombre e imagen del cliente, monto «Solicitado», productos y cantidades, estado «Nuevo pedido» y «Revisa la solicitud y responde al cliente.».
- Plegada muestra «Pedido del cliente» / «Revisar y responder».
- Abierta muestra detalle original, nota y foto si existen, y las acciones permitidas para aceptar, proponer alternativa o rechazar. No son acciones del cliente.

| Qué decide o muestra | Archivo y líneas |
|---|---|
| Negocio con proceso usa ProcessOrderCard con business=true | `requests/BusinessOrderCard.tsx:44` |
| Estado de expansión controlado por lista del negocio | `requests/BusinessOrdersTab.tsx:64-73`, `102-139` |
| Identidad cliente y etiqueta «Nuevo pedido» | `requests/ProcessOrderCard.tsx:56-61` |
| Detalle y botón Aceptar pedido condicionado a permisos/productos | `requests/ProcessOrderCard.tsx:74-89` |
| Resumen plegado del negocio | `requests/ProcessOrderCard.tsx:175-176` |
| Contenido abierto, propuesta alternativa y rechazo | `requests/ProcessOrderCard.tsx:192-202` |
| Modal de confirmar aceptación directa | `requests/BusinessOrdersTab.tsx:169-183`; `requests/OrderActionModal.tsx:69-74`, `108-129` |
| Ejecución de aceptación original, actualización y holograma | `requests/useRequests.ts:290-309` |
| Tras aceptación original selecciona coordinación | `RequestsScreen.tsx:1430-1438` |

## 3. Variante: negociación antes de aceptar

| Turno | Estado | Quién actúa | Qué muestra/permite |
|---|---|---|---|
| Original pendiente | `AWAITING_BUSINESS_RESPONSE` | Negocio | Aceptar original, proponer alternativa o rechazar original según permisos |
| Alternativa del negocio | `AWAITING_CUSTOMER_DECISION` | Cliente | Revisar, aceptar, rechazar o hacer su única contrapropuesta |
| Contrapropuesta del cliente | `AWAITING_BUSINESS_COUNTER_RESPONSE` | Negocio | Aceptar, rechazar o proponer alternativa final |
| Propuesta final del negocio | `AWAITING_CUSTOMER_FINAL_DECISION` | Cliente | Aceptar o rechazar; no otra contrapropuesta |

- `requests/proposalContract.ts:73-81`: permisos por estado y rol, comprobando `allowedActions` y ausencia de acuerdo.
- `requests/ProcessOrderCard.tsx:47-55`, `198`: identifica negociación y monta ProposalNegotiation. Durante negociación la cabecera usa monto de `proposalSummary` cuando existe; no muestra como acuerdo una ronda todavía pendiente.
- `requests/ProposalNegotiation.tsx:22-25`: nombres de acciones y rondas.
- `requests/ProposalNegotiation.tsx:123-124`: acciones disponibles de la lectura vigente.
- `requests/ProposalNegotiation.tsx:180-204`: botón de revisar y panel de conversación. `turn='mine'` si hay acciones; de lo contrario `turn='wait'`.
- `requests/ProposalNegotiation.tsx:208-260`: confirmaciones y botones según turno. El dibujo detallado de las rondas está en `requests/ProposalChat.tsx`.

### Variante importante que no debe omitirse del rediseño

Al aceptar una propuesta del negocio (cliente) o una contrapropuesta (negocio) YA existe una tarjeta «Todo listo para coordinar tu pedido» con:

- «Aceptar y autorizar contacto».
- «Solo aceptar · autorizo después».
- «Volver».

No es el mismo camino de confirmación de aceptar directamente el original.

| Paso | Archivo y líneas |
|---|---|
| Seleccionar aceptar abre la tarjeta | `requests/ProposalNegotiation.tsx:220-229`, `250-260` |
| Textos, resumen y elección con/sin consentimiento | `requests/AcceptAuthorizeCard.tsx:37-56` |
| Envía aceptación exacta y publica la elección local | `requests/ProposalNegotiation.tsx:126-173` |
| Verifica evento de propuesta aceptada | `requests/proposalAcceptance.ts:16-29` |
| Selecciona coordinación en el rol correcto | `RequestsScreen.tsx:642-646` |
| Si se eligió autorizar, inicia seguimiento tras aceptación | `requests/AcceptedProposalHost.tsx:28-38` |
| Lee pedido actual y comprueba consentimiento/permisos | `requests/AcceptedProposalHost.tsx:61-80` |
| Ejecuta AUTHORIZE_CONTACT como segunda operación | `requests/AcceptedProposalHost.tsx:98-118` |
| Fallo de consentimiento no deshace aceptación; ofrece recuperación | `requests/AcceptedProposalHost.tsx:122-135` |

Son dos operaciones durables, no un consentimiento implícito en aceptar. Si se elige solo aceptar, sigue faltando la autorización propia y se presenta el paso correspondiente en coordinación.

## 4. Después de aceptar: coordinación para ambos

Estado `COORDINATION_PENDING`, Order.status `accepted`. Cliente: Coordinación. Negocio: Por coordinar.

- `requests/ProcessOrderCard.tsx:109-122`: ambos usan BusinessCoordinationCard (el nombre del archivo no significa que sea exclusivo del negocio).
- `requests/ProcessOrderCard.tsx:113-121`: cantidades, nombre/descripción, total, horario y nota/explicación proceden del acuerdo aceptado.
- `requests/BusinessCoordinationCard.tsx:57`: plegada al montar normalmente; una apertura de notificación puede desplegarla.
- `requests/BusinessCoordinationCard.tsx:151-165`: encabezado, Condiciones aceptadas, «Pedido aceptado» o «Propuesta aceptada», contraparte y «Todo listo para coordinar el pedido.».
- `requests/BusinessCoordinationCard.tsx:231-238`: fila resumida cuando está plegada.

### Condiciones y Acuerdo completo

- `BusinessCoordinationCard.tsx:154-157`: flecha abre Condiciones aceptadas.
- `BusinessCoordinationCard.tsx:242-247`: conecta ConditionsSheet y AgreementSheet, con perspectiva business/customer.
- `requests/CoordinationSheets.tsx:32-69`: resumen, fecha, nota/explicación y Ver acuerdo completo.
- `requests/AgreementSheet.tsx`: tarjeta completa compartida; recibe perspectiva y datos del acuerdo, no autoriza contacto ni cambia estados.

### Qué mostrar según los consentimientos

El consentimiento «propio» se elige por rol. Su verdad procede del servidor; `phase` solo organiza la presentación.

| Situación del actor | Interfaz actual | Líneas en BusinessCoordinationCard.tsx |
|---|---|---|
| No autorizó su contacto | Negocio: «Autorizo comenzar coordinación». Cliente: «Autorizo iniciar coordinación». Explica compartir solo su propio teléfono para ese pedido | 184-194 |
| Cliente elige Ahora no | Oculta su solicitud localmente y ofrece «Revisar autorización de contacto». No autoriza ni anula en servidor | 185, 192 |
| Está enviando autorización | «Autorizando contacto…»; acciones bloqueadas | 103-108, 187-188 |
| Autorización verificada, animación pendiente | «Coordinación autorizada» y «Preparando WhatsApp…» | 110-130, 195-214 |
| Autorizó, pero otro no | Botón de WhatsApp deshabilitado; «Esperando autorización de contacto del cliente/del negocio.» | 78-79, 215-219 |
| Ambos autorizados y servidor habilita OPEN_WHATSAPP | «Iniciar coordinación por WhatsApp» habilitado | 74-79, 132-135, 215-219 |
| Operación pendiente o lectura de recuperación necesaria | Muestra actualizar/reintentar; no permite otra acción normal | 169-177 |

- `requests/coordinationApi.ts:58-76`: consentimiento propio y autorización efectiva de cada acción.
- `requests/BusinessCoordinationCard.tsx:23-24`, `119-130`: espera visual de 3,9 s (0,5 s con movimiento reducido) tras verificar la autorización; holograma de autorización puede programarse 2,9 s después del desbloqueo. No son esperas del servidor.
- `requests/useCoordination.ts:114-138`: POST confirmado seguido de GET autoritativo. Fallar el GET no revierte ni debe repetir el POST confirmado.

## 5. Abrir WhatsApp y volver

- `requests/coordinationApi.ts:7-13`, `40-55`, `88-90`: endpoint y cuerpo de las acciones.
- AUTHORIZE_CONTACT / OPEN_WHATSAPP: `{expectedVersion, consentAccepted:true}`.
- START_WORK: `{expectedVersion}`. Todas llevan autenticación y clave de idempotencia.
- `requests/coordinationApi.ts:125-132`: actualiza pedido mediante GET de lista del actor.
- `requests/useCoordination.ts:167-186`: valida respuesta/permiso vigente, presenta redirección, espera 3 s y navega; limpia holograma antes de salir.
- `requests/ActionHologram.tsx:50-56`, `68-73`: textos y duraciones. La redirección se corta explícitamente al navegar aunque el host tenga otra duración general.

**Efecto servidor:** primera acción OPEN_WHATSAPP válida cambia COORDINATION_PENDING a COORDINATING; sigue en la categoría de coordinación para ambos. No pasa todavía a En curso. No prueba conversación, mensaje enviado ni acuerdo de pago.

### Diálogo posterior exclusivo del negocio

- `requests/BusinessCoordinationCard.tsx:81-85`: solo negocio, proceso COORDINATING y START_WORK permitido.
- `requests/useStartWorkPrompt.ts:14-32`: espera elegibilidad, documento visible y ausencia de otros diálogos/hologramas.
- `requests/whatsappReturn.ts:10-12`, `20-23`, `40-46`, `54-70`: espera 4 s, registra salida/regreso y aplaza 30 min si se cierra. No guarda número ni URL. Sin marca local también puede resultar elegible; no demuestra que ese actor conversó.
- `requests/CoordinationSheets.tsx:74-93`: «¿Coordinación lista por WhatsApp?», descripción del pago/entrega o servicio, «Sí, comenzar», «No, aún no», «Guardando…».
- `requests/BusinessCoordinationCard.tsx:94-99`: No/cerrar aplaza localmente; Sí ejecuta START_WORK.
- `requests/BusinessCoordinationCard.tsx:251-255`: monta el diálogo solo para negocio.

## 6. En curso

Estado IN_PROGRESS, Order.status sigue accepted. Ambos lo clasifican en En curso al recibir el estado del servidor; pertenecer a una categoría no significa que siempre se seleccione automáticamente esa pestaña.

| Lado | Qué se muestra | Archivo y líneas |
|---|---|---|
| Cliente | CustomerProgressCard: negocio, total acordado, condiciones, «Preparando tu pedido», aviso de que el negocio notificará; fecha/cuenta regresiva si futura, programada y tarjeta abierta; Escribir al negocio si permitido | `requests/ProcessOrderCard.tsx:130-140`; `requests/CustomerProgressCard.tsx:138-144`, `152-199`, `235` |
| Negocio | BusinessProgressCard: cliente, monto acordado, condiciones, «Preparando el pedido», tracker Aceptado/Coordinado/Preparando/Listo, deslizador para avisar | `requests/ProcessOrderCard.tsx:143-153`; `requests/BusinessProgressCard.tsx:62-78`, `87-117`, `128-130` |

Ambas tarjetas suelen montar plegadas, salvo condiciones de notificación/transición: `CustomerProgressCard.tsx:92-108`; `BusinessProgressCard.tsx:46-54`.

## 7. Listos, confirmación de aviso y recepción

| Momento | Cliente | Negocio | Ubicación |
|---|---|---|---|
| Negocio completa deslizador | Aún depende de lectura actualizada | Envía MARK_READY, muestra fase de envío y presentación verificada | `requests/BusinessProgressCard.tsx:68-74`, `128-130`; `requests/notifiedRecently.ts` |
| READY, aviso no confirmado | «¡Tu pedido está listo!», Confirmar aviso; recepción visible pero deshabilitada con «Primero confirma el aviso.» | «Pedido notificado», «Esperando confirmación del cliente» | `requests/CustomerProgressCard.tsx:133-166`, `213-231`; `requests/BusinessProgressCard.tsx:78-82`, `131-140` |
| Cliente confirma aviso | READY sigue igual; «Aviso confirmado», «Pendiente de recepción.»; recepción habilitada | «El cliente confirmó el aviso», «Pendiente de retiro.» | `requests/CustomerProgressCard.tsx:217-229`; `requests/BusinessProgressCard.tsx:137` |
| Cliente confirma recepción | COMPLETED, presentación transitoria y luego Historial | Historial cuando recibe estado actualizado | `requests/CustomerProgressCard.tsx:100-108`, `145-149`, `221-233`; `requests/useCoordination.ts:144-164`; `requests/requestStatusGrouping.ts:19` |

- `requests/CustomerReceiptDialog.tsx:26-41`: textos y confirmación explícita de aviso/recepción.
- `requests/useReadyTransitions.ts:35-75`: anima solo transición observada IN_PROGRESS -> READY con versión mayor; no la primera carga de un pedido ya listo. Tras holograma programa Listos, rebote y globo.
- `RequestsScreen.tsx:137-142`: callback que selecciona Listos para llegada del cliente.
- `requests/CustomerProgressCard.tsx:111-125`: llegada de tarjeta; `readyArrival.ts` comparte el tiempo restante.
- Productos y servicios difieren: `CustomerProgressCard.tsx:138-139`, `165-166` excluye acciones de aviso/recepción de producto para servicio; `BusinessProgressCard.tsx:136` muestra Cliente avisado en servicio.

## 8. Historial y registros antiguos

- `requests/CompactHistoryList.tsx:344`: usa ProcessHistoryCard para registros con proceso.
- `requests/ProcessHistoryCard.tsx:14-49`: cabecera de contraparte, estado final, condiciones aceptadas o solicitud original según cierre; permite abrir el detalle.
- COMPLETED muestra «Completado». La tarjeta final de historial no es la tarjeta CustomerProgressCard con su estado local received.
- `requests/MyOrderCard.tsx:38` y `requests/BusinessOrderCard.tsx:44`: frontera de ruta moderna. El resto de esos archivos conserva la ruta antigua sin proceso.
- `requests/requestStatusGrouping.ts:25-34`: fallback antiguo. Allí accepted sí se clasifica directamente como active; no trasladar esa regla al proceso moderno.

## 9. Restricciones de backend para diseñar la modificación

Raíz backend: `C:\dev\zipco-backend-qa\src\request-process\`.

| Restricción actual | Archivo y líneas |
|---|---|
| Un estado compartido y dos indicadores de consentimiento en frontend | frontend `requests/requestProcess.ts:19-32` |
| AUTHORIZE_CONTACT propio sin esperar al otro; OPEN requiere consentimiento del otro | backend `coordination-policy.ts:29-48`; `request-coordination.service.ts:175-196` |
| OPEN puede registrar consentimiento propio en la misma acción, si el otro ya autorizó | backend `request-coordination.service.ts:182-196` |
| Solo propietario del negocio ejecuta START_WORK y solo desde COORDINATING | backend `request-coordination.service.ts:197-203` |
| Registra únicamente consentimiento de quien ejecuta la acción | backend `request-coordination.service.ts:357-375` |
| Consentimiento vigente ligado a titular, destinatario, versión de teléfono y texto | backend `coordination-context.ts:134-149` |
| Solo devuelve URL si ambos consentimientos siguen disponibles y número válido | backend `request-coordination.service.ts:499-526` |
| Confirmación aviso y recepción cliente/producto | backend `request-coordination.service.ts:213-231` |
| Cambios de estado, versión y evento | backend `request-coordination.service.ts:233-283` |

Simplificar textos, animaciones y navegación local es frontend. Cambiar permisos, compartir contacto antes del consentimiento del otro o persistir avances independientes exige definir contrato con backend primero. No inventar campos ni convertir un flag local en confirmación del servidor.

## 10. Archivos que pasar completos a Claude

En `C:\dev\zipco-app-qa\src\app\screens\requests\`:

1. ProcessOrderCard.tsx
2. MyOrderCard.tsx
3. BusinessOrderCard.tsx
4. MyOrdersTab.tsx
5. BusinessOrdersTab.tsx
6. OrderCardAurora.tsx
7. CoordinationActions.tsx
8. BusinessCoordinationCard.tsx
9. CoordinationSheets.tsx
10. useCoordination.ts
11. coordinationApi.ts
12. requestProcess.ts
13. types.ts
14. requestStatusGrouping.ts
15. orderTabs.ts
16. ProposalNegotiation.tsx
17. ProposalChat.tsx
18. proposalContract.ts
19. AcceptAuthorizeCard.tsx
20. AcceptedProposalHost.tsx
21. proposalAcceptance.ts
22. OrderActionModal.tsx
23. useStartWorkPrompt.ts
24. whatsappReturn.ts
25. useRequests.ts
26. ActionHologram.tsx
27. AgreementSheet.tsx
28. CustomerProgressCard.tsx
29. BusinessProgressCard.tsx
30. CustomerReceiptDialog.tsx
31. useReadyTransitions.ts
32. ProcessHistoryCard.tsx

Fuera de esa carpeta: `C:\dev\zipco-app-qa\src\app\screens\RequestsScreen.tsx` y, para el envío inicial, `C:\dev\zipco-app-qa\src\app\screens\CheckoutScreen.tsx`.

No hace falta rediseñar todos estos archivos: el listado permite seguir la selección de tarjetas y los caminos alternativos sin confundirlos con el flujo de autorización. La modificación propuesta todavía no está implementada.
