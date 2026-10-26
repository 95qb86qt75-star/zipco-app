# PICKUP-RESERVATIONS-V3-01 — Reservas simplificadas y recordatorio de pago

2026-10-26. Clasificación: **frontend + backend**. Integración del contrato
`C:/dev/zipco-backend-qa/docs/testing/pickup-reservations-v3-implementation-qa.md`,
publicado por backend en Railway QA `2e67444`. No se modificó backend, base de datos,
migraciones ni variables Railway desde este workspace.

## Diagnóstico y compatibilidad

El frontend publicado `c3296d8` solo conocía V2, con fechas, tipo de pago e
instrucciones manuales y confirmación posterior de la gratuita. V3 entrega términos
del horario y plazos calculados por servidor. No se pueden reinterpretar las
reservas V2 como automáticas ni eliminar sus campos al leerlas.

Ahora listas, propuestas y acuerdos piden `?processContract=availability-v3`,
compatible con procesos anteriores. Cada mutación usa el header de su propio
proceso: `X-Process-Contract: availability-v3` o `availability-v2`; legacy/S2
conservan su contrato. Se validan los campos públicos y se rechazan mezclas V2/V3.

GET `/request-process-capabilities`, autenticado y sin caché: V3 necesita soporte
`availability-v3` y su flag `simplifiedReservationCreationEnabled:true`. El flag
V2 `reservationCreationEnabled` sigue independiente. Con V3 OFF y V2 ON se crea V2;
con ambos OFF se conserva S2. No hay cambio de ruta tras un envío incierto.

## Funcionamiento

Negocio: dentro del retiro conserva mensaje, horario/dirección y WhatsApp.
Debajo solo tres opciones: Sí sin pago, Sí con pago, No por orden de llegada.
Con pago aparece únicamente el monto; no hay chips, duración, tipo de pago ni
horas manuales de reserva. La autorización de WhatsApp sigue expresa y no se
activa por elegir una modalidad. El monto completo se presenta como pago completo,
no como anticipo. Backend valida monto contra total y determina cierre/horario.

Cliente: DISPONIBLE muestra las condiciones incluso con detalle plegado. Sí,
continuar abre una ventana sin POST. Puede reservar con nota opcional o elegir
ir sin reserva; esta última decisión muestra advertencia de agotamiento y exige
Confirmar que iré. Un plazo de pago rechazado por servidor impide reservar, pero
permite elegir expresamente retiro sin reserva; errores de sesión/lectura no
habilitan una elección a ciegas. Actualizar condiciones relee el pedido.

La gratuita se confirma automáticamente según la oferta, sin simular un clic del
negocio. El seguimiento muestra `reservation.timing` y su origen automático.
El negocio puede cancelar solo el apartado con motivo, sin cancelar el pedido.
La pagada registra la solicitud y abre WhatsApp para coordinar pago/comprobante,
con navegación autorizada del servidor y comprobación de permisos. Una apertura
incierta no se repite automáticamente; la tarjeta ofrece recuperación manual.
No hay Ya pagué ni Iniciar coordinación adicional.

La confirmación permanente del negocio dice **Recibí el pago y aparté el pedido**.
Abre la misma pieza de diseño holográfico usada para coordinación, adaptada al
monto y plazo de retiro. Sí, confirmar declara expresamente ambos hechos; Aún no
o cerrar no ejecuta acción. El botón persiste aunque no se haya abierto WhatsApp
desde ZIPCO.

El recordatorio requiere una visita de retorno, cuatro segundos visibles y un GET
nuevo del pedido. Verifica actor, proceso, reserva, versión y
`paymentConfirmationReminder.eligible` junto con allowedActions. Deduplica eventos
focus/pageshow/visibilitychange por visita y versión y no superpone otro diálogo.
La marca local contiene identificadores, fecha de visita y versiones vistas;
nunca guarda teléfono, URL, comprobante ni token. No identifica qué aplicación
externa se visitó y no acredita transferencia. Cambiar sesión invalida el aviso.

Alternativas, contrapropuestas y final incluyen elección condicionada V3 y
consentimientos propios; el apartado nace solo al acuerdo. La final conserva el
camino y permite revisar monto, sin volver a elegir canal ni copiar términos
públicos como entrada de la API. Horario/cierre, plazos definitivos y permisos de
Listo continúan siendo autoridad del servidor. Los pedidos V2 y sin reserva
mantienen sus recorridos.

## Contrato utilizado

- Creación: POST `/orders/availability-reservation-v3-requests`, DTO comercial
  existente + `customerContactPreference`, JWT y clave UUID de idempotencia.
- `fulfillment.reservationOffer`: `{mode:NONE}`, `{mode:FREE}` o
  `{mode:PREPAYMENT,requiredAmountClp}`. No enviar hashes ni horas como oferta.
- Lectura pública: oferta con `simplified` (version, termsVersion, scheduleHash,
  opensAt, closesAt, scheduledFor, timeZone, holdMinutes). Pago agrega monto/tipo.
- GET `/request-processes/:id/reservation-options?processContract=availability-v3`
  verifica versión, oferta y previewTiming antes de la decisión del cliente.
- Continue/accept/counter agregan `reservationChoice` con offerId, choice,
  termsVersion cuando corresponde, note opcional y
  `noReservationAcknowledged:true` para retiro NONE. WhatsApp ordinario no lleva
  elección de retiro en el POST y conserva coordinación anterior.
- Lectura posterior: `reservation.timing`, `confirmationSource` y
  `reservationFollowUp.paymentConfirmationReminder` ligados a reserva/versión.
- Nueva acción `cancel-pickup-reservation`: expectedVersion, reservationId,
  reasonDetail. Mantiene el pedido activo.
- `confirm-pickup-reservation`: declaraciones entireOrderHeldDeclared y
  requiredPaymentReceivedDeclared; `open-reservation-whatsapp`: purpose RECEIPT
  o CLARIFICATION. Las demás acciones V2 y endpoints se conservan por versión.

Los recibos mínimos de POST se releen antes de usar permisos o abrir una URL.
Un POST confirmado no se repite por fallar la lectura. Apertura automática de
comprobante y acción manual usan el mismo control de idempotencia. Los conflictos
de horario, fecha programada, margen de pago o términos requieren revisión; no
se inventa cierre ni se cambia el pedido mediante la nota.

## Archivos principales

- `simplifiedReservationContract.ts`, `reservationContract.ts`,
  `reservationCapabilities.ts`, `reservationOptions.ts`, `requestProcess.ts`:
  normalización, campos V3, compatibilidad y lecturas.
- `CheckoutScreen.tsx`, `createOrderApi.ts`: selección de creación por capacidad.
- `SimpleReservationOfferFields.tsx`, `ReservationDecisionDialog.tsx`,
  `ReservationOfferSummary.tsx`, `availability-design/AvailabilityDesign.tsx`,
  `AvailabilityFlowCard.tsx`: formulario y ventana real de decisión.
- `ProposalNegotiation.tsx`, `ReservationChoiceFields.tsx`,
  `availabilityChoice.ts`: negociación y conservación del camino.
- `ReservationPanel.tsx`, `CoordinationSheets.tsx`,
  `usePaymentConfirmationReminder.ts`, `useAvailability.ts`, `useReservation.ts`,
  `startReservationPayment.ts`: confirmación, recordatorio y WhatsApp contextual.
- `availabilityContract.ts`, `requestProcessErrors.ts`,
  `BusinessNotificationMonitor.tsx`: lector compatible y errores comprensibles.
- Nuevas pruebas/fixtures V3, expectativas de lectores existentes y
  `scripts/check-reservation-v3-flow.mjs`; regresiones V2/S2 actualizadas al lector
  V3. Ningún documento previo ajeno se incluyó en esta entrega.

## Verificación

**1.395 pruebas / 116 archivos aprobados**, incluida la suite completa, permisos
del recordatorio, retorno repetido, sesiones, ausencia de pago verificado,
recuperación de WhatsApp, metadatos por versión y flags independientes.

**38 escenarios sintéticos de navegador aprobados**: 13 V3 (gratuita automática
en 320/390/430, fecha programada, tres variantes sin reserva, pago y recordatorio,
V3 OFF con V2 ON, alternativas, contrapropuesta, final y plazo insuficiente),
nueve V2, diez S2/negociación y seis de checkout/EN ESPERA. Componentes reales y
HTTP simulado; cero pedidos QA reales creados/modificados. Capturas en caché
`node_modules/.cache/reservation-v3-flow`, revisadas para formulario, ventana y
holograma. No acreditan transferencias, inventario físico ni comportamiento iOS.

Build QA/PWA aprobado, destino API QA fijado solo para el proceso. Advertencia
habitual del bundle mayor de 500 kB. No hay comando separado tsc/lint configurado
en este repositorio; no se declara una ejecución independiente.
GET Railway QA raíz200 y capacidades sin sesión401. Eso acredita disponibilidad
y protección, no lectura autenticada del valor del flag ni recorrido real.

## Publicación y siguiente paso

Preparado para GitHub en `qa`; registrar SHA y Vercel READY después de publicar.
Identidad Git anterior conservada; sin Vercel CLI deploy ni reescritura histórica.
Main conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta.

Mantener V3 sin activar hasta coordinar backend y actualizar ambos celulares.
El flag nuevo es `SIMPLIFIED_RESERVATION_CREATION_ENABLED`, no el de V2. Solo
pedidos nuevos creados como V3 mostrarán el formulario reducido; los V2 no se
convierten. Pendiente prueba autenticada real Android/iPhone: gratuita Ahora y
programada, pago, regreso y Aún no/Sí, confirmación manual sin regreso, plazos,
cancelación/aclaraciones, Listo/recepción y regresión V2.
