# Cliente Aurora Pro: revisión de dependencia de backend

## Respuestas backend recibidas — 2026-11-18

Revisadas las dos propuestas locales de docs/testing en backend:
- customer-payment-proof-declaration-contract-proposal-qa.md(E214).
- business-reservation-follow-up-reason-contract-proposal-qa.md(E215), separado.

Todavía son documentos: no implementación, pruebas, commit/push ni publicación.
La recepción de estos documentos resuelve la falta de respuesta, no implementa
las dependencias ni autoriza a declarar disponible el recorrido.

E214 propone capacidad customerPaymentProof/contrato customer-payment-proof-v1,
acción DECLARE_PAYMENT_PROOF_SENT y POST declare-payment-proof-sent. Cuerpo
expectedVersion/reservationId/proofSentDeclared:true; el placeholder de Claude
con confirmationAccepted:true deberá adaptarse. Lectura aditiva opt-in separada
del parser estricto E209, categorías antes/después y GET payment-proof-result
para recuperación por UUID original; aviso al negocio por outbox. No certifica
transferencia ni apartado, no exige apertura previa de WhatsApp ni bloquea una
confirmación válida del negocio porque falte la declaración cliente.

E215 propone capacidad businessReservationFollowUpReasons/contrato
business-reservation-follow-up-v1, POST/acción actuales y cabecera opt-in.
Negocio nuevo envía confirmationAccepted:true, reasonCode y reasonDetail solo
si OTHER(3–1000). No enviar una etiqueta libre como sustituto del código.
Motivo privado en evento propio, visible solo al negocio, sin aviso/entrega/
pago/cierre bilateral. Primer motivo no reemplazable, legacy sin motivo respetado,
recibos antiguos recuperables y GET business-follow-up-result propuesto.
El bloqueo de seguimiento tras ciertos cierres globales continúa separado.

Siguiente etapa: usuario acuerda/reenvía autorización del alcance backend,
implementación y pruebas por separado, publicación Railway QA con commit/estado
verificados y contrato definitivo. Luego adaptar los dos frentes, publicar y
validar flujo completo. No activar las funciones null de Claude ni copiar sus
payloads de prueba como si fueran definitivos. No cambios funcionales frontend
en esta revisión, ni llamadas de mutación, pruebas/build o despliegues nuevos.

2026-11-18. Clasificación: frontend + backend para declarar envío del comprobante
y modificar categoría del cliente. El rediseño sin esa función es solo frontend.
No se integran ni activan todavía las fuentes entregadas hasta acordar alcance
y contrato. No modificar Railway desde este workspace.

## Entrega y estado actual

Descargas: PickupPrepaymentCard (1).tsx, ReservationPanel (2).tsx,
AvailabilityPostActionsView (2).tsx y customer-pickup-prepayment.css,18/11 16:53.
Nueva composición CustomerPrepaymentView y render opcional de piezas del cliente.
La función receiptSentAction en ReservationPanel (2).tsx:43 devuelve null.
PickupPrepaymentCard (1).tsx:335–336 muestra la pregunta únicamente con rp.receipt.
Por tanto la pregunta/confirmación no están habilitadas con el contrato actual.
sessionStorage y eventos de vuelta de la pestaña son señales locales de UI;
no prueban envío de archivo, transferencia ni recepción por el negocio.

## Contrato actual y evidencia

Backend consultado readonly, HEAD fe9686e; no se verificó el contrato desplegado
con sesión real ni se hicieron mutaciones. Frontend API/domain solo enumeran las
acciones de reserva existentes, sin declaración del cliente de envío de recibo.

Endpoint existente:
POST /request-processes/:id/actions/open-reservation-whatsapp

    {expectedVersion, reservationId, purpose:'RECEIPT'|'CLARIFICATION'}

Usa Authorization, contrato de proceso, Idempotency-Key y participantes actuales.
Recibo esperado por reservationApi: {result:{orderId,orderStatus,requestProcess},
navigation:{url}} o navigation:null con CONTACT_NOT_AVAILABLE. No se recibió
ningún recibo real durante esta revisión, solo se leyó el contrato/código.

- Backend reservation.service.ts:392–406 y505–526: RECEIPT exige cliente y
  proceso activo; CLARIFICATION no se restringe al negocio. Exige alcance,
  consentimientos y teléfono válido. La disponibilidad real viene de allowedActions.
- reservation-support.ts:428–441: OPEN_RESERVATION_WHATSAPP y seguimiento se
  proyectan para participantes según estado/consentimiento. No exigen que el
  negocio ya haya confirmado el pago para poder aclararlo.
- Abrir este endpoint no registra un comprobante enviado ni pago recibido.
- Frontend domain/pickupPrepayment.ts: proyección E209 estricta. Fase no preparable
  mantiene businessCategory WAITING_RESPONSE y customerCategory AWAITING_BUSINESS.
  La política E211 presenta esa espera como Por responder cliente. No convertir
  todas esas categorías en En espera ni usar una bandera local como dato del servidor.

## Lo que debe definir backend

Acción autorizada para que el cliente declare explícitamente que envió el
comprobante por WhatsApp. Backend decide nombre del endpoint/acción, campos,
validaciones, persistencia y respuesta; no se inventa el nombre en frontend.
No asumir que confirmationAccepted:true sea el payload definitivo.

Debe definir:
- Actor/estados habilitados, allowedActions y comportamiento tras confirmar,
  cancelar, aclarar o repetir la misma declaración.
- Dato persistido y timestamp del servidor, lectura/proyección para listas y
  detalle, separado de pago recibido/declaración de apartado del negocio.
- Si se aprueba el recorrido: cliente Por responder → En espera después de
  guardar la declaración; negocio permanece Esperando respuesta hasta confirmar
  pago y apartado; luego En curso para ambos mediante flujo vigente.
- Categorías/contadores/avisos, compatibilidad con E209/E211 y lectores anteriores,
  capacidad/versionado si corresponde. No cambiar enums/mensajes de la proyección
  estricta sin coordinar el lector frontend.
- Idempotencia, expectedVersion, concurrencia con confirmación/cancelación y
  recuperación GET de resultado incierto. Sin replay ni éxito/traslado local falso.

El servidor debe registrar una declaración del cliente, no una verificación del
archivo, transferencia o recepción. No hace falta subir una foto a ZIPCO para
esta declaración; si se requiere persistir archivos se debe acordar aparte.
La salida animada solo acompaña éxito real; no determina la transición.

## Decisiones de presentación separadas

- Usar «¿Enviaste el comprobante por WhatsApp?»; «pago por WhatsApp» confunde
  el medio de conversación con la transferencia externa.
- Los motivos propuestos de cancelar cliente pueden viajar como reasonDetail
  existente; son una decisión de texto/producto, no exigen otro campo por sí solos.
- La entrega omite Registrar una aclaración y Retirar permiso. Antes de omitirlos
  validar una ruta equivalente para incidencia formal y revocación: conversar por
  WhatsApp no ejecuta REPORT_RESERVATION_ISSUE ni REVOKE_RESERVATION_CONTACT.
- Finalizar seguimiento conserva confirmationAccepted:true; motivos de esa acción
  siguen siendo otra dependencia de backend y no se habilitan con esta entrega.
- Reutilizar el host E211 al volver de WhatsApp; no duplicar efectos de retorno
  que puedan disparar consultas/preguntas repetidas o ignorar cambio de sesión.

## Cierre de revisión

Solo se añaden este diagnóstico y su referencia en memoria. Sin cambios de app,
pruebas/build nuevos, commit/push/despliegue. Último frontend publicado ca9ee1b;
Vercel no vuelto a consultar en esta revisión. Railway/main/producción intactos.
No hay mediciones exclusivas por fase; revisión de código, no prueba remota.
