# Secuencia compartida: iniciar WhatsApp → consultar coordinación

Fecha: 2026-10-30, America/Santiago. Workspace frontend QA.
**Registro histórico:** la dependencia descrita abajo quedó resuelta por backend en Railway QA dd00391, según whatsapp-shared-access-contract-qa.md. La integración frontend y sus pruebas se documentan en frontend-whatsapp-shared-access-sequence-qa.md. Los filtros y el cierre de este diagnóstico describen la revisión anterior a esa publicación.
**Clasificación final: frontend + backend.** La implementación queda pendiente de coordinar el contrato; no se habilita una acción prohibida desde la UI.

## Regla confirmada por el usuario

**Objetivo de la UI: trasladar la pregunta del holograma flotante a la tarjeta del pedido asociado, en cliente y negocio.** El usuario mostró el holograma «¿Coordinación lista por WhatsApp?» con «El cliente indicó que ya coordinaron. ¿Es correcto?» y los botones «Sí, es correcto» / «No, falta coordinar». Esa consulta debe resolverse dentro de su tarjeta, identificando negocio/cliente, producto e importe, para evitar confundir solicitudes.

Se distinguen dos presentaciones:

- **Consulta de coordinación:** sustituir su holograma flotante por la presentación dentro de la tarjeta. Incluye la primera declaración y la respuesta de la contraparte, cada una con sus textos y acciones reales. No mostrar simultáneamente el holograma y la consulta en tarjeta para la misma operación.
- **Redirección a WhatsApp:** conservar el holograma transitorio «Te estamos redirigiendo a WhatsApp» al pulsar Iniciar. Este aviso acompaña la salida a WhatsApp y no pregunta si ya coordinaron.

1. Pedido aceptado sin primer acceso: conservar el diseño existente «Ya puedes coordinar por WhatsApp» y su botón Iniciar coordinación.
2. Cliente o negocio pulsa Iniciar: ejecutar OPEN_WHATSAPP autorizado; conservar el holograma de redirección y la navegación existentes.
3. Tras ese primer acceso, la consulta «¿Coordinación lista por WhatsApp?» es compartida. El usuario aclaró expresamente que, si el negocio abrió primero, el cliente debe ver ya la consulta aunque no haya abierto el contacto personalmente.
4. Quien sale a WhatsApp ve la consulta al regresar; no se cambia un estado de negocio por visibilitychange/focus ni por un marcador local.
5. Se conservan Sí/Falta, idempotencia, consentimientos, negativas, rondas, categorías, contadores, recuperación y diseños ya aprobados.

La captura corresponde a una ronda que ya tiene una declaración: la contraparte responde Sí/No y conserva el comportamiento actual (Sí mantiene En curso; No devuelve a Por coordinar). Mover esa pregunta a su tarjeta es presentación frontend. La dependencia backend de esta entrega es adicional y distinta: permitir la primera declaración del otro participante después de que cualquiera haya iniciado el contacto autorizado. No se pide rehacer el protocolo bilateral por cambiar la ubicación visual.

## Hallazgos con evidencia

- La tarjeta anterior no se borró: frontend BusinessCoordinationCard.tsx:269 conserva «Ya puedes coordinar por WhatsApp»; el detalle y botón existen en el mismo archivo. ProcessOrderCard.tsx:119 envuelve ese contenido en CoordinationWaitingCard según el modelo de WhatsappCoordinationPanel.
- WhatsappCoordinationPanel.tsx:21 acepta la consulta según COORDINATING/IN_PROGRESS y permisos/rondas/negativa; useStartWorkPrompt solo marca atención, no determina por sí solo qué tarjeta se monta.
- Backend request-coordination.service.ts:283–287 cambia COORDINATION_PENDING a COORDINATING exclusivamente en OPEN_WHATSAPP. El mismo servicio :338–339 vuelve allí después de RESPOND false. Por eso COORDINATING por sí solo no significa «este participante acaba de volver» ni permite resetear pedidos antiguos como si nadie hubiese iniciado.
- El evento real se registra como WHATSAPP_ACCESS_AUTHORIZED en request-coordination.service.ts:428.
- La primera declaración positiva exige acceso PROPIO: request-coordination.service.ts:307–320 filtra actorUserId === actor.id, junto con los dos consentimientos. Sin acceso propio devuelve COORDINATION_CONTACT_REQUIRED.
- Los permisos leídos tienen la misma condición: request-process-read.service.ts:685–700 filtra actorUserId === actor.id; el recibo del comando repite ese filtro en request-coordination.service.ts:657–664.
- whatsapp-coordination.ts:145 agrega CONFIRM_WHATSAPP_COORDINATION solo cuando canDeclare es verdadero. DECLINE inicial puede estar permitido sin CONFIRM; RESPOND corresponde a una ronda ajena PENDING, no sustituye una primera declaración.
- El resumen actual de frontend requestProcess.ts:26–53 contiene estado, versión, acciones, consentimientos y resúmenes de rondas/negativa. No contiene un comprobante explícito de regreso de WhatsApp. whatsappReturn.ts conserva marcadores locales por actor/pedido/proceso/acuerdo: sirven para presentación local, no como prueba compartida entre teléfonos.

Las rutas backend anteriores están bajo C:/dev/zipco-backend-qa/src/request-process/. Esta es una revisión estática; no se consultaron pedidos privados ni se ejecutaron acciones reales.

## Contrato, payload y respuesta actuales

- POST /request-processes/:id/actions/open-whatsapp: expectedVersion, consentAccepted:true y consentTextVersion cuando corresponde al contrato existente. Requiere Bearer, Idempotency-Key y headers de proceso aplicables.
- coordinationApi.ts:134–157 valida el recibo con orderId, orderStatus y requestProcess, y normaliza la salida interna del adaptador como result/navigation. El recibo y la lectura posterior actualizan requestProcess.state/version/allowedActions; el destino autorizado sigue siendo el devuelto por backend. Esta salida interna no propone un cambio del envelope HTTP.
- POST /request-processes/:id/actions/confirm-whatsapp-coordination: {expectedVersion,confirmationAccepted:true}, con X-Whatsapp-Coordination-Contract: whatsapp-coordination-v1 y los demás headers existentes.
- Resultado actual por contrato/código: después de abrir A, A puede recibir CONFIRM; B sin apertura propia no lo recibe y un intento directo se rechaza. No se presenta este resultado como una respuesta HTTP observada en esta revisión.
- RESPOND usa {expectedVersion,confirmationId,coordinationAccepted}; no puede inventarse confirmationId ni usarse antes de que exista una declaración.

## Dependencia que debe resolver backend

La consulta compartida no debe dejar el primer Sí bloqueado para B solo porque no abrió el contacto desde su teléfono. Hace falta acordar y publicar la elegibilidad de CONFIRM tras acceso autorizado de cualquiera de los dos participantes del mismo pedido/acuerdo, conservando las restantes validaciones.

No se exige un endpoint o campo nuevo si backend confirma que el estado y allowedActions actuales pueden expresar inequívocamente la activación compartida. Si no bastan para los distintos intentos/negativas y pedidos antiguos, backend debe definir el resumen y su compatibilidad; frontend no inventará nombres/campos/timestamps.

La apertura autorizada no acredita que el sistema operativo abrió WhatsApp ni que se enviaron mensajes. El Sí sigue siendo una declaración explícita posterior; la vuelta a la app solo modifica presentación local.

## Mensaje listo para el chat backend

El usuario aprobó esta secuencia para producto con coordinación WhatsApp:

- Queremos reemplazar el holograma flotante «¿Coordinación lista por WhatsApp?» por la consulta dentro de la tarjeta del pedido correspondiente, tanto para la primera declaración como para la respuesta de la contraparte. Conservar sus acciones y reglas de estado; evitar mostrar ambas presentaciones a la vez. La motivación es que el usuario identifique claramente qué solicitud está respondiendo.
- El holograma «Te estamos redirigiendo a WhatsApp» sí se conserva: es distinto de la consulta anterior.
- Antes del primer acceso autorizado de cualquiera: tarjeta «Ya puedes coordinar por WhatsApp».
- Iniciar conserva OPEN_WHATSAPP, holograma de redirección y contacto autorizado.
- El primer acceso de A activa la consulta para ambos; B también debe poder declarar Sí según sus permisos/consentimientos aunque no haya abierto WhatsApp personalmente desde ZIPCO.
- La primera declaración mantiene el protocolo bilateral existente: En curso/PENDING; la contraparte ratifica Sí/No. No debe simularse RESPOND sin una ronda.

Revisar la diferencia descrita: los filtros por actorUserId en request-coordination.service.ts y request-process-read.service.ts todavía exigen apertura propia. Acordar el contrato mínimo para acceso compartido y mantener sincronizados permisos de lectura, validación del comando, recibos e idempotencia. Confirmar si bastan estado/allowedActions o si se necesita un resumen opt-in. No crear campos ni endpoints si no son necesarios.

Conservar validación de participante, ambos consentimientos/contactos, acuerdo vigente, scope de producto/WhatsApp, negativas iniciales y de contraparte, rondas, reservas, estados posteriores y protección de pedidos antiguos. Un GET/recarga no debe reabrir una consulta cerrada. No resetear registros históricos para conseguir una captura.

Probar ambos iniciadores, ausencia total de acceso, acceso de A y Sí de B sin acceso propio, doble toque/simultaneidad, reintento exacto, cambios de acuerdo, consentimiento revocado, negativas y reapertura autorizada, y compatibilidad. Seguir acuerdo → contrato → implementación → pruebas → Railway QA → entrega exacta a frontend.

No crear pedidos/pushes artificiales ni repetir confirmaciones reales. No modificar main/producción. El diagnóstico del clic externo iPhone sigue pausado.

## Cierre de esta revisión frontend

No se modificó código ni se realizó despliegue. No se ejecutó build/suite por tratarse solo de diagnóstico. Rama qa; frontend publicado conserva 612d059 (Vercel QA Ready). Railway no se modificó.

Documento preparado localmente, sin commit/push nuevo. Main y producción intactos. Pendiente: contrato/publicación backend, integración frontend de la secuencia usando los diseños existentes y prueba física en ambos teléfonos.
