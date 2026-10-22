# DIAG-BUSINESS-COUNTER-CONTACT-01 — Autorizar contacto al aceptar contrapropuesta

2026-10-22. Requiere coordinación frontend ↔ backend antes de implementar.
No se modifican permisos ni se presenta como realizada una autorización.

## Pedido del usuario

Botón del negocio: «Aceptar y autorizar contacto».
Mensaje: «Al aceptar la contrapropuesta, {customerName} podrá ponerse en contacto
vía WhatsApp contigo para coordinar los detalles de pago y retiro».
Nombre dinámico del cliente, no hardcodear Usuario Pauta QA.

Ese texto requiere conceder realmente el consentimiento del propietario. No
puede reemplazarse solo el texto del botón que hoy únicamente acepta.
AGENTS.md exige detener y coordinar si se afectan permisos/roles.

## Contrato actual y archivos

Backend leído, sin modificar:
C:/dev/zipco-backend-qa/src/request-process/coordination-policy.ts:40 añade
AUTHORIZE_CONTACT cuando hay teléfono propio válido y falta consentimiento
propio, tanto para customer como owner. request-process-read.service.ts usa
businessContactAuthorized para el propietario y customerContactAuthorized para
el cliente, exponiendo allowedActions y coordination. El controller publica
POST /request-processes/:id/actions/authorize-contact con JWT, Idempotency-Key y
ContactConsentDto. request-coordination.service.ts concede consentimiento al
actor propio; OPEN_WHATSAPP además exige consentimiento de la otra parte.

Frontend actual:

- coordinationApi.ts / coordinationAllowed: AUTHORIZE_CONTACT exige !business
  y coordinación, aunque la lectura incluyera esa acción para el propietario.
- useCoordination.ts / run: el guard de reintentos también impide
  AUTHORIZE_CONTACT al negocio; update reconcilia esa acción usando el campo del
  cliente, que debería depender del actor si se confirma esta integración.
- AcceptedProposalHost.tsx: autoriza solo al cliente y lee /orders/my-orders.
  Necesitaría rol/lectura/campo de consentimiento correctos para el propietario.
- ProposalNegotiation.tsx y AcceptAuthorizeCard.tsx: la variante del negocio
  envía exclusivamente ACCEPT_COUNTER_PROPOSAL y no declara compartir teléfono.

## Payloads y respuestas

Ya integrado: POST /request-processes/:id/actions/accept-counter-proposal,
{ expectedVersion, proposalId, confirmationAccepted:true }; optional
acceptPastSchedule:true tras advertencia. El recibo verificado contiene
orderStatus accepted, proceso COORDINATION_PENDING, agreementPublicId, versión
+2 y allowedActions vacío. Después debe leerse el pedido actual del negocio
mediante GET /orders/business/:businessId?processContract=alternatives-v1.

Si el contrato QA lo confirma y esa lectura permite AUTHORIZE_CONTACT:
POST /request-processes/:id/actions/authorize-contact,
{ expectedVersion: versión de la lectura nueva, consentAccepted:true }, JWT del
propietario y clave de idempotencia propia, distinta de la aceptación.
No enviar businessContactAuthorized en el body ni conceder consentimiento del
cliente, no abrir WhatsApp automáticamente, no modificar el acuerdo.

Respuesta real Railway QA de propietario después de aceptar contrapropuesta:
NO VERIFICADA en este diagnóstico. La inspección del código local y las pruebas
sintéticas no sustituyen la confirmación de contrato/despliegue QA.

## Confirmación solicitada a backend

Confirmar/documentar para QA publicado que el propietario participante puede
autorizar su contacto con la acción existente después de aceptar una
contrapropuesta. Precisar allowedActions, expectedVersion, respuesta con
coordination.businessContactAuthorized, conflictos/replay y que el cliente
conserva su decisión independiente de consentimiento. Confirmar también el caso
en que el propietario ya tiene consentimiento vigente o le falta teléfono válido.

No se requiere inventar campo ni endpoint nuevo si ese contrato existente ya
cubre los casos. Tras confirmar la compatibilidad QA, integrar frontend con
guards por actor y recuperación de la misma intención, validar y publicar QA.
Mientras tanto solo se publica la corrección visual independiente
PERF-ACCEPT-CARD-01. Backend, Railway, main y producción sin cambios.
