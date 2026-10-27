# Esperando al cliente: tarjeta del negocio y conversación

Clasificación: solo frontend. Diseño recibido en Downloads: `11_TARJETA_ESPERANDO_RESPUESTA_NEGOCIO (1).md`, `ProcessOrderCard.tsx`, `ProposalWaitingCard.tsx` y `proposal-waiting.css`. Ajuste adicional pedido por Bastián: dentro de Ver detalle, botón «Ver conversación del pedido» para abrir la conversación existente con solicitud original y propuestas.

## Resultado

La nueva tarjeta se muestra solo al negocio en AWAITING_CUSTOMER_DECISION y AWAITING_CUSTOMER_FINAL_DECISION. Cabecera del cliente, total propuesto, calendario/hora de la propuesta, hora original y estado ESPERANDO AL CLIENTE. Si scheduledFor es null no se inventa una hora. Final tiene texto de propuesta final. Detalle plegado inicialmente, con productos/nota/foto originales y fechas; incluye el botón de conversación que reutiliza ProposalNegotiation/ProposalChat, sus lecturas, fotos y detalles existentes.

No ofrece aceptar/rechazar ni reenviar mientras el negocio espera. Cliente y AWAITING_BUSINESS_COUNTER_RESPONSE conservan su interfaz para responder. La conversación del negocio mantiene la corrección anterior: no duplica retiro/reserva fuera del detalle de la propuesta.

Se conserva el diseño adjunto con ajustes de envoltura en pantallas angostas, aislamiento de capas y reloj de arena decorativo sin captura de toques. Movimiento reducido sin animación. La barra inferior conserva su capa superior.

## Datos reales y límites

Total y fecha nuevos: requestProcess.proposalSummary.totalPriceClp y scheduledFor, en America/Santiago. Fecha original: lateInitialResponse.scheduledFor cuando esté presente; de lo contrario los campos deliveryDate/deliveryTime originales ya recibidos del pedido. Las propuestas originales se pueden consultar completas en la conversación.

El contrato actual omite lateInitialResponse al pasar a la nueva propuesta; no se conserva ni simula una franja que afirme «El cliente confirmó…» sin ese dato. No se agrega hora de envío porque proposalSummary no la entrega. No se usan createdAt/updatedAt con otro significado. No se agregan campos, endpoints, estados, permisos ni notificaciones.

Conversación: GET `/request-processes/:id/proposals?processContract=availability-v3&initialResponseContract=late-initial-v1`, JWT y headers de negociación existentes. Abrirla y consultar detalles no realiza POST.

## Archivos

- Nuevos: `src/app/screens/requests/ProposalWaitingCard.tsx`, `proposal-waiting.css`.
- Conexión: `ProcessOrderCard.tsx`.
- `ProposalNegotiation.tsx`: prop opcional de etiqueta para el botón y título de conversación; lecturas/acciones actuales intactas.
- Expectativa visual actualizada en `processPresentation.test.ts`; navegador en `scripts/check-proposal-waiting-ui.mjs`.

## Validación y publicación

1.484 pruebas / 119 archivos aprobados. 15 escenarios de navegador con componentes reales y HTTP sintético: inicial/final, programada/sin hora, 320/390/430 px, plegado/desplegado, conversación con todos los turnos, detalle de solicitud/propuesta, solo GET al abrir, movimiento reducido y compatibilidad de cliente/contrapropuesta. Capturas locales en `node_modules/.cache/proposal-waiting-ui`. No hay mutaciones reales de QA.

Build QA/PWA aprobado; aviso conocido de bundle mayor de 500 kB. No se presentan lint/TypeScript independientes como ejecutados. Publicación por rama qa → integración GitHub/Vercel QA. Pendiente revisión física del usuario en Android/iPhone tras recargar la versión publicada.

Railway QA no es necesario. Main y producción intactos; seis documentos locales previos ajenos conservados fuera del commit.
