# Segunda entrega Aurora: diagnóstico previo a integración

Actualización: las fuentes corregidas `(1)` fueron recibidas después e
integradas. Este documento conserva el diagnóstico de las copias anteriores;
el estado vigente y pruebas están en frontend-business-prepayment-design-qa.md.
La dependencia de backend para motivos de seguimiento continúa pendiente.

2026-11-18. Clasificación: requiere diagnóstico; presentación solo frontend,
persistencia del motivo de seguimiento requiere frontend + backend.

## Material disponible

Los archivos mencionados en Descargas conservan la primera entrega:
ReservationPanel.tsx usa zipco-action-dialog en línea88 y no contiene
FINISH_REASON_ENABLED. pickup-prepayment.css no contiene zipco-bpp-dlg.
AvailabilityPostActionsView.tsx no se adjuntó entre los archivos de esta entrega;
el disponible en Descargas está fechado2026-10-31 y no contiene Aurora.
No reemplazar fuentes vigentes con estas copias antiguas: perderían recuperación,
foco, radios nativos y ajustes de la integración previa.

Necesarios: ReservationPanel.tsx, AvailabilityPostActionsView.tsx y
pickup-prepayment.css actualizados. PickupPrepaymentCard.tsx no debe cambiar.
Solo negocio usa Aurora; cliente conserva su presentación y sus motivos vigentes.
WhatsApp/Cancelar coordinación es una variante de diseño pendiente; no ampliar
el selector LOCAL_PICKUP ni transformar una cancelación en otra acción.

## Contrato actual consultado

Backend local consultado readonly, HEAD fe9686e. No se afirma que esta lectura
verifique el estado desplegado de Railway.

- C:/dev/zipco-backend-qa/src/request-process/reservation.service.ts:156:
  FINISH_OWN_RESERVATION_FOLLOW_UP permite solo confirmationAccepted.
- Líneas161–165: onlyKeys restringe el cuerpo a expectedVersion,
  reservationId y campos de la acción. No habilita reasonDetail para seguimiento.
- Líneas384–391: actualiza únicamente fecha de cierre personal según actor.
- docs/testing/pickup-reservations-consolidated-contract-qa.md:300 confirma
  confirmationAccepted:true, sin motivo.

POST /request-processes/:id/actions/finish-own-reservation-follow-up:

    {expectedVersion, reservationId, confirmationAccepted:true}

Encabezados/recuperación existentes: Authorization, contrato de proceso,
Idempotency-Key y relectura. El recibo normal conserva orderId, orderStatus y
requestProcess; no se ejecutó ninguna petición ni se recibió un recibo real.

No activar un flag frontend ni enviar reasonDetail por esta acción mientras
backend no defina campo, validación, persistencia y lectura. Las cancelaciones
sí usan reasonDetail actualmente, pero ello no lo habilita para otras acciones.

## Entrega a backend propuesta

Solicitar soporte para un motivo seleccionado en finalizar seguimiento propio,
manteniendo confirmationAccepted:true, permisos, idempotencia, concurrencia y
compatibilidad con clientes anteriores. Motivos pedidos:

- Ya se retiró el pedido.
- Lo resolví con el cliente por WhatsApp.
- El cliente ya no responde.
- Otro motivo.

Backend debe confirmar nombre/tipo del campo, obligatoriedad y compatibilidad,
si se guarda separado por participante, cómo se devuelve y dónde queda visible.
No sobrescribir el motivo compartido de cancelación ni interpretar el cierre
personal como entrega, pago verificado, devolución o cierre para la otra parte.
Publicar/probar Railway QA y entregar contrato antes de conectar frontend.
No se envió este mensaje a terceros con herramientas.

## Resultado

Sin implementación, pruebas, build, commit, push ni despliegue nuevos. Frontend
QA vigente1f8fa0c (cierre documental local48ee334). No se verificó nuevamente
Vercel ni Railway en este diagnóstico. Main y producción no modificados.
Solo se añade este informe y su referencia en memoria. Análisis/lectura sin
cronómetro exclusivo; no se inventan tiempos ni pruebas de servidor.
