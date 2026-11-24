# Retiro solicitado fuera del horario: diagnóstico para backend

2026-10-27. Clasificación: frontend + backend si se permite continuar fuera del horario. Solo cambiar la redacción sería frontend; no eliminaría el rechazo actual.

## Caso y contrato actual

El negocio cierra a las 17:30 y la solicitud es para las 17:35. La captura muestra las 17:29 y «Sí, sin pago previo»: no significa que el negocio esté respondiendo tarde. La hora solicitada queda fuera de la jornada.

La captura coincide con el texto que frontend asigna al código `RESERVATION_OUTSIDE_SERVICE_WINDOW`. No se capturó la petición ni la respuesta HTTP de este intento concreto; la atribución del código se basa en ese texto y en el código revisado.

Backend `src/request-process/simplified-reservation.ts` rechaza una reserva cuando su hora no coincide con ninguna jornada configurada: conflicto 409 `RESERVATION_OUTSIDE_SERVICE_WINDOW`. No es un fallo de transporte ni la regla «Fuera de hora» por primera respuesta atrasada.

Frontend utiliza POST `/request-processes/:id/actions/confirm-availability`, con Authorization Bearer, Idempotency-Key y headers de contrato existentes. Payload relevante, ilustrativo y sin IDs reales:

```json
{
  "expectedVersion": 1,
  "proposalId": 123,
  "fulfillment": {
    "path": "LOCAL_PICKUP",
    "customerMessage": "Mensaje elegido por el negocio",
    "allowCustomerWhatsapp": true,
    "businessContactConsent": {
      "accepted": true,
      "textVersion": "availability-business-whatsapp-v1"
    },
    "reservationOffer": { "mode": "FREE" }
  }
}
```

Respuesta de rechazo definida por el código/contrato actual, no capturada del dispositivo:

```json
{
  "statusCode": 409,
  "code": "RESERVATION_OUTSIDE_SERVICE_WINDOW",
  "message": "La fecha y hora solicitadas están fuera del horario de atención del negocio."
}
```

## Decisión y contrato necesarios antes de implementar

El usuario plantea reemplazar el bloqueo por una advertencia que permita al negocio decidir si atender excepcionalmente. Backend debe definir si se admite esa excepción y cómo se confirma/valida desde el servidor. Todavía no existe un campo acordado para autorizarla; no se propone inventarlo en frontend.

Se debe resolver la ventana efectiva de atención y la vigencia de la reserva: la regla actual limita el apartado al cierre, por lo que cerrar a las 17:30 no permite reservar para las 17:35 simplemente ocultando el error. Definir también compatibilidad de reservas sin pago/con pago, límites y representación para cliente/negocio. Mantener el horario habitual y la fecha original sin modificarlos automáticamente.

Texto orientativo: «La hora solicitada (17:35) está fuera de tu horario de atención, que termina a las 17:30». Una acción para confirmar una atención excepcional solo puede conectarse cuando exista contrato backend y publicación QA. El horario exacto para el aviso debe venir de datos confiables del servidor.

## Archivos revisados y estado

Frontend: `availabilityApi.ts`, `availabilityContract.ts`, `availabilityIntent.ts`, `requestProcessErrors.ts`, `AvailabilityFlowCard.tsx`. Backend, solo lectura: `src/request-process/simplified-reservation.ts` y `docs/testing/pickup-reservations-v3-implementation-qa.md`.

Solo se crea este diagnóstico local. Sin cambios funcionales, pruebas/build nuevos, commit ni despliegue. Rama qa y publicación Vercel conservan `3def779`; Railway no modificado. Main y producción intactos. Pendiente coordinación backend, contrato, pruebas y despliegues QA si se aprueba permitir la excepción.
