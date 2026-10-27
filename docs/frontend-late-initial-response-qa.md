# Fuera de hora y consulta de continuidad — frontend QA

Clasificación: frontend + backend coordinados. Backend publicado previamente en Railway QA `67d5ab8`; frontend integra el contrato `C:/dev/zipco-backend-qa/docs/testing/late-initial-response-contract-qa.md`. No hay cambios de backend, migraciones ni variables en esta entrega.

## Resultado

- Negocio: tarjeta oscura de las maquetas aprobadas, reloj, FUERA DE HORA, retraso y fecha solicitada entregados por servidor; detalle con productos, nota, foto y recepción real del pedido. Horas en America/Santiago, formato de 24 horas.
- Consulta y No podré atender usan acciones reales. La consulta comprobada muestra el holograma Consulta enviada y deja Esperando respuesta del cliente; no permite reenviar una consulta ya registrada.
- Cliente: la consulta aparece en Por responder y en el resumen de pendientes de responder, con Sí, aún lo necesito / No, ya no lo necesito / Ver detalle.
- Sí registra interés, sin disponibilidad, compra, reserva o consentimiento de contacto implícitos. El negocio retoma mediante Proponer nueva hora, reutilizando alternativas y exigiendo un cambio programado explícito. Se conserva el snapshot original.
- No y No podré atender conservan cierre y detalle en Historial de ambos. El segundo exige confirmar Finalizar solicitud.
- La proyección se usa exclusivamente en AWAITING_BUSINESS_RESPONSE de AVAILABILITY_V3. Pedidos Ahora, flujos V1/V2, acuerdos, reservas, coordinación, Listo y recepción mantienen sus recorridos.

## Contrato y recuperación

GET de listas y proceso: `processContract=availability-v3&initialResponseContract=late-initial-v1`. La lectura de propuestas también envía `X-Process-Contract: availability-v3` y `X-Late-Initial-Contract: late-initial-v1`: su guardia backend negocia la rama mediante header. Sin ese header, no entrega la capacidad de retomar mediante alternativa.

Campo validado: `requestProcess.lateInitialResponse`, con contract, status, scheduledFor, serverNow, delaySeconds, queryId, askedAt, answeredAt y requiresNewSchedule. `createdAt` del pedido solo representa recepción. No se usa el reloj del celular para declarar vencimiento o conceder acciones.

POST `/request-processes/:id/actions/ask-late-request-need`, `confirm-late-request-need`, `decline-late-request-need`, `close-late-request-unavailable`. JWT, ambos headers de contrato e Idempotency-Key UUIDv4. Cuerpo: expectedVersion, proposalId, confirmationAccepted:true; las respuestas del cliente añaden queryId de la consulta vigente. La nueva hora usa propose-alternative existente con schedule SCHEDULED y fulfillment existente.

Se comprueban identidad, pedido, propuesta, incremento de versión, estado, queryId, cierre y recibo sin allowedActions antes de publicar éxito. GET actual recupera las acciones siguientes. Intenciones separadas por participante/rol/proceso con clave estable y huella SHA-256; no se guardan teléfonos, mensajes o tokens en ellas. Resultado incierto, 5xx, conflicto o recibo inválido conserva la clave y requiere comprobar/reintentar explícitamente. Cambiar de elección no puede saltar una intención pendiente. Lecturas y cambio de sesión no producen POST automáticos. Holograma deduplicado por proceso, consulta, versión, acción y ámbito de usuario incluso al recargar.

Al llegar la hora de una solicitud programada, se solicita un GET según scheduledFor y serverNow de la propuesta original. La consulta de capacidad solo programa esa lectura si creationEnabled es true. Volver a la app mantiene la recuperación por GET existente. Si un formulario anterior ya recibió el rechazo de fecha, Comprobar pedido puede actualizar a la tarjeta Fuera de hora sin reenviar disponibilidad ni descartar su clave incierta.

Notificaciones: `order-late-initial-event` dispara lectura actual; texto, acciones y categoría salen del proceso leído. El worker reconoce los cuatro eventType y normaliza los tags reales de outbox `reservation-event-…` a la misma identidad que los avisos locales. Click conserva rol y pedido; las acciones se habilitan solo con datos leídos. Revisión del worker: `late-initial-v1-click-v7`. Consulta enviada acredita registro en ZIPCO, no lectura o entrega del push al celular.

## Archivos

Nuevo: `LateInitialCard.tsx`, `late-initial.css`, `lateInitialContract.ts`, `lateInitialApi.ts`, `lateInitialIntent.ts`, `useLateInitial.ts`, `useLateInitialDeadline.ts`, fixtures y pruebas en `src/app/screens/requests`; `src/app/notifications/lateInitialNotice.ts`; `scripts/check-late-initial-flow.mjs`.

Conexiones: `requestProcess.ts`, `reservationContract.ts`, `proposalApi.ts`, `requestProcessErrors.ts`, `ProcessOrderCard.tsx`, `ProcessHistoryCard.tsx`, `ProposalNegotiation.tsx`, `ActionHologram.tsx`, `useRequests.ts`, `useAvailability.ts`, `requestStatusGrouping.ts`, `requestAttentionSummary.ts`, `RequestsScreen.tsx`, monitor/avisos de notificaciones, `public/push-sw.js` y diagnóstico de revisión del worker. Pruebas anteriores actualizadas para exigir la negociación de lectura aditiva.

## Validación

- 1.470 pruebas / 119 archivos aprobados, incluidos contrato, permisos, recibos, reintentos, estados, compatibilidad y navegación/deduplicación de los cuatro eventos nuevos en el worker.
- 13 recorridos Chrome con componentes reales y backend sintético: Sí a 320/390/430 px, nueva hora explícita, No a Historial, cierre confirmado, pérdida antes/después de guardar, recibo inválido, creación desactivada, lectura al llegar la hora, respuesta a consulta existente tras desactivar y recuperación desde formulario de disponibilidad antiguo.
- 21 regresiones Chrome del recorrido V3 anterior: reservas gratis/pagadas, WhatsApp y holograma del negocio, sin reserva, alternativas/contrapropuestas/propuesta final, campos preservados y recuperación de incertidumbre.
- Build QA/PWA aprobado; permanece el aviso conocido de bundle mayor de 500 kB. Este repositorio no tiene comando independiente de TypeScript/lint; no se presentan como ejecutados.
- Railway QA: raíz HTTP 200 y capacidades HTTP 401 sin sesión, consultas solo de lectura. No acreditan el flag privado ni un recorrido autenticado real nuevo.

## Publicación y activación pendiente

Código publicado: `e77e0cea0f0b8f2b7584b4fd5203d66246634621`, rama `qa`, push mediante la integración GitHub → Vercel. Vercel confirmó READY para `dpl_7NLXdVFR6jsRQJAU5dNwsNcrgpG4` y el alias `https://zipco-app-git-qa-zipco-s-projects.vercel.app`. Identidad Git anterior conservada, sin configuración global ni reescritura. El cierre documental posterior conserva el mismo código funcional.

No se activa `LATE_INITIAL_RESPONSE_ENABLED`; no se cambia Railway ni se presupone el valor privado actual. Con creación apagada y sin consulta previa se mantiene la tarjeta actual; las consultas ya registradas siguen siendo respondibles según el servidor.

Después del despliegue: actualizar Android e iPhone, comprobar la misma versión QA en ambos y coordinar con backend la activación QA. Prueba física pendiente: solicitud de producto de precio fijo programada, dejar pasar la hora, consultar, responder Sí/No, nueva hora aceptada y cierre por negocio. No considerar las pruebas sintéticas como comprobación de push físico.

`main` y producción no modificados. Se conservan seis documentos locales previos ajenos a esta entrega fuera del commit.
