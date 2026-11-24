# RESERVATION-ERRORS-RECOVERY-03 — Motivos precisos y Comprobar pedido

2026-10-26. Clasificación: **frontend + backend**, integrando backend QA8993485
ya publicado. Sin modificaciones backend, migraciones, Railway, plazos, fechas,
consentimientos ni datos de usuarios desde frontend.

## Contrato y diagnóstico

Leída la sección14 de
`C:/dev/zipco-backend-qa/docs/testing/pickup-reservations-v3-implementation-qa.md`.
HTTP409 ahora distingue RESERVATION_OUTSIDE_SERVICE_WINDOW (cero jornadas para
fecha/hora solicitadas) y RESERVATION_AMBIGUOUS_SERVICE_WINDOW (varias jornadas).
No interpretar una solicitud programada fuera de atención como negocio cerrado
en este instante. Se conserva fallback HOURS_UNAVAILABLE,400
INVALID_RESERVATION_TERMS y409 PAYMENT_WINDOW_UNAVAILABLE.

El bloqueo fotografiado «Hay una operación pendiente» era local: availabilityIntent
conservaba como incierto un rechazo inicial409 de horario y bloqueaba cuerpos
editados. A veces ese último intento ni siquiera llegaba al servidor. Cambiar solo
el texto no resolvía el bloqueo. Los registros antiguos guardan clave/acción/
versión/huella, no el cuerpo; no se puede inventar el texto anterior para reenviarlo.

Se contrastó `availability.service.ts`: bajo lock/transacción comprueba actor,
clave/hash, expectedVersion, estado pendiente, ausencia de acuerdo/plan y propuesta
exacta. Una confirmación crea el plan y avanza versión/estado atómicamente. Este
control existente impide crear una segunda disponibilidad si una petición antigua
termina justo después de la comprobación. No se agregó un endpoint de recuperación.

## Cambio frontend

- `requestProcessErrors.ts`: mensajes distintos para fuera de atención y horarios
  superpuestos. Conserva fallback antiguo y separación de horario incompleto y
  margen menor30min; sin eco de mensajes internos.
- `reservationOptions.ts`: los nuevos motivos también permiten elegir
  explícitamente ir sin reserva tras rechazo de preview, sin convertir la opción
  automáticamente ni calcular fechas desde el móvil.
- `availabilityIntent.ts`: una confirmación inicialmente rechazada por un código
  conocido no queda congelada como envío incierto; puede corregirse y enviarse
  mediante un toque nuevo. Si hubo incertidumbre previa, no descarta la clave solo
  porque otro intento devuelva un error de validación.
- Sustituye el mensaje técnico por «No pudimos comprobar si tu respuesta se envió.
  Conservamos lo que escribiste. Pulsa Comprobar pedido antes de volver a enviarla».
  Resultados confirmados no se vuelven a enviar.
- `useAvailability.ts`: Comprobar pedido solo hace GET autorizado actual. Descarta
  lecturas anteriores a la versión visible y cambios de sesión. Si sigue esperando
  la confirmación del negocio, con misma versión, sin plan/acuerdo y permiso vigente,
  permite preparar otro envío explícito. No olvida una petición todavía en ejecución
  local ni una confirmación conocida que contradiga una lectura atrasada. Si la
  versión avanzó, reconcilia el resultado sin repetir el POST.
- La recuperación queda acotada a CONFIRM_AVAILABILITY del negocio. No libera
  indiscriminadamente decisiones del cliente, otras acciones o cuentas. Fallar GET
  o limpieza de almacenamiento conserva la protección y explica qué hacer.
- `AvailabilityFlowCard.tsx`, `availability-design/AvailabilityDesign.tsx`: botón
  Comprobar pedido dentro del formulario, estado Comprobando (no Guardando) y
  resultado legible. Conserva mensaje, dirección/horario, monto, modalidad y permiso.
- `coordinationApi.ts`: lectura de lista con cache:no-store para comprobar estado.

No hay reenvío automático después de GET, ni se vacía el formulario. Si una
confirmación anterior gana una carrera en servidor, el nuevo envío explícito falla
por versión; no sobrescribe las condiciones que ya recibió el cliente.

## Endpoints y campos existentes

POST `/request-processes/:id/actions/confirm-availability`: expectedVersion,
proposalId, fulfillment, oferta mínima V3 y consentimiento propio, header V3,
JWT y clave UUID existentes. Solo los códigos públicos descritos arriba son nuevos
en backend; no se agregaron campos de API desde frontend.

GET `/orders/business/:businessId?processContract=availability-v3` para comprobar
el pedido del negocio. Usa id, versión, estado, propuesta actual, disponibilidad,
acuerdo y allowedActions normalizados. La comprobación no registra una decisión
en backend. La recuperación local sigue vinculada a actor/proceso y conserva solo
metadatos; no persiste mensajes, teléfonos o URLs nuevos.

## Validación

1.419 pruebas/118 archivos aprobados, suite completa;46 pruebas relacionadas
repetidas tras la guarda final de recuperación. Build QA/PWA aprobado con API QA
fijada solo para el proceso; advertencia previa de bundle mayor500kB. No comando
tsc/lint separado configurado en frontend.

19 escenarios de navegador V3 aprobados, componentes reales con HTTP sintético:
incluyen ambos códigos nuevos, campos conservados, comprobación GET fallida,
pérdida de conexión antes de guardar y pérdida de respuesta después de guardar.
En este último caso se comprueba cero reenvíos y condiciones originales intactas.
Pruebas de intención cubren confirmación concurrente entre GET y envío explícito,
resultados confirmados, petición en ejecución, otra cuenta/acción y versión inválida.
No se ejercitaron pedidos QA reales ni transferencias. El ensayo físico reportado
sigue acreditando solo disponibilidad entre celulares, no pago/apartado/Listo.

Preparado para GitHub ramaqa con identidad anterior. Main/prod intactos. Publicar
frontend y comprobar Vercel READY antes de pedir nueva prueba en teléfonos.

Publicado GitHub `qa`: `63a3d7e87e54ff79747efccf3ca233ecfce2bc00`.
Vercel READY `dpl_EfhrctvFhKETQk6BNgnXFx8FX64J`, alias QA habitual verificado.
Bundle servido comprobado: SHA exacto, dos códigos nuevos, explicación sin jerga,
botón Comprobar pedido y API QA. GET raíz Railway200; no lectura JWT propia ni
acciones contra pedidos reales. Cierre documental respaldado aparte con código
idéntico. Main conserva8295ab8c6024ab20851ebd371308d2f299b4668f y producción intacta.
