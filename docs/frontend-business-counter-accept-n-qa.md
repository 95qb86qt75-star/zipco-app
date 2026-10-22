# UI-BUSINESS-COUNTER-ACCEPT-N-01 — Tarjeta de aceptación de contrapropuesta

2026-10-22. Solo frontend, qa. Base a2b45ab.

## Antes / Después

La captura del negocio en QA a2b45ab mostraba la confirmación antigua en línea:
«Aceptar contrapropuesta: ¿confirmas esta propuesta exacta?». El diseño N se
había integrado solo al aceptar la propuesta desde el cliente.

Ahora Aceptar contrapropuesta abre la misma tarjeta holograma «Todo listo para
coordinar tu pedido», con el cliente, producto/servicio, cantidad, disponibilidad
y total exactos de su contrapropuesta. Mantiene vidrio, iconos y paleta del
componente compartido. Confirmar contrapropuesta envía la aceptación existente;
Volver/X cierran sin enviar. El holograma Cierre exitoso aparece solo después de
confirmar, y se selecciona Coordinación con las listas/contadores actualizados.

Alcance visual expresado antes de implementar: esta variante confirma la
aceptación; el contacto se autoriza por el recorrido actual en Coordinación.
No muestra «Aceptar y autorizar contacto» ni «Solo aceptar · autorizo después»
al negocio, ni afirma que compartir el teléfono haya quedado autorizado.
El cliente conserva las dos opciones aprobadas en el bloque anterior.

La inspección previa encontró AUTHORIZE_CONTACT para ambas partes en el código
backend, pero coordinationAllowed y reintentos frontend lo limitan al cliente;
la respuesta real QA del negocio no fue verificada en ese diagnóstico. Integrar
autorización automática del negocio sigue pendiente de coordinación del contrato.
Este bloque no modifica esos permisos ni intenta OPEN_WHATSAPP para autorizarlos.

## Archivos y contrato

- src/app/screens/requests/AcceptAuthorizeCard.tsx: variante business, nombre del
  cliente, texto y confirmación sin consentimiento automático; mismo diseño N.
- src/app/screens/requests/ProposalNegotiation.tsx: ambas aceptaciones abren la
  tarjeta; negocio confirma ACCEPT_COUNTER_PROPOSAL y nunca el action del cliente.
- scripts/check-alternative-negotiation.mjs: regresión y casos de negocio móviles.
- Esta ficha y docs/frontend-ui-design-catalog.md.

Contrato backend existente business-alternative-proposal-qa.md. GET
/request-processes/:id/proposals antes de confirmar, versión/propuesta exactas y
allowedActions. POST /request-processes/:id/actions/accept-counter-proposal con
{ expectedVersion, proposalId, confirmationAccepted:true }, JWT y clave original
de idempotencia. acceptPastSchedule:true solo tras la advertencia específica.
Esa excepción conserva la confirmación explícita de fecha vencida en línea.
Estado confirmado accepted / COORDINATION_PENDING y agreementPublicId.

Campos/endpoints nuevos: ninguno. Sin cambios de estados, permisos, contactos,
notificaciones ni backend. Railway no necesario. main y producción intactos.

## Validación y publicación

1153 pruebas/99 archivos y build QA/PWA aprobados (advertencia preexistente de
bundle grande). 38 recorridos Chrome aprobados, incluyendo la regresión del
cliente y cuatro escenarios añadidos de negocio: tarjeta 320/393px con cierre
sin POST y doble toque protegido, error con formulario conservado/reintento con
la misma clave y fecha vencida con confirmación explícita. Se verifica un único
accept-counter-proposal con el proposalId, versión y confirmationAccepted
exactos; sin POST de autorización, selección Coordinación y holograma posterior.
Publicación exacta: en cierre.
Pruebas móviles reales pendientes: negocio Android y cliente iPhone, un paso a
la vez. Sin acciones, pedidos o uploads reales en pruebas locales.
Reintentos fiables de notificaciones siguen pendientes para el cierre general.
