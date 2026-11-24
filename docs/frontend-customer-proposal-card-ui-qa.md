# Propuesta del cliente: tarjeta compartida y dos accesos

Clasificación: solo frontend. Bastián solicita replicar en el cliente el diseño aprobado del negocio, con «Aceptar» y «Revisar historial y responder». No se modifica el contrato de aceptación.

## Resultado

ProcessOrderCard reutiliza ProposalWaitingCard para ambos roles en AWAITING_CUSTOMER_DECISION y AWAITING_CUSTOMER_FINAL_DECISION. Cliente muestra nombre del negocio, total propuesto, nueva fecha/hora, fecha original, POR RESPONDER o PROPUESTA FINAL. Null scheduledFor conserva presentación sin una hora inventada. Detalle mantiene solicitud original, nota/foto y fechas. La variante del negocio conserva su diseño de espera y botón de conversación dentro del detalle.

El cliente ve dos accesos permanentes:

- Aceptar: ejecuta GET de la propuesta vigente, comprueba ACCEPT_PROPOSAL en allowedActions y abre la confirmación actual. No hace POST al primer toque. AVAILABILITY mantiene elección de reserva/consentimiento y «Sí, confirmar»; contratos anteriores mantienen AcceptAuthorizeCard. Si ya no está permitido aceptar, informa el cambio y muestra la lectura actual.
- Revisar historial y responder: abre ProposalChat existente con solicitud original, propuestas y acciones vigentes de aceptar/rechazar/contraponer. No reenvía la solicitud ni crea eventos al abrir.

Ambos accesos comparten una instancia de ProposalNegotiation, su bloqueo durante carga, sesión, abortos e intenciones idempotentes. No se duplican motores de aceptación. El POST final sigue requiriendo la confirmación explícita y la lectura vigente que ya exigía execute.

## Contrato y archivos

Campos actuales: proposalSummary.totalPriceClp/scheduledFor, deliveryDate/deliveryTime, allowedActions y disponibilidad/reserva de la propuesta. No hay campos ni endpoints nuevos.

Lectura: GET `/request-processes/:id/proposals?processContract=availability-v3&initialResponseContract=late-initial-v1`, headers y JWT actuales. Aceptación: POST existente `/request-processes/:id/actions/accept-proposal`, con expectedVersion, proposalId, confirmationAccepted, preferencias de contacto, reservationChoice cuando corresponda e Idempotency-Key existentes. Payload y comprobación de recibo intactos.

Modificados: ProcessOrderCard.tsx, ProposalWaitingCard.tsx, ProposalNegotiation.tsx y proposal-waiting.css. Expectativa visual de processPresentation.test.ts; escenarios en check-proposal-waiting-ui.mjs y check-reservation-v3-flow.mjs. Etiquetas de acceso del cliente actualizadas también en check-availability-flow.mjs y check-reservation-flow.mjs; esos dos scripts no se presentan como ejecutados en esta entrega.

## Verificación y publicación

- 1.484 pruebas / 119 archivos aprobados.
- 26 escenarios de presentación con HTTP sintético: negocio y cliente, inicial/final, fecha/sin hora, 320/390/430 px, detalle e historial completo, consentimiento legado al abrir Aceptar, solo GET al primer toque, movimiento reducido y contrapropuesta del negocio conservada.
- 23 escenarios V3 con checkout y componentes reales y transporte sintético: regresiones de reservas/WhatsApp/reintentos y nuevo Aceptar directo con reserva gratuita, propuesta final, retiro sin reserva y rechazo local de reserva pagada sin consentimiento propio. No se mutaron pedidos reales.
- Build QA/PWA aprobado; aviso conocido de bundle mayor de 500 kB. No se presentan lint/TypeScript independientes como ejecutados.

Capturas locales: `node_modules/.cache/proposal-waiting-ui/customer-waiting-390-scheduled.png` y variantes de ancho/estado. Publicación solo rama qa → GitHub/Vercel QA. Pendiente revisión física iPhone/Android del usuario con la versión publicada.

Railway QA no es necesario. Main y producción intactos; seis documentos locales previos ajenos conservados fuera del commit.
