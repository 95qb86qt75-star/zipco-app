> Documento histórico de la revisión previa a c3da34e. La dependencia descrita fue resuelta por backend; no reenviar este pedido como pendiente. La integración vigente está en 13, 14 y docs/frontend-coordination-in-card-qa.md.

# Parte A — Auditoría de coordinación dentro de la tarjeta

Fecha: 2026-10-30, America/Santiago. Workspace frontend QA, rama qa, HEAD `45801dda321b0b7ac5853b6f63155e3c8ae7f064`.
Clasificación: frontend + backend si se exige guardar/notificar «Falta» también antes de la primera declaración. Auditoría estática; todavía no se implementa Parte C.

## Resultado y diferencia que requiere coordinación

La respuesta negativa de la contraparte YA existe. No hay que crear otro endpoint para ese caso. El campo real es `coordinationAccepted`, no `decision`.

El paquete mezcla dos momentos:

| Momento | Estado real | Acción disponible | Sí | Falta / No actual |
| --- | --- | --- | --- | --- |
| Nadie declaró todavía | COORDINATING / Por coordinar | CONFIRM_WHATSAPP_COORDINATION, si allowedActions lo permite | Pasa a IN_PROGRESS; crea ronda PENDING | «No, aún no» solo cierra el recordatorio local, sin POST ni aviso. No hay acción negativa inicial definida. |
| Otra persona declaró | IN_PROGRESS / En curso; ronda PENDING | RESPOND_WHATSAPP_COORDINATION para la contraparte | Sigue IN_PROGRESS; ronda CONFIRMED | POST con false: COORDINATING / Por coordinar; ronda DECLINED; aviso al iniciador. |
| Yo declaré | IN_PROGRESS / En curso; ronda PENDING propia | No puedo responderme | Sin botones de respuesta | Sin botones de respuesta. |
| Disponibilidad esperando decisión del cliente | AWAITING_CUSTOMER_CONTINUATION / Esperando respuesta | Acciones de disponibilidad | No corresponde a esta consulta | No corresponde a esta consulta. |

El instructivo maestro exige que «Falta» se guarde, cierre la consulta y avise. Eso funciona para la segunda fila. Para la primera sería un cambio de contrato: no se puede enviar RESPOND sin ronda ni confirmationId ni convertir un cierre local en una respuesta guardada.

Además, el documento 14 §2 pide conservar «No, aún no» en modo confirm, mientras el maestro y el §3 piden guardar y avisar al confirmar «Devolver». Ambas instrucciones no equivalen en ese momento. Las copias corregidas distinguen el comportamiento existente del requerimiento pendiente, sin elegir silenciosamente otra regla de negocio.

## Las siete preguntas, con evidencia de archivo y línea

Las rutas backend de esta sección son relativas a `C:/dev/zipco-backend-qa/`; las frontend, a `C:/dev/zipco-app-qa/`. Código backend de coordinación publicado: `23d173e`. HEAD local backend leído: `8c99e6c` (documentación posterior); no se modificó.

### 1. ¿Existe RESPOND false y dónde queda?

Sí. Ruta: `src/request-process/request-coordination.controller.ts:59`; DTO: `src/request-process/coordination.dto.ts:38` y `:45`. Body exacto: `{expectedVersion, confirmationId, coordinationAccepted:false}`. `decision` es un nombre descriptivo del diseño y no se envía en JSON; la validación rechaza campos adicionales (`request-coordination.controller.ts:29`).

`src/request-process/request-coordination.service.ts:300` exige IN_PROGRESS y ronda PENDING con confirmationId coincidente; `:306` impide que el iniciador se responda; `:311` cambia a COORDINATING cuando coordinationAccepted es false. Order.status sigue accepted. Prueba existente: `src/request-process/whatsapp-coordination.postgres.spec.ts:101`, aserciones `:109` y `:114`.

No cubre una negativa inicial: la declaración de `request-coordination.controller.ts:38` usa CustomerConfirmationDto; `coordination.dto.ts:34` exige confirmationAccepted true; `request-coordination.service.ts:277` solo admite esa declaración desde COORDINATING. La lista pública de acciones bilaterales está en `src/request-process/whatsapp-coordination.ts:7` y no incluye una negativa inicial.

### 2. ¿Cierra la ronda y permite otra?

Sí para RESPOND. Se guarda el evento con confirmationId y coordinationAccepted en `src/request-process/request-coordination.service.ts:395` y `:410`; se reconstruye el resumen en `:429`. `src/request-process/whatsapp-coordination.ts:32` selecciona la última declaración, `:41` vincula su respuesta y `:57` determina CONFIRMED/DECLINED. Tras No, no queda PENDING. En COORDINATING se puede volver a declarar si los permisos lo permiten (`:86`).

Prueba existente `whatsapp-coordination.postgres.spec.ts:101`: otra ronda desde `:122`, confirmationId distinto en `:123`, rechazo de una respuesta a la ronda anterior en `:126`.

No existe una ronda PENDING que cerrar antes de la primera declaración; no inventar confirmationId ni un estado persistente para ese caso.

### 3. ¿Se avisa al cliente?

Cuando el negocio responde No a una declaración del cliente, sí se programa el aviso al cliente. En general se avisa al otro participante: `src/request-process/request-coordination.service.ts:461` usa context.other.id; `:476` elige coordination-declined para false; `:503` envía después del commit en QA. Si el cliente responde al negocio, el destinatario es el negocio, no el propio cliente.

Texto y tipo: `src/notifications/push-notifications.service.ts:425`: order-whatsapp-coordination-declined, «Todavía falta coordinar». Envío al destinatario: `:461`. La entrega de push es de mejor esfuerzo y no está garantizada: el estado persiste aunque falle el proveedor (`request-coordination.service.ts:518`; prueba `whatsapp-coordination.postgres.spec.ts:305`). El pendiente/resultado también llega por GET.

Antes del primer Sí, cerrar «No, aún no» no manda este aviso. La implementación frontend está en `src/app/screens/requests/WhatsappCoordinationPanel.tsx:46`; el callback de cierre no ejecuta operation.run.

### 4. ¿RESPOND true deja En curso?

Sí. La rama de respuesta exige IN_PROGRESS (`request-coordination.service.ts:300`) y solo cambia a COORDINATING cuando el booleano es false (`:311`). Para true permanece IN_PROGRESS. Prueba `whatsapp-coordination.postgres.spec.ts:77` y `:78`; resumen CONFIRMED en `:79`.

La contraparte ya estaba En curso antes de contestar. No incrementar artificialmente ese contador ni mover otra vez de Esperando respuesta a En curso. Si permanece en la misma pestaña, se muestra el resultado sin plegar/eliminar el pedido.

### 5. ¿Ambos pueden declarar primero y se respeta initiatedBy?

Sí, producto y coordinación general WhatsApp dentro del alcance publicado. `request-coordination.service.ts:270` excluye servicios, retiro local y reservas aplicables; `:280` exige apertura autorizada de este acuerdo por el actor y consentimientos vigentes; `:295` lleva a IN_PROGRESS. `:399` registra BUSINESS o CUSTOMER. `whatsapp-coordination.ts:55` expone initiatedBy; `:89` otorga RESPOND únicamente al rol contrario en IN_PROGRESS/PENDING.

Prueba parametrizada para ambos iniciadores `whatsapp-coordination.postgres.spec.ts:56`, permisos de la contraparte `:70`, lecturas coincidentes `:82`, aviso al otro participante `:96`. Ni los administradores ni el iniciador pueden responder esa ronda; prueba `:211`.

### 6. ¿Refresh actualiza estado y conteos?

Las listas devuelven pedidos con resumen actual, no un objeto independiente de conteos por pestaña. Backend: `src/orders/orders.service.ts:222` y `:243` usan listOrders; `src/request-process/request-process-read.service.ts:191` serializa listas y `:689` añade el resumen/acciones de coordinación. Prueba de lectura por lista del cliente: `whatsapp-coordination.postgres.spec.ts:72`; lecturas de los dos actores `:82`.

Frontend: `src/app/screens/requests/useRequests.ts:215` y `:237` actualizan desde las lecturas y mezclan versiones; `:305` recibe el recibo. `requestStatusGrouping.ts:23` asigna IN_PROGRESS a active; `:25` determina coordinación para los estados pertinentes; `:49` countStatusViews calcula todos los totales a partir de los registros reales.

Sí se puede animar el cambio del número resultante tras actualizar, sin nueva API de contadores. No animar cifras inventadas, no simular un decremento/incremento para RESPOND true si la categoría no cambió y no presentar como cero un conteo todavía desconocido.

### 7. ¿Doble toque, concurrencia, versiones y errores?

Backend: transacción y bloqueo en `request-coordination.service.ts:173`; bloqueo pesimista en `src/request-process/coordination-context.ts:70` y `:74`. Hash del intento en `request-coordination.service.ts:144`, incluye la decisión de respuesta en `:158`. Clave/actor y recibo recuperado en `:206`; body distinto con la misma clave se rechaza en `:212`. expectedVersion se controla en `:229`; la versión aumenta en `:385`; evento y recibo se guardan en la misma transacción (`:395`, `:435`).

Pruebas existentes: misma intención concurrente sin eventos/avisos duplicados (`whatsapp-coordination.postgres.spec.ts:141`); ambos declarando a la vez, un ganador y STALE_VERSION (`:173`); Listo no retrocede por respuesta tardía (`:186`).

Frontend: `src/app/screens/requests/coordinationIntent.ts:66` bloquea dobles envíos, conserva body/UUID y recuperación; `useCoordination.ts:106` comprueba bloqueo/contexto; `:117` envía la intención; `:129` prefiere lectura actual. Una decisión confirmada puede devolver true aun cuando falle el GET siguiente (`:139`, `:143`), quedando needsUpdate: true solo NO basta para mostrar éxito/salida. No cambiar el mensaje a «No se guardó» cuando el resultado es incierto o ya fue confirmado y falta actualizar. Conservar Actualizar estado / Reintentar el mismo envío según el estado existente; nunca reintento automático ni otro UUID para el mismo envío incierto.

## Contrato vigente de request/response

Capability: GET `/request-process-capabilities`, fragmento `{whatsappCoordination:{contract:"whatsapp-coordination-v1",enabled:true}}`.

POST `/request-processes/:id/actions/confirm-whatsapp-coordination`:
`{expectedVersion,confirmationAccepted:true}`.

POST `/request-processes/:id/actions/respond-whatsapp-coordination`:
`{expectedVersion,confirmationId,coordinationAccepted:boolean}`.

Cabeceras: Bearer, Content-Type JSON, Idempotency-Key y X-Whatsapp-Coordination-Contract: whatsapp-coordination-v1, conservando las cabeceras del flujo del pedido.

Respuesta existente `{orderId,orderStatus:"accepted",requestProcess:{id,state,version,allowedActions,whatsappCoordination,...}}`, con el resto del resumen sin cambios. No enviar teléfono, actor, un confirmationId supuesto ni decision.

Errores de contrato: 400 entradas inválidas; 401 sin sesión; 403 sin permiso/auto-respuesta; 409 STALE_VERSION, INCOMPATIBLE_STATE, IDEMPOTENCY_KEY_REUSED, FLOW_CONTRACT_REQUIRED y COORDINATION_CONTACT_REQUIRED. Fuente: contrato publicado `docs/testing/whatsapp-coordination-confirmation-contract-qa.md`, sección 6, y validaciones citadas arriba.

## Punto concreto que debe resolver backend antes de Parte C

Si «Falta → Devolver» debe registrar y avisar también antes del primer Sí, acordar la acción inicial negativa, los roles autorizados, su resumen/permisos, el aviso al otro participante y cómo se vuelve a ofrecer la consulta. El pedido ya se encuentra en COORDINATING en ese momento: conservar acuerdo, contactos, reservas y condiciones, sin simular una transición desde En curso.

No se propone un nombre de endpoint/campo como si existiera. Backend debe entregar el contrato acordado, pruebas, publicación Railway QA y confirmación de la lectura QA antes de conectar ese caso. No reutilizar ANNUL_COORDINATION: anula y lleva a Historial, que contradice el diseño.

Mientras se resuelve, la especificación corregida mantiene Falta sin habilitar en modo confirm si se exige guardado/aviso. Falta de la contraparte sí está soportado por el contrato publicado. No se empezó una UI parcial ni se retiró el holograma todavía.

## Evidencia del paquete y Parte B

Los seis archivos de `archivos_actuales_del_repo/` coinciden byte por byte (SHA-256) con los seis archivos actuales de frontend. No se sobrescribieron.

Copias corregidas del diseño, dentro de este workspace y sin cambiar los originales de Descargas:
- `12_TARJETA_DISPONIBILIDAD_CONFIRMADA_NEGOCIO.md`
- `13_FLUJO_RESPUESTA_Y_CAMBIO_DE_ESTADO.md`
- `14_CONSULTA_COORDINACION_EN_TARJETA.md`

Cambios de especificación: campo coordinationAccepted; Falta existente para contraparte; negativa inicial pendiente de contrato; estados y pestañas reales; destinatario del aviso; conteos derivados de listas; true no garantiza lectura actual; error incierto no significa «No se guardó»; producto visual desde productPreview, no customerImage.

## Estado de entrega

Solo documentos nuevos en `docs/design/coordination-in-card/`. Pruebas/build: no ejecutados en esta auditoría documental; los tests citados se inspeccionaron, no se presentan como ejecutados ahora. No llamadas autenticadas, pedidos, confirmaciones o pushes de prueba. La confirmación móvil previa del usuario («listo funciona») corresponde a la entrega 45801dd y no valida este nuevo diseño.

Commit/rama: sin commit nuevo; qa en 45801dd. Vercel QA conserva esa versión, sin despliegue nuevo. Railway QA no fue modificado; el nuevo caso requiere coordinación con su responsable. Main comprobado de solo lectura en 8295ab8c6024ab20851ebd371308d2f299b4668f; producción intacta. El diagnóstico del clic externo iPhone permanece pausado.